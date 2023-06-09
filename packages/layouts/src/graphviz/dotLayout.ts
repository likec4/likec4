import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type {
  ComputedView,
  DiagramEdge,
  DiagramNode,
  DiagramLabel,
  DiagramView,
  NodeId,
  Point
} from '@likec4/core/types'
import { propEq } from 'rambdax'
import { invariant } from '@likec4/core'
import type { DiagramLayoutFn } from '../types'
import type { BoundingBox, GVPos, GraphvizJson } from './graphviz-types'
import { inchToPx, pointToPx, toKonvaAlign } from './graphviz-utils'
import { printToDot } from './printToDot'

function parseBB(bb: string | undefined): BoundingBox {
  const [llx, lly, urx, ury] = bb
    ? (bb.split(',').map(p => pointToPx(+p)) as [number, number, number, number])
    : [0, 0, 0, 0]
  const width = Math.ceil(urx - llx)
  const height = Math.ceil(lly - ury)
  return {
    // x: llx - width / 2,
    // y: lly - height / 2,
    x: Math.ceil(llx),
    y: Math.ceil(ury),
    width,
    height
  }
}

function parsePos(pos: string): GVPos {
  const [x, y] = pos.split(',') as [string, string]
  return {
    x: pointToPx(+x),
    y: pointToPx(+y)
  }
}

function parseNode({ pos, width, height }: GraphvizJson.GvNodeObject): BoundingBox {
  // const cpos = prsePos(posStr, page)
  const { x, y } = parsePos(pos)
  const w = inchToPx(+width)
  const h = inchToPx(+height)
  return {
    x: x - Math.ceil(w / 2),
    y: y - Math.ceil(h / 2),
    width: w,
    height: h
  }
}

function parseLabelDraws(
  { _ldraw_ = [] }: GraphvizJson.GvObject | GraphvizJson.Edge,
  [containerX, containerY]: Point = [0, 0]
): DiagramLabel[] {
  const labels = [] as DiagramLabel[]

  let fontSize: number | undefined
  let fontStyle: DiagramLabel['fontStyle']

  for (const draw of _ldraw_) {
    if (draw.op === 'F') {
      fontSize = pointToPx(draw.size)
      continue
    }
    if (draw.op === 't') {
      if (draw.fontchar === 1) {
        fontStyle = 'bold'
      } else {
        fontStyle = undefined
      }
      continue
    }
    if (draw.op === 'T') {
      if (fontSize && draw.text.trim() !== '') {
        labels.push({
          fontSize,
          ...(fontStyle ? { fontStyle } : {}),
          text: draw.text,
          pt: [pointToPx(draw.pt[0]) - containerX, pointToPx(draw.pt[1]) - containerY],
          align: toKonvaAlign(draw.align),
          width: pointToPx(draw.width)
        })
      }
      continue
    }
  }
  return labels
}

// Discussion:
//   https://forum.graphviz.org/t/how-to-interpret-graphviz-edge-coordinates-from-xdot-or-json/879/11
// Example:
//   https://github.com/hpcc-systems/Visualization/blob/trunk/packages/graph/workers/src/graphviz.ts#L38-L93
function parseEdgePoints({ pos }: GraphvizJson.Edge): DiagramEdge['points'] {
  invariant(pos, 'edge should pos')
  const posStr = pos.substring(2)
  const points = posStr.split(' ').map((p: string): Point => {
    const { x, y } = parsePos(p)
    return [x, y]
  })
  const endpoint = points.shift()
  invariant(endpoint, 'edge should have endpoint')
  return points
}

function parseEdgeHeadPolygon({ _hdraw_ }: GraphvizJson.Edge): DiagramEdge['headArrow'] {
  const p = _hdraw_?.find(propEq('op', 'P'))
  if (p) {
    return p.points.map(([x, y]) => [pointToPx(x), pointToPx(y)])
  }
  return undefined
}

export function dotLayoutFn(graphviz: Graphviz, computedView: ComputedView): DiagramView {
  const dot = graphviz.unflatten(printToDot(computedView), 2, true, 2)
  // const dot = printToDot(computedView)

  const { nodes: computedNodes, edges: computedEdges, ...view } = computedView

  const rawjson = graphviz.dot(dot, 'json', {
    yInvert: true
  })

  const graphvizJson = JSON.parse(rawjson) as GraphvizJson

  const page = parseBB(graphvizJson.bb)

  const diagram: DiagramView = {
    ...view,
    width: page.x + page.width,
    height: page.y + page.height,
    boundingBox: page,
    nodes: [],
    edges: []
  }

  const diagramNodes = new Map<NodeId, DiagramNode>()

  const graphvizObjects = graphvizJson.objects ?? []
  for (const obj of graphvizObjects) {
    if (!('id' in obj)) {
      continue
    }
    const computed = computedNodes.find(n => n.id === obj.id)
    if (!computed) {
      console.warn(`Node ${obj.id} not found, how did it get into the graphviz output?`)
      continue
    }

    const { x, y, ...size } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj)

    const position = [x, y] as Point

    const node: DiagramNode = {
      ...computed,
      position,
      size,
      labels: parseLabelDraws(obj, position)
    }
    diagramNodes.set(computed.id, node)
    diagram.nodes.push(node)
  }

  const graphvizEdges = graphvizJson.edges ?? []
  for (const e of graphvizEdges) {
    if (!('id' in e)) {
      continue
    }
    const edgeData = computedEdges.find(i => i.id === e.id)
    if (!edgeData) {
      console.warn(`Edge ${e.id} not found, how did it get into the graphviz output?`)
      continue
    }
    const edge: DiagramEdge = {
      ...edgeData,
      points: parseEdgePoints(e),
      labels: parseLabelDraws(e)
    }
    const headArrow = parseEdgeHeadPolygon(e)
    if (headArrow) {
      edge.headArrow = headArrow
    }
    diagram.edges.push(edge)
  }

  return diagram
}

export const dotLayout: DiagramLayoutFn = async computedView => {
  const graphviz = await Graphviz.load()
  try {
    return dotLayoutFn(graphviz, computedView)
  } finally {
    Graphviz.unload()
  }
}

export async function dotLayouter() {
  const graphviz = await Graphviz.load()
  // return {
  //   dotLayout: (computedView: ComputedView) => dotLayoutFn(graphviz, computedView),
  //   dispose: () => {
  //     Graphviz.unload()
  //   }
  // }
  // Graphviz.unload()
  return (computedView: ComputedView) =>
    new Promise<DiagramView>((resolve, reject) => {
      try {
        resolve(dotLayoutFn(graphviz, computedView))
      } catch (e) {
        reject(e)
      }
    })
}
