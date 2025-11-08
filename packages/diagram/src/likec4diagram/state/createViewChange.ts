import type {
  DiagramEdge,
  DiagramNode,
  LayoutedView,
  ViewChange,
} from '@likec4/core/types'
import { getNodeDimensions } from '@xyflow/system'
import { hasAtLeast, indexBy, map, omit } from 'remeda'
import { calcViewBounds } from '../../utils/view-bounds'
import { bezierControlPoints, isSamePoint } from '../../utils/xyflow'
import type { DiagramContext } from './types'

export function createViewChange(
  parentContext: Pick<DiagramContext, 'view' | 'xynodes' | 'xyedges' | 'xystore'>,
): ViewChange.SaveViewSnapshot {
  const {
    view: {
      drifts: _1, // Ignore drifts from view
      _layout: _2, // Ignore layout type from view
      ...view
    },
    xynodes,
    xyedges,
    xystore,
  } = parentContext

  const { nodeLookup } = xystore.getState()
  const movedNodes = new Set<string>()

  const xynodesLookup = indexBy(xynodes, n => n.data.id)
  const xyedgesLookup = indexBy(xyedges, e => e.data.id)

  const nodes = map(view.nodes, (node): DiagramNode => {
    const xynode = xynodesLookup[node.id]
    if (!xynode) {
      return node
    }
    const internal = nodeLookup.get(xynode.id)!
    const dimensions = getNodeDimensions(internal)

    const isChanged = !isSamePoint(internal.internals.positionAbsolute, node)
      || node.width !== dimensions.width
      || node.height !== dimensions.height
      || node.shape !== xynode.data.shape
      || node.color !== xynode.data.color
      || node.style.border !== xynode.data.style.border
      || node.style.opacity !== xynode.data.style.opacity

    if (!isChanged) {
      return node
    }

    movedNodes.add(xynode.id)

    return {
      ...node,
      shape: xynode.data.shape,
      color: xynode.data.color,
      style: {
        ...node.style,
        ...xynode.data.style,
      },
      x: Math.floor(internal.internals.positionAbsolute.x),
      y: Math.floor(internal.internals.positionAbsolute.y),
      width: Math.ceil(dimensions.width),
      height: Math.ceil(dimensions.height),
    } satisfies DiagramNode
  })

  const edges = map(view.edges, (edge): DiagramEdge => {
    const xyedge = xyedgesLookup[edge.id]
    if (!xyedge) {
      return edge
    }
    const data = xyedge.data
    let controlPoints = data.controlPoints ?? []
    const sourceOrTargetMoved = movedNodes.has(xyedge.source) || movedNodes.has(xyedge.target)
    // If edge control points are not set, but the source or target node was moved
    if (controlPoints.length === 0 && sourceOrTargetMoved) {
      controlPoints = bezierControlPoints(data.points)
    }
    const _updated: DiagramEdge = {
      ...omit(edge, ['controlPoints']),
      points: data.points,
    }
    if (data.labelXY && data.labelBBox) {
      _updated.labelBBox = {
        ...data.labelBBox,
        ...data.labelXY,
      }
    }
    if (data.labelBBox) {
      _updated.labelBBox ??= data.labelBBox
    }
    if (hasAtLeast(controlPoints, 1)) {
      _updated.controlPoints = controlPoints
    }
    return _updated
  })

  const snapshot: LayoutedView = {
    ...view,
    bounds: calcViewBounds({ nodes, edges }),
    nodes,
    edges,
  }

  return {
    op: 'save-view-snapshot',
    layout: snapshot,
  }
}
