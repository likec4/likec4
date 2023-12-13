import type { Graphviz } from '@hpcc-js/wasm/graphviz'
import type {
  ComputedView,
  DiagramEdge,
  DiagramLabel,
  DiagramNode,
  DiagramView,
  BBox as LabelBBox,
  NonEmptyArray,
  Point
} from '@likec4/core'
import { invariant } from '@likec4/core'
import { first, hasAtLeast, isTruthy, last, maxBy, uniq } from 'remeda'
import { toDot } from './printToDot'
import type { BoundingBox, GVPos, GraphvizJson } from './types'
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
function parseEdgePoints({ _draw_ }: GraphvizJson.Edge): DiagramEdge['points'] {
  const p = _draw_.find(({ op }) => op.toLowerCase() === 'b')
  invariant(p, 'edge should have bezier draw ops')
  invariant(p.op === 'b' || p.op === 'B', 'edge should have points for spline')
  const points = p.points.map(([x, y]) => [pointToPx(x), pointToPx(y)] satisfies Point)
  invariant(hasAtLeast(points, 1))
  return points
}

function parseEdgeArrowPolygon(ops: GraphvizJson.DrawOps[]): NonEmptyArray<Point> | undefined {
  const polygons = ops.filter(({ op }) => op === 'P' || op === 'p')
  invariant(polygons.length === 1, 'edge arrow should have only one polygon')
  const p = polygons[0]
  invariant(p && (p.op === 'p' || p.op === 'P'))
  const points = p.points.map(([x, y]) => [pointToPx(x), pointToPx(y)] satisfies Point)
  invariant(hasAtLeast(points, 1))
  return points
}

export type DotLayoutResult = {
  dot: string
  diagram: DiagramView
}
export function dotLayoutFn(graphviz: Graphviz, computedView: ComputedView): DotLayoutResult {
  const initialDot = toDot(graphviz, computedView)
  const dot = initialDot

  const { nodes: computedNodes, edges: computedEdges, ...view } = computedView

  const images = uniq(computedNodes.flatMap(node => (node.icon ? [node.icon] : []))).map(path => ({
    path,
    width: IconSize,
    height: IconSize
  }))

  const rawjson = graphviz.dot(dot, 'json', {
    images,
    yInvert: true
  })

  const graphvizJson = JSON.parse(rawjson) as GraphvizJson
  const page = parseBB(graphvizJson.bb)

  // const fixedDot = dot.replace(/label=(<<[^\n\r]*>>)/g,(match, p1) => `label="${p1.replace(/"/g, '\\"')}"`)
  // try {
  //   const width = page.x + page.width,
  //     height = page.y + page.height
  //   const model = fromDot(fixedDot, {
  //     parse: {
  //       startRule: 'Dot'
  //     }
  //   })
  //   model.attributes.graph.set(_.size, `${pxToInch(width + 10)},${pxToInch(height + 10)}!`)
  //   model.attributes.graph.set(_.ratio, 'fill')
  //   dot = printToDot(model)
  //   Graphviz.unload()
  //   graphviz = await Graphviz.load()
  //   const newjsonn = graphviz.dot(dot, 'json', {
  //     images,
  //     yInvert: true
  //   })
  //   graphvizJson = JSON.parse(newjsonn) as GraphvizJson
  //   page = parseBB(graphvizJson.bb)
  // } catch (e) {
  //   console.error(e)
  //   console.error('initial ---------------------------------')
  //   console.error(initialDot)
  //   console.error('fixedDot ---------------------------------')
  //   console.error(fixedDot)
  //   console.error('dot ---------------------------------')
  //   console.error(dot)
  // }

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
      points: parseEdgePoints(e)
    }

    const labels = parseLabelDraws(e)
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

    const hdraw = e._hdraw_ && parseEdgeArrowPolygon(e._hdraw_)
    const tdraw = e._tdraw_ && parseEdgeArrowPolygon(e._tdraw_)

    // if (edgeData.head === 'none' && edgeData.tail && edgeData.tail !== 'none') {
    //   // edge is reversed inside printToDot
    //   if (hdraw) {
    //     edge.tailArrow = hdraw
    //   }
    //   if (tdraw) {
    //     edge.headArrow = tdraw
    //   }
    // } else {
    if (hdraw) {
      edge.headArrow = hdraw
    }
    if (tdraw) {
      edge.tailArrow = tdraw
    }
    // }

    diagram.edges.push(edge)
  }

  return {
    dot: dot
      .split('\n')
      .filter(l => !l.includes('margin=33.21'))
      .join('\n'),
    diagram
  }
}
