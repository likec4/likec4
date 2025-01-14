import type { DiagramView, NodeId } from '@likec4/core'
import { deepEqual as eq } from 'fast-equals'
import { BaseTypes } from '../../base'
import type { Types } from '../types'
import type { Context } from './machine'

export function lastClickedNode(params: { context: Context; event: { node: Types.Node } }): Context['lastClickedNode'] {
  const { lastClickedNode } = params.context
  if (!lastClickedNode || lastClickedNode.id !== params.event.node.id) {
    return {
      id: params.event.node.id as NodeId,
      clicks: 1,
    }
  }
  return {
    id: lastClickedNode.id,
    clicks: lastClickedNode.clicks + 1,
  }
}

export function mergeUpdateViewEvent(params: {
  context: Context
  event: { view: DiagramView; xynodes: Types.Node[]; xyedges: Types.Edge[] }
}): Partial<Context> {
  const nextView = params.event.view
  const isSameView = params.context.view.id === nextView.id

  const currentNodes = params.context.xynodes
  const xynodes = params.event.xynodes.map((update) => {
    const existing = currentNodes.find(n => n.id === update.id)
    if (
      existing
      && existing.type === update.type
      && eq(existing.parentId ?? null, update.parentId ?? null)
    ) {
      if (
        eq(existing.style, update.style)
        && eq(existing.hidden ?? false, update.hidden ?? false)
        && eq(existing.position, update.position)
        && eq(existing.data, update.data)
      ) {
        return existing
      }
      return {
        ...existing,
        ...update,
        data: {
          ...existing.data,
          ...update.data,
        },
      } as Types.Node
    }
    return update
  })
  // Merge with existing edges, but only if the view is the same
  // and the edges have no layout drift
  // if (isSameView && !nextView.hasLayoutDrift) {
  //   update.xyedges = update.xyedges.map((update): Types.Edge => {
  //     const existing = ctx.xyedges.find(n => n.id === update.id)
  //     if (existing) {
  //       if (
  //         eq(existing.hidden ?? false, update.hidden ?? false)
  //         && eq(existing.data.label, update.data.label)
  //         && eq(existing.data.controlPoints, update.data.controlPoints)
  //         && eq(existing.data.edge, update.data.edge)
  //       ) {
  //         return existing
  //       }
  //       return {
  //         ...existing,
  //         ...update,
  //         data: {
  //           ...existing.data,
  //           ...update.data,
  //         },
  //       }
  //     }
  //     return update
  //   })
  // }

  // if (!isSameView) {
  //   for (const node of xynodes) {

  //     node.data.dimmed = false
  //     node.data.hovered = false
  //   }
  //   for (const edge of params.event.xyedges) {
  //     edge.data.active = false
  //   }
  // }

  return {
    xynodes,
    xyedges: params.event.xyedges,
    view: nextView,
  }
}

// let u2pdateView = (nextView) => {
//   let {
//     viewSyncDebounceTimeout,
//     xyflow,
//     xystore,
//     dimmed,
//     whereFilter,
//     view: current,
//     lastOnNavigate,
//     navigationHistory,
//     navigationHistoryIndex,
//     focusedNodeId,
//     lastClickedNodeId,
//     lastClickedEdgeId,
//     activeWalkthrough,
//     activeOverlay,
//     nodesDraggable,
//     nodesSelectable,
//     hoveredEdgeId,
//     xyedges,
//     xynodes,
//   } = get()

//   if (viewSyncDebounceTimeout !== null) {
//     clearTimeout(viewSyncDebounceTimeout)
//     viewSyncDebounceTimeout = null
//   }

//   const isSameView = current.id === nextView.id

//   if (isSameView) {
//     const nodeIds = new StringSet(nextView.nodes.map((n) => n.id))
//     const edgeIds = new StringSet(nextView.edges.map((e) => e.id))
//     // Reset clicked/hovered node/edge if the node/edge is not in the new view
//     if (lastClickedNodeId && !nodeIds.has(lastClickedNodeId)) {
//       lastClickedNodeId = null
//     }
//     if (focusedNodeId && !nodeIds.has(focusedNodeId)) {
//       focusedNodeId = null
//       dimmed = EmptyStringSet
//     }
//     if (lastClickedEdgeId && !edgeIds.has(lastClickedEdgeId)) {
//       lastClickedEdgeId = null
//     }
//     if (hoveredEdgeId && !edgeIds.has(hoveredEdgeId)) {
//       hoveredEdgeId = null
//     }
//     if (activeWalkthrough && !edgeIds.has(activeWalkthrough.stepId)) {
//       activeWalkthrough = null
//       dimmed = EmptyStringSet
//     }
//     if (dimmed.size > 0) {
//       let nextDimmed = new StringSet([...dimmed].filter(id => nodeIds.has(id) || edgeIds.has(id)))
//       if (nextDimmed.size !== dimmed.size) {
//         dimmed = nextDimmed
//       }
//     }
//   } else {
//     // Reset lastOnNavigate if the view is not the source or target view
//     const stepCurrent = nonNullable(navigationHistory[navigationHistoryIndex])
//     if (stepCurrent.viewId !== nextView.id) {
//       navigationHistory = [
//         ...navigationHistory.slice(0, navigationHistoryIndex + 1),
//         {
//           viewId: nextView.id,
//           nodeId: lastOnNavigate?.fromNode || null,
//         },
//       ]
//       navigationHistoryIndex = navigationHistory.length - 1
//     } else {
//       // We are navigating to the same view as in the history
//       if (stepCurrent.nodeId) {
//         lastOnNavigate ??= {
//           fromView: current.id,
//           toView: nextView.id,
//           fromNode: stepCurrent.nodeId,
//         }
//       }
//     }

//     if (lastOnNavigate && lastOnNavigate.toView !== nextView.id) {
//       lastOnNavigate = null
//     }

//     const elTo = lastOnNavigate && nextView.nodes.find(n => n.id === lastOnNavigate?.fromNode)
//     const xynodeFrom = elTo && xyflow.getInternalNode(elTo.id)

//     if (!lastOnNavigate || isNullish(elTo) || isNullish(xynodeFrom)) {
//       const zoom = xyflow.getZoom()
//       const { x, y } = getBBoxCenter(nextView.bounds)
//       xyflow.setCenter(x, y, { zoom })
//       lastOnNavigate = null
//     }

//     if (lastOnNavigate && !!elTo && !!xynodeFrom) {
//       const fromPos = xyflow.flowToScreenPosition({
//           x: xynodeFrom.internals.positionAbsolute.x, // + dimensions.width / 2,
//           y: xynodeFrom.internals.positionAbsolute.y, // + dimensions.height / 2
//         }),
//         toPos = xyflow.flowToScreenPosition({
//           x: elTo.position[0], // + elFrom.width / 2,
//           y: elTo.position[1], // + elFrom.height / 2
//         }),
//         diff = {
//           x: toDomPrecision(fromPos.x - toPos.x),
//           y: toDomPrecision(fromPos.y - toPos.y),
//         }
//       xystore.getState().panBy(diff)
//       lastOnNavigate = null
//     }

//     // Reset hovered / clicked node/edge if the view is different
//     lastClickedEdgeId = null
//     lastClickedNodeId = null
//     hoveredEdgeId = null
//     focusedNodeId = null
//     activeWalkthrough = null
//     activeOverlay = null
//     dimmed = EmptyStringSet
//   }

//   const update = diagramViewToXYFlowData(nextView, {
//     where: whereFilter,
//     draggable: nodesDraggable,
//     selectable: nodesSelectable,
//   })

//   update.xynodes = update.xynodes.map((update) => {
//     const existing = xynodes.find(n => n.id === update.id)
//     if (
//       existing
//       && existing.type === update.type
//       && eq(existing.parentId ?? null, update.parentId ?? null)
//     ) {
//       if (
//         existing.width === update.width
//         && existing.height === update.height
//         && eq(existing.hidden ?? false, update.hidden ?? false)
//         && eq(existing.position, update.position)
//         && eq(existing.data, update.data)
//       ) {
//         return existing
//       }
//       return {
//         ...existing,
//         ...update,
//       } as Types.Node
//     }
//     return update
//   })
//   // Merge with existing edges, but only if the view is the same
//   // and the edges have no layout drift
//   if (isSameView && !nextView.hasLayoutDrift) {
//     update.xyedges = update.xyedges.map((update): Types.Edge => {
//       const existing = xyedges.find(n => n.id === update.id)
//       if (existing) {
//         if (
//           eq(existing.hidden ?? false, update.hidden ?? false)
//           && eq(existing.data.label, update.data.label)
//           && eq(existing.data.controlPoints, update.data.controlPoints)
//           && eq(existing.data.edge, update.data.edge)
//         ) {
//           return existing
//         }
//         return {
//           ...existing,
//           ...update,
//           data: {
//             ...existing.data,
//             ...update.data,
//           },
//         }
//       }
//       return update
//     })
//   }

//   set(
//     {
//       isDynamicView: nextView.__ === 'dynamic',
//       viewSyncDebounceTimeout,
//       view: nextView,
//       activeWalkthrough,
//       activeOverlay,
//       lastOnNavigate,
//       lastClickedNodeId,
//       lastClickedEdgeId,
//       focusedNodeId,
//       hoveredEdgeId,
//       navigationHistory,
//       navigationHistoryIndex,
//       dimmed,
//       xynodes: !isSameView || !shallowEqual(update.xynodes, xynodes) ? update.xynodes : xynodes,
//       xyedges: !isSameView || !shallowEqual(update.xyedges, xyedges) ? update.xyedges : xyedges,
//     },
//     noReplace,
//     isSameView ? 'update-view [same]' : 'update-view [another]',
//   )
// }

export function focusNodesEdges(params: { context: Context }): Partial<Context> {
  const { xynodes: _xynodes, xyedges: _xyedges, focusedNode } = params.context
  if (!focusedNode) {
    return {}
  }
  const focused = new Set([focusedNode as string])
  const xyedges = _xyedges.map((edge) => {
    if (edge.source === focusedNode || edge.target === focusedNode) {
      focused.add(edge.source)
      focused.add(edge.target)
      return BaseTypes.setEdgeState(edge, {
        dimmed: false,
        active: true,
      })
    }
    return BaseTypes.setEdgeState(edge, {
      dimmed: true,
      active: false,
    })
  })

  return {
    xynodes: _xynodes.map(n => BaseTypes.setDimmed(n, !focused.has(n.id))),
    xyedges,
  }
}

export function unfocusNodesEdges(params: { context: Context }): Partial<Context> {
  const { xynodes, xyedges } = params.context
  return {
    xynodes: xynodes.map(BaseTypes.setDimmed(false)),
    xyedges: xyedges.map(BaseTypes.setEdgeState({
      dimmed: false,
      active: false,
    })),
  }
}
