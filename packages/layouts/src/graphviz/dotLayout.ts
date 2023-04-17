import { Graphviz } from "@hpcc-js/wasm/graphviz";
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
import invariant from 'tiny-invariant'
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
  [containerX, containerY]: Point = [0,0]
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
          pt: [
            pointToPx(draw.pt[0]) - containerX,
            pointToPx(draw.pt[1]) - containerY,
          ],
          align: toKonvaAlign(draw.align),
          width: pointToPx(draw.width)
        })
      }
      continue
    }
  }
  return labels
}

function parseEdgePoints({ _draw_ }: GraphvizJson.Edge): DiagramEdge['points'] {
  const b = _draw_.find(propEq('op', 'b'))
  invariant(b, 'edge should have a bezier curve')
  return b.points.map(([x, y]) => [pointToPx(x), pointToPx(y)])
}

function parseEdgeHeadPolygon({ _hdraw_ }: GraphvizJson.Edge): DiagramEdge['headArrow'] {
  const p = _hdraw_?.find(propEq('op', 'P'))
  if (p) {
    return p.points.map(([x, y]) => [pointToPx(x), pointToPx(y)])
  }
  return undefined
}

function layout(graphviz: Graphviz, computedView: ComputedView): DiagramView {
  const dotSource = printToDot(computedView)
  const { nodes: computedNodes, edges: computedEdges, ...view } = computedView

  const rawjson = graphviz.dot(dotSource, 'json', {
    yInvert: true
  })

  const graphvizJson = JSON.parse(rawjson) as GraphvizJson

  const pageBBox = parseBB(graphvizJson.bb)

  const diagram: DiagramView = {
    ...view,
    width: pageBBox.width,
    height: pageBBox.height,
    nodes: [],
    edges: []
  }

  const diagramNodes = new Map<NodeId, DiagramNode>()

  invariant(graphvizJson.objects, 'graphvizJson.objects is undefined')
  for (const obj of graphvizJson.objects) {
    if (!('id' in obj)) {
      continue
    }
    const computed = computedNodes.find(n => n.id === obj.id)
    invariant(computed, `Node ${obj.id} not found in computedNodes`)

    const {
      x, y,
      ...size
    } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj)

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

  invariant(graphvizJson.edges, 'graphvizJson.edges is undefined')
  for (const e of graphvizJson.edges) {
    const edgeData = computedEdges.find(i => i.id === e.id)
    invariant(edgeData, `Edge ${e.id} not found, how did it get into the graphviz output?`)
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
  return layout(graphviz, computedView)
}

export async function dotLayouter(): Promise<DiagramLayoutFn> {
  const graphviz = await Graphviz.load()
  return computedView =>
    new Promise<DiagramView>((resolve, reject) => {
      try {
        resolve(layout(graphviz, computedView))
      } catch (e) {
        reject(e)
      }
    })
}
