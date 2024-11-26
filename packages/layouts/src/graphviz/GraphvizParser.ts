import type {
  BBox as LabelBBox,
  ComputedEdge,
  ComputedView,
  DiagramEdge,
  DiagramView,
  EdgeId,
  OverviewGraph,
  Point,
  ViewID
} from '@likec4/core'
import { invariant, nonNullable } from '@likec4/core'
import { logger } from '@likec4/log'
import { hasAtLeast, isTruthy } from 'remeda'
import { EDGE_LABEL_MAX_CHARS, wrap } from './dot-labels'
import type { BoundingBox, GraphvizJson, GvId, GVPos } from './types-dot'
import { inchToPx, pointToPx } from './utils'

function parseBB(bb: string | undefined): BoundingBox {
  const [llx, lly, urx, ury] = bb
    ? (bb.split(',').map(p => pointToPx(+p)) as [number, number, number, number])
    : [0, 0, 0, 0]
  const width = Math.round(urx - llx)
  const height = Math.round(lly - ury)
  return {
    // x: llx - width / 2,
    // y: lly - height / 2,
    x: Math.round(llx),
    y: Math.round(ury),
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
    logger.warn(`failed on parsing pos: ${pos}`, e)
    throw e
  }
}

function parseNode({ pos, width, height }: GraphvizJson.GvNodeObject): BoundingBox {
  // const cpos = prsePos(posStr, page)
  const { x, y } = parsePos(pos)
  const w = inchToPx(+width)
  const h = inchToPx(+height)
  return {
    x: x - Math.round(w / 2),
    y: y - Math.round(h / 2),
    width: w,
    height: h
  }
}

function parseLabelBbox(
  labelDrawOps: GraphvizJson.LabelDrawOps[] | undefined,
  [containerX, containerY]: Point = [0, 0]
): LabelBBox | null {
  if (!labelDrawOps || labelDrawOps.length === 0) {
    return null
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  let fontSize = 13

  try {
    for (const draw of labelDrawOps) {
      if (draw.op === 'F') {
        fontSize = pointToPx(draw.size)
        continue
      }
      if (draw.op === 'T') {
        let x = pointToPx(draw.pt[0]) - containerX
        let width = pointToPx(draw.width)
        switch (draw.align) {
          case 'r':
            x -= width
            break
          case 'c':
            x -= Math.round(width / 2)
            break
        }

        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x + width)

        let y = pointToPx(draw.pt[1]) - containerY
        minY = Math.min(minY, Math.round(y - fontSize))
        maxY = Math.max(maxY, y)
      }
    }
  } catch (e) {
    logger.warn(`Failed on parsing label draw ops: ${e}\n${JSON.stringify(labelDrawOps, null, 2)}`)
    return null
  }

  // If no draw.op === 'T' found, return null
  if (minX === Infinity) {
    return null
  }
  const padding = 2
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding
  }
}

// Discussion:
//   https://forum.graphviz.org/t/how-to-interpret-graphviz-edge-coordinates-from-xdot-or-json/879/11
// Example:
//   https://github.com/hpcc-systems/Visualization/blob/trunk/packages/graph/workers/src/graphviz.ts#L38-L93
function parseEdgePoints(
  { _draw_, likec4_id = '???' as EdgeId }: GraphvizJson.Edge,
  viewId: string = '<unknown view>'
): DiagramEdge['points'] {
  try {
    const bezierOps = _draw_.filter((v): v is GraphvizJson.DrawOps.BSpline => v.op.toLowerCase() === 'b')
    invariant(hasAtLeast(bezierOps, 1), `view ${viewId} edge ${likec4_id} should have at least one bezier draw op`)
    if (bezierOps.length > 1) {
      logger.warn(`view ${viewId} edge ${likec4_id} has more than one bezier draw op, using the first one only`)
    }
    const points = bezierOps[0].points.map(p => pointToPx(p))
    invariant(hasAtLeast(points, 2), `view ${viewId} edge ${likec4_id} should have at least two points`)
    return points
  } catch (e) {
    logger.warn(`failed on parsing view ${viewId} edge ${likec4_id} _draw_:\n${JSON.stringify(_draw_, null, 2)}`)
    throw e
  }
}

function parseGraphvizEdge(
  graphvizEdge: GraphvizJson.Edge,
  { id, source, target, dir, label, description, ...computedEdge }: ComputedEdge,
  viewId: string
): DiagramEdge {
  const labelBBox = parseLabelBbox(graphvizEdge._ldraw_ ?? graphvizEdge._tldraw_ ?? graphvizEdge._hldraw_)
  const isBack = graphvizEdge.dir === 'back' || dir === 'back'
  label = label ? wrap(label, EDGE_LABEL_MAX_CHARS).join('\n') : null
  description = description ? wrap(description, EDGE_LABEL_MAX_CHARS).join('\n') : undefined

  return {
    id,
    source,
    target,
    label,
    ...isTruthy(description) && { description },
    ...isTruthy(graphvizEdge.pos) && { dotpos: graphvizEdge.pos },
    points: parseEdgePoints(graphvizEdge, viewId),
    labelBBox,
    ...(isBack ? { dir: 'back' } : {}),
    ...computedEdge
  }
}

export function parseGraphvizJson(json: string, computedView: ComputedView): DiagramView {
  const graphvizJson = JSON.parse(json) as GraphvizJson
  const page = parseBB(graphvizJson.bb)
  const {
    nodes: computedNodes,
    edges: computedEdges,
    // exclude
    manualLayout: _manualLayout,
    ...view
  } = computedView

  const diagram: DiagramView = {
    ...view,
    bounds: page,
    nodes: [],
    edges: []
  }

  const graphvizObjects = graphvizJson.objects ?? []
  for (const computed of computedNodes) {
    const obj = graphvizObjects.find(o => o.likec4_id === computed.id)
    invariant(obj, `View ${view.id} element ${computed.id} not found in graphviz output`)

    const { x, y, width, height } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj)

    const position = [x, y] as Point

    diagram.nodes.push({
      ...computed,
      position,
      width,
      height,
      labelBBox: parseLabelBbox(obj._ldraw_, position) ?? { x, y, width, height }
    })
  }

  const graphvizEdges = graphvizJson.edges ?? []
  for (const computedEdge of computedEdges) {
    const graphvizEdge = graphvizEdges.find(e => e.likec4_id === computedEdge.id)
    if (!graphvizEdge) {
      logger.warn(`View ${view.id} edge ${computedEdge.id} not found in graphviz output, skipping`)
      continue
    }
    diagram.edges.push(
      parseGraphvizEdge(graphvizEdge, computedEdge, view.id)
    )
  }

  return diagram
}

const idFromGvId = (id: GvId) => String(id + 1).padStart(2, '0')

export function parseOverviewGraphvizJson(json: string): OverviewGraph {
  const graphvizJson = JSON.parse(json) as GraphvizJson
  const page = parseBB(graphvizJson.bb)
  const overviewGraph: OverviewGraph = {
    nodes: [],
    edges: [],
    bounds: page
  }

  const childToParent = new Map<GvId, OverviewGraph.Node>()

  const graphvizObjects = graphvizJson.objects ?? []
  for (const obj of graphvizObjects) {
    if (!obj.likec4_type) {
      continue
    }
    const id = idFromGvId(obj._gvid)
    const path = obj.likec4_path ?? ''
    const parent = childToParent.get(obj._gvid)
    const { x, y, width, height } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj)
    const position = { x, y }
    if (obj.likec4_type === 'view') {
      invariant(obj.likec4_id, `View ${obj} has no likec4_id`)
      overviewGraph.nodes.push({
        id,
        type: 'view',
        parentId: parent?.id ?? null,
        height,
        width,
        position,
        label: obj.label ?? '',
        viewId: obj.likec4_id as any as ViewID
      })
    } else {
      const node: OverviewGraph.Node = {
        id,
        type: obj.likec4_type,
        parentId: parent?.id ?? null,
        height,
        width,
        position,
        path,
        label: obj.label ?? ''
      }
      const children = [
        ...('subgraphs' in obj ? obj.subgraphs : []),
        ...('nodes' in obj ? obj.nodes : [])
      ]
      for (const childId of children) {
        childToParent.set(childId, node)
      }
      overviewGraph.nodes.push(node)
    }
  }

  for (const edge of graphvizJson.edges ?? []) {
    try {
      const source = idFromGvId(edge.tail)
      const target = idFromGvId(edge.head)
      overviewGraph.edges.push({
        id: `link${idFromGvId(edge._gvid)}`,
        source,
        target,
        points: parseEdgePoints(edge)
      })
    } catch (e) {
      logger.warn(e)
    }
  }

  return overviewGraph
}
