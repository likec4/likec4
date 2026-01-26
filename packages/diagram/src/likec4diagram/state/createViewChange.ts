import {
  type DiagramEdge,
  type DiagramNode,
  type LayoutedView,
  type ViewChange,
} from '@likec4/core/types'
import { getNodeDimensions } from '@xyflow/system'
import { hasAtLeast, map, omit } from 'remeda'
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
    xystore,
  } = parentContext

  const { nodeLookup, edgeLookup } = xystore.getState()
  const movedNodes = new Set<string>()

  const nodes = map(view.nodes, (node): DiagramNode => {
    const internal = nodeLookup.get(node.id)
    if (!internal) {
      console.error(`Internal node not found for ${node.id}`)
      return node
    }
    const xynodedata = xynodes.find(n => n.id === node.id)?.data ?? internal.data
    const position = internal.internals.positionAbsolute
    const { width, height } = getNodeDimensions(internal)

    const isChanged = !isSamePoint(position, node)
      || node.width !== width
      || node.height !== height

    if (isChanged) {
      movedNodes.add(node.id)
    }

    return {
      ...node,
      shape: xynodedata.shape,
      color: xynodedata.color,
      style: {
        ...xynodedata.style,
      },
      x: Math.floor(position.x),
      y: Math.floor(position.y),
      width: Math.ceil(width),
      height: Math.ceil(height),
    } satisfies DiagramNode
  })

  const edges = map(view.edges, (edge): DiagramEdge => {
    const xyedge = edgeLookup.get(edge.id)
    if (!xyedge) {
      console.error(`Internal edge not found for ${edge.id}`)
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
      ...omit(edge, ['controlPoints', 'labelBBox']),
      points: data.points,
    }
    if (data.labelBBox) {
      _updated.labelBBox = {
        x: Math.round(data.labelBBox.x),
        y: Math.round(data.labelBBox.y),
        width: Math.round(data.labelBBox.width),
        height: Math.round(data.labelBBox.height),
      }
    } else {
      _updated.labelBBox = null
    }
    if (hasAtLeast(controlPoints, 1)) {
      _updated.controlPoints = map(controlPoints, v => ({
        x: Math.round(v.x),
        y: Math.round(v.y),
      }))
    } else {
      delete _updated.controlPoints
    }
    return _updated
  })

  const snapshot: LayoutedView = {
    ...view,
    _layout: 'manual',
    bounds: calcViewBounds({ nodes, edges }),
    nodes,
    edges,
  }

  return {
    op: 'save-view-snapshot',
    layout: snapshot,
  }
}
