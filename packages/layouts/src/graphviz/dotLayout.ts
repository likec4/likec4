import type { Graphviz } from '@hpcc-js/wasm/graphviz'
import type {
  BBox as LabelBBox,
  ComputedEdge,
  ComputedView,
  DiagramEdge,
  DiagramLabel,
  DiagramNode,
  DiagramView,
  EdgeId,
  NonEmptyArray,
  Point
} from '@likec4/core'
import { invariant } from '@likec4/core'
import { first, hasAtLeast, last, maxBy, uniq } from 'remeda'
import { toDot } from './printToDot'
import type { DotLayoutResult, DotSource } from './types'
import type { BoundingBox, GraphvizJson, GVPos } from './types-dot'
import { IconSize, inchToPx, pointToPx, toKonvaAlign } from './utils'

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
  try {
    const [x, y] = pos.split(',') as [string, string]
    return {
      x: pointToPx(parseFloat(x)),
      y: pointToPx(parseFloat(y))
    }
  } catch (e) {
    console.error(`failed on parsing pos: ${pos}`)
    throw e
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
function parseEdgePoints({ _draw_, likec4_id = '???' as EdgeId }: GraphvizJson.Edge): DiagramEdge['points'] {
  try {
    const bezierOps = _draw_.filter((v): v is GraphvizJson.DrawOps.BSpline => v.op.toLowerCase() === 'b')
    invariant(hasAtLeast(bezierOps, 1), `edge ${likec4_id} should have at least one bezier draw op`)
    if (bezierOps.length > 1) {
      console.warn(`edge ${likec4_id} has more than one bezier draw op, using the first one only`)
    }
    const points = bezierOps[0].points.map(p => pointToPx(p))
    invariant(hasAtLeast(points, 2), `edge ${likec4_id}should have at least two points`)
    return points
  } catch (e) {
    console.error(`failed on parsing edge ${likec4_id} _draw_:\n${JSON.stringify(_draw_, null, 2)}`)
    throw e
  }
}
function parseEdgeArrowPos(pos: string): Pick<DiagramEdge, 'headArrowPoint' | 'tailArrowPoint'> {
  try {
    const result = {} as Pick<DiagramEdge, 'headArrowPoint' | 'tailArrowPoint'>
    // we interested only in the first two parts (according to the graphviz docs)
    const parts = pos.split(' ').slice(0, 3)
    for (const part of parts) {
      const isTail = part.startsWith('s,')
      const isHead = part.startsWith('e,')
      if (isTail || isHead) {
        const { x, y } = parsePos(part.substring(2))
        if (isTail) {
          result.tailArrowPoint = [x, y]
        } else {
          result.headArrowPoint = [x, y]
        }
      }
    }
    return result
  } catch (e) {
    console.error(`failed on parsing edge pos: ${pos}`)
    throw e
  }
}

function parseEdgeArrowPolygon(edgeDebugId: string, ops: GraphvizJson.DrawOp[]): NonEmptyArray<Point> | undefined {
  try {
    const polygons = ops.filter((v): v is GraphvizJson.DrawOps.Polygon => v.op.toLowerCase() === 'p')
    invariant(hasAtLeast(polygons, 1), `edge ${edgeDebugId} arrow should have at least one polygon`)
    if (polygons.length > 1) {
      console.warn(`edge ${edgeDebugId} arrow has more than one polygon, using the first one only`)
    }
    const p = polygons[0]
    const points = p.points.map(p => pointToPx(p))
    invariant(hasAtLeast(points, 1))
    return points
  } catch (e) {
    console.error(`failed on parsing edge ${edgeDebugId} arrow polygon:\n${JSON.stringify(ops, null, 2)}`)
    return undefined
  }
}

function parseGraphvizEdge(graphvizEdge: GraphvizJson.Edge, computedEdges: ComputedEdge[]): DiagramEdge | null {
  if (!graphvizEdge.likec4_id) {
    return null
  }
  const edgeData = computedEdges.find(i => i.id === graphvizEdge.likec4_id)
  if (!edgeData) {
    console.warn(`Edge ${graphvizEdge.likec4_id} not found, how did it get into the graphviz output?`)
    return null
  }
  const edge: DiagramEdge = {
    ...edgeData,
    points: parseEdgePoints(graphvizEdge)
  }
  if (graphvizEdge.pos) {
    Object.assign(edge, parseEdgeArrowPos(graphvizEdge.pos))
  }

  const labels = parseLabelDraws(graphvizEdge)
  if (hasAtLeast(labels, 1)) {
    const labelBBox = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    } as LabelBBox
    // edge label is inside table with cell spacing 4
    const labelPadding = pointToPx(4)
    // first label has the lowest y
    const _first = first(labels)
    labelBBox.y = _first.pt[1] - _first.fontSize - labelPadding

    // x and width - from the label with max width
    const _maxWidth = maxBy(labels, l => l.width) ?? labels[0]
    labelBBox.x = _maxWidth.pt[0] - labelPadding
    labelBBox.width = _maxWidth.width + labelPadding * 2

    // height - y from the last label
    const _last = last(labels)
    const lastY = _last.pt[1] + labelPadding
    labelBBox.height = lastY - labelBBox.y
    edge.labels = labels
    edge.labelBBox = labelBBox
  }

  const hdraw = graphvizEdge._hdraw_ && parseEdgeArrowPolygon(edge.id + ' head ', graphvizEdge._hdraw_)
  const tdraw = graphvizEdge._tdraw_ && parseEdgeArrowPolygon(edge.id + ' tail ', graphvizEdge._tdraw_)

  if (hdraw) {
    edge.headArrow = hdraw
  }
  if (tdraw) {
    edge.tailArrow = tdraw
  }
  return edge
}

export function dotLayoutFn(graphviz: Graphviz, computedView: ComputedView): DotLayoutResult {
  const initialDot = toDot(graphviz, computedView)
  const dot = initialDot

  const { nodes } = computedView

  const images = uniq(nodes.flatMap(node => (node.icon ? [node.icon] : []))).map(path => ({
    path,
    width: IconSize,
    height: IconSize
  }))

  const rawjson = graphviz.dot(dot, 'json', {
    images,
    yInvert: true
  })

  const diagram = parseGraphvizJson(rawjson, computedView)

  return {
    dot: dot
      .split('\n')
      .filter(l => !l.includes('margin=33.21'))
      .join('\n') as DotSource,
    diagram
  }
}

export function parseGraphvizJson(json: string, computedView: ComputedView): DiagramView {
  const graphvizJson = JSON.parse(json) as GraphvizJson
  const page = parseBB(graphvizJson.bb)
  const { nodes: computedNodes, edges: computedEdges, ...view } = computedView

  const diagram: DiagramView = {
    ...view,
    width: page.x + page.width,
    height: page.y + page.height,
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
      console.warn(
        `Node likec4_id=${likec4_id} not found, how did it get into the graphviz output?`
      )
      continue
    }

    const { x, y, width, height } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj)

    const position = [x, y] as Point

    const node: DiagramNode = {
      ...computed,
      position,
      width,
      height,
      labels: parseLabelDraws(obj, position)
    }
    diagram.nodes.push(node)
  }

  const graphvizEdges = graphvizJson.edges ?? []
  for (const graphvizEdge of graphvizEdges) {
    try {
      const edge = parseGraphvizEdge(graphvizEdge, computedEdges)
      if (!edge) {
        continue
      }
      diagram.edges.push(edge)
    } catch (e) {
      console.error(`failed on parsing edge ${graphvizEdge.likec4_id}:\n${String(e)}`)
    }
  }

  return diagram
}
