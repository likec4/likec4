import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView, DiagramEdge, DiagramLabel, DiagramNode, DiagramView, Point } from '@likec4/core'
import { invariant } from '@likec4/core'
import { dropRepeats, propEq } from 'rambdax'
import type { DiagramLayoutFn } from '../types'
import { IconSize, inchToPx, pointToPx, toKonvaAlign } from './graphviz-utils'
import { printToDot } from './printToDot'
import type { BoundingBox, GVPos, GraphvizJson } from './types'

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
  let color: DiagramLabel['color']
  let fontStyle: DiagramLabel['fontStyle']

  for (const draw of _ldraw_) {
    if (draw.op === 'F') {
      fontSize = pointToPx(draw.size)
      continue
    }
    if (draw.op === 'c') {
      color = draw.color as DiagramLabel['color']
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
          ...(color ? { color } : {}),
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
  invariant(pos.startsWith('e,'), 'edge should start with e,')
  const posStr = pos.substring(2)
  const posParts = posStr.split(' ')
  const points = posParts.map((p: string): Point => {
    const { x, y } = parsePos(p)
    return [x, y]
  })
  const endpoint = points.shift()
  invariant(endpoint, 'edge should have endpoint')
  return [...points, endpoint]
}

function parseEdgeHeadPolygon({ _hdraw_ }: GraphvizJson.Edge): DiagramEdge['headArrow'] {
  const p = _hdraw_?.find(propEq('op', 'P'))
  if (p) {
    return p.points.map(([x, y]) => [pointToPx(x), pointToPx(y)])
  }
  return undefined
}

export function dotLayoutFn(graphviz: Graphviz, computedView: ComputedView): DiagramView {
  // const dot = graphviz.unflatten(printToDot(computedView), 3, true, 2)
  const dot = printToDot(computedView)

  const { nodes: computedNodes, edges: computedEdges, ...view } = computedView

  const icons = dropRepeats(computedNodes.flatMap(node => (node.icon ? [node.icon] : [])))

  const rawjson = graphviz.dot(dot, 'json', {
    images: icons.map(path => ({ path, width: IconSize, height: IconSize })),
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

  // const diagramNodes = new Map<NodeId, DiagramNode>()

  const graphvizObjects = graphvizJson.objects ?? []
  for (const { likec4_id, ...obj } of graphvizObjects) {
    if (!likec4_id) {
      continue
    }
    const computed = computedNodes.find(n => n.id === likec4_id)
    if (!computed) {
      console.warn(`Node likec4_id=${likec4_id} not found, how did it get into the graphviz output?`)
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
    diagram.nodes.push(node)
  }

  const graphvizEdges = graphvizJson.edges ?? []
  for (const { likec4_id, ...e } of graphvizEdges) {
    if (!likec4_id) {
      continue
    }
    const edgeData = computedEdges.find(i => i.id === likec4_id)
    if (!edgeData) {
      console.warn(`Edge ${likec4_id} not found, how did it get into the graphviz output?`)
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
