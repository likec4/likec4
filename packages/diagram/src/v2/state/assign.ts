import { type NodeId, type XYPoint, invariant, nonNullable } from '@likec4/core'
import { getNodeDimensions } from '@xyflow/system'
import { deepEqual as eq } from 'fast-equals'
import { isEmpty, mergeDeep, omit } from 'remeda'
import { assertEvent } from 'xstate'
import { Base } from '../../base'
import { type Vector, vector, VectorImpl } from '../../utils/vector'
import type { Types } from '../types'
import type { ActionArg, Context } from './machine'

export function lastClickedNode(params: { context: Context; event: { node: Types.Node } }): Context['lastClickedNode'] {
  const { lastClickedNode } = params.context
  if (!lastClickedNode || lastClickedNode.id !== params.event.node.id) {
    return {
      id: params.event.node.id as NodeId,
      clicks: 1,
      timestamp: Date.now(),
    }
  }
  return {
    id: lastClickedNode.id,
    clicks: lastClickedNode.clicks + 1,
    timestamp: Date.now(),
  }
}

export function mergeXYNodesEdges({ context, event }: ActionArg): Partial<Context> {
  assertEvent(event, 'update.view')
  const nextView = event.view
  const isSameView = context.view.id === nextView.id

  const currentNodes = context.xynodes
  const xynodes = event.xynodes.map((update) => {
    const existing = currentNodes.find(n => n.id === update.id)
    if (existing) {
      const { width: existingWidth, height: existingHeight } = getNodeDimensions(existing)
      if (
        eq(existing.type, update.type)
        && eq(existingWidth, update.initialWidth)
        && eq(existingHeight, update.initialHeight)
        && eq(existing.hidden ?? false, update.hidden ?? false)
        && eq(existing.position, update.position)
        && eq(existing.data, update.data)
        && eq(existing.parentId ?? null, update.parentId ?? null)
      ) {
        return existing
      }
      return {
        ...omit(existing, ['measured', 'parentId']),
        ...update,
        // Force dimensions from update
        width: update.initialWidth,
        height: update.initialHeight,
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
  let xyedges = event.xyedges
  if (isSameView && !nextView.hasLayoutDrift) {
    const currentEdges = context.xyedges
    xyedges = event.xyedges.map((update): Types.Edge => {
      const existing = currentEdges.find(n => n.id === update.id)
      if (existing) {
        if (
          eq(existing.hidden ?? false, update.hidden ?? false)
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
        }
      }
      return update
    })
  }

  if (!isSameView) {
    for (const node of xynodes) {
      node.data = {
        ...node.data,
        dimmed: false,
        hovered: false,
      }
    }
    for (const edge of xyedges) {
      edge.data = {
        ...edge.data,
        dimmed: false,
        hovered: false,
        active: false,
      }
    }
  }

  return {
    xynodes,
    xyedges,
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
      return Base.setData(edge, {
        dimmed: false,
        active: true,
      })
    }
    return Base.setData(edge, {
      dimmed: true,
      active: false,
    })
  })

  return {
    xynodes: _xynodes.map(n => Base.setDimmed(n, !focused.has(n.id))),
    xyedges,
  }
}

export function unfocusNodesEdges(params: { context: Context }): Partial<Context> {
  const { xynodes, xyedges } = params.context
  return {
    xynodes: xynodes.map(Base.setDimmed(false)),
    xyedges: xyedges.map(Base.setData({
      dimmed: false,
      active: false,
    })),
  }
}

export function updateNavigationHistory({ context, event }: ActionArg): Partial<Context> {
  assertEvent(event, 'update.view')
  let {
    view,
    navigationHistory: {
      currentIndex,
      history,
    },
    lastOnNavigate,
    viewport,
  } = context
  const stepCurrent = nonNullable(history[currentIndex])
  if (stepCurrent.viewId !== event.view.id) {
    // Navigation by browser back/forward ?
    if (!lastOnNavigate) {
      const stepBack = currentIndex > 0 ? nonNullable(history[currentIndex - 1]) : null
      if (stepBack && stepBack.viewId === event.view.id) {
        return {
          navigationHistory: {
            currentIndex: currentIndex - 1,
            history,
          },
          lastOnNavigate: {
            fromView: stepCurrent.viewId,
            toView: stepBack.viewId,
            fromNode: stepCurrent.fromNode,
          },
        }
      }
      const stepForward = currentIndex < history.length - 1 ? nonNullable(history[currentIndex + 1]) : null
      if (stepForward && stepForward.viewId === event.view.id) {
        return {
          navigationHistory: {
            currentIndex: currentIndex + 1,
            history,
          },
          lastOnNavigate: {
            fromView: stepCurrent.viewId,
            toView: stepForward.viewId,
            fromNode: stepForward.fromNode,
          },
        }
      }
    }

    history = [
      ...history.slice(0, currentIndex + 1),
      {
        viewId: event.view.id,
        fromNode: lastOnNavigate?.fromNode ?? null,
        viewport: { ...viewport },
      },
    ]
    currentIndex = history.length - 1
    return {
      navigationHistory: {
        currentIndex,
        history,
      },
    }
  }
  return {}
}

export function navigateBack(params: { context: Context }): Partial<Context> {
  const {
    navigationHistory: {
      currentIndex,
      history,
    },
  } = params.context
  invariant(currentIndex > 0, 'Cannot navigate back')
  const stepCurrent = history[currentIndex]!
  const stepBack = history[currentIndex - 1]!
  return {
    navigationHistory: {
      currentIndex: currentIndex - 1,
      history,
    },
    lastOnNavigate: {
      fromView: stepCurrent.viewId,
      toView: stepBack.viewId,
      fromNode: stepCurrent.fromNode,
    },
  }
}

export function navigateForward(params: ActionArg): Partial<Context> {
  const {
    navigationHistory: {
      currentIndex,
      history,
    },
  } = params.context
  invariant(currentIndex < history.length - 1, 'Cannot navigate forward')
  const stepCurrent = history[currentIndex]!
  const stepForward = history[currentIndex + 1]!
  return {
    navigationHistory: {
      currentIndex: currentIndex + 1,
      history,
    },
    lastOnNavigate: {
      fromView: stepCurrent.viewId,
      toView: stepForward.viewId,
      fromNode: stepForward.fromNode,
    },
  }
}

export function updateNodeData(params: ActionArg): Partial<Context> {
  const { context, event } = params
  assertEvent(event, 'update.nodeData')
  const xynodes = context.xynodes.map((node): Types.Node =>
    node.id !== event.nodeId ? node : (({
      ...node,
      data: mergeDeep(node.data as any, event.data as any),
    }) as Types.Node)
  )
  return { xynodes }
}

export function updateEdgeData(params: ActionArg): Partial<Context> {
  const { context, event } = params
  assertEvent(event, 'update.edgeData')
  const xyedges = context.xyedges.map((edge): Types.Edge =>
    edge.id !== event.edgeId ? edge : (({
      ...edge,
      data: mergeDeep(edge.data as any, event.data as any),
    }) as Types.Edge)
  )
  return { xyedges }
}

export function resetEdgeControlPoints({ context }: ActionArg): Partial<Context> {
  const { xynodes } = context

  function getNodeCenter(node: Types.Node, nodes: Types.Node[]) {
    const dimensions = vector({ x: node.width || 0, y: node.height || 0 })
    let position = vector(node.position)
      .add(dimensions.mul(0.5))

    let currentNode = node
    do {
      const parent = currentNode.parentId && nodes.find(x => x.id == currentNode.parentId)

      if (!parent) {
        break
      }

      currentNode = parent
      position = position.add(parent.position)
    } while (true)

    return position
  }

  function getControlPointForEdge(edge: Types.Edge): XYPoint[] {
    const source = xynodes.find(x => x.id == edge.source)
    const target = xynodes.find(x => x.id == edge.target)
    if (!source || !target) {
      return []
    }

    const sourceCenter = getNodeCenter(source, xynodes)
    const targetCenter = getNodeCenter(target, xynodes)

    if (!sourceCenter || !targetCenter) {
      return []
    }

    // Edge is a loop
    if (source == target) {
      const loopSize = 80
      const centerOfTopBoundary = new VectorImpl(0, source.height || 0)
        .mul(-0.5)
        .add(sourceCenter)

      return [
        centerOfTopBoundary.add(new VectorImpl(-loopSize / 2.5, -loopSize)),
        centerOfTopBoundary.add(new VectorImpl(loopSize / 2.5, -loopSize)),
      ]
    }

    const sourceToTargetVector = targetCenter.sub(sourceCenter)
    const sourceBorderPoint = getBorderPointOnVector(source, sourceCenter, sourceToTargetVector)
    const targetBorderPoint = getBorderPointOnVector(target, targetCenter, sourceToTargetVector.mul(-1))

    return [sourceBorderPoint.add(targetBorderPoint.sub(sourceBorderPoint).mul(0.3))]
  }

  function getBorderPointOnVector(node: Types.Node, nodeCenter: Vector, v: Vector) {
    const xScale = (node.width || 0) / 2 / v.x
    const yScale = (node.height || 0) / 2 / v.y

    const scale = Math.min(Math.abs(xScale), Math.abs(yScale))

    return vector(v).mul(scale).add(nodeCenter)
  }

  return {
    xyedges: context.xyedges.map(edge => {
      if (!edge.data.controlPoints || isEmpty(edge.data.controlPoints)) {
        return edge
      }
      return ({
        ...edge,
        data: {
          ...edge.data,
          controlPoints: getControlPointForEdge(edge),
        },
      })
    }),
  }
}
