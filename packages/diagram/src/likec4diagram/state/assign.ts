import { type NodeId, type XYPoint, invariant, nonNullable } from '@likec4/core'
import type { InternalNode } from '@xyflow/react'
import { type NodeLookup, getNodeDimensions } from '@xyflow/system'
import { deepEqual as eq } from 'fast-equals'
import { mergeDeep, omit } from 'remeda'
import { assertEvent } from 'xstate'
import { Base } from '../../base'
import { type VectorValue, vector } from '../../utils/vector'
import { getNodeCenter } from '../../utils/xyflow'
import type { Types } from '../types'
import { SeqParallelAreaColor } from '../xyflow-sequence/const'
import type { ActionArg, Context as DiagramContext } from './machine.setup'

export function lastClickedNode(
  params: { context: DiagramContext; event: { node: Types.Node } },
): DiagramContext['lastClickedNode'] {
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

export function mergeXYNodesEdges({ context, event }: ActionArg): Partial<DiagramContext> {
  assertEvent(event, 'update.view')
  const nextView = event.view
  const isSameView = context.view.id === nextView.id

  const currentNodes = context.xynodes
  const xynodes = event.xynodes.map((update) => {
    const existing = currentNodes.find(n => n.id === update.id)
    if (existing) {
      if (existing === update) {
        return existing
      }
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
        ...omit(existing, ['measured', 'parentId', 'hidden']),
        ...update,
        // Force dimensions from update
        width: update.initialWidth,
        height: update.initialHeight,
      } as Types.Node
    }
    return update
  })
  // Merge with existing edges, but only if the view is the same
  // and the edges have no layout drift
  let xyedges = event.xyedges
  if (isSameView && (!nextView.drifts || nextView.drifts.length === 0)) {
    const currentEdges = context.xyedges
    xyedges = event.xyedges.map((update): Types.Edge => {
      const existing = currentEdges.find(n => n.id === update.id)
      if (existing === update) {
        return existing
      }
      if (existing && existing.type === update.type) {
        if (
          eq(existing.hidden ?? false, update.hidden ?? false)
          && eq(existing.data, update.data)
          && eq(existing.source, update.source)
          && eq(existing.target, update.target)
          && eq(existing.sourceHandle, update.sourceHandle)
          && eq(existing.targetHandle, update.targetHandle)
        ) {
          return existing
        }
        return {
          ...omit(existing, ['hidden', 'sourceHandle', 'targetHandle']),
          ...update,
          data: {
            ...existing.data,
            ...update.data,
          },
        } as Types.Edge
      }
      return update
    })
  }

  return {
    xynodes,
    xyedges,
    view: nextView,
  }
}

export function focusNodesEdges(params: ActionArg): Partial<DiagramContext> {
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

// export function unfocusNodesEdges({ context }: ActionArg): Partial<DiagramContext> {
//   const { xynodes, xyedges } = context
//   return {
//     xynodes: xynodes.map(Base.setDimmed(false)),
//     xyedges: xyedges.map(Base.setData({
//       dimmed: false,
//       active: false,
//     })),
//   }
// }

export function updateNavigationHistory({ context, event }: ActionArg): Partial<DiagramContext> {
  assertEvent(event, 'update.view')
  let {
    navigationHistory: {
      currentIndex,
      history,
    },
    lastOnNavigate,
    viewport,
  } = context
  const stepCurrent = history[currentIndex]
  if (!stepCurrent) {
    return {
      navigationHistory: {
        currentIndex: 0,
        history: [
          {
            viewId: event.view.id,
            fromNode: null,
            viewport: { ...viewport },
          },
        ],
      },
    }
  }
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

export function navigateBack({ context }: ActionArg): Partial<DiagramContext> {
  const {
    navigationHistory: {
      currentIndex,
      history,
    },
  } = context
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

export function navigateForward({ context }: ActionArg): Partial<DiagramContext> {
  const {
    navigationHistory: {
      currentIndex,
      history,
    },
  } = context
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

export function updateNodeData({ context, event }: ActionArg): Partial<DiagramContext> {
  console.log('updateNodeData called', event)
  assertEvent(event, 'update.nodeData')
  const xynodes = context.xynodes.map((node): Types.Node => {
    if (node.id !== event.nodeId) {
      return node
    }
    const data = mergeDeep(node.data as any, event.data as any)
    if (eq(data, node.data)) {
      return node
    }
    return {
      ...node,
      data,
    } as Types.Node
  })
  return { xynodes }
}

export function updateEdgeData({ context, event }: ActionArg): Partial<DiagramContext> {
  assertEvent(event, 'update.edgeData')
  const xyedges = context.xyedges.map((edge): Types.Edge => {
    if (edge.id !== event.edgeId) {
      return edge
    }
    const data = mergeDeep(edge.data as any, event.data as any)
    if (eq(data, edge.data)) {
      return edge
    }
    return {
      ...edge,
      data,
    } as Types.Edge
  })
  return { xyedges }
}

function getBorderPointOnVector(node: InternalNode, nodeCenter: VectorValue, v: VectorValue) {
  const dimensions = getNodeDimensions(node)
  const xScale = dimensions.width / 2 / v.x
  const yScale = dimensions.height / 2 / v.y

  const scale = Math.min(Math.abs(xScale), Math.abs(yScale))

  return vector(v).multiply(scale).add(nodeCenter)
}

export function resetEdgeControlPoints(
  nodeLookup: NodeLookup,
  edge: Types.Edge,
): [XYPoint] | [XYPoint, XYPoint] {
  const source = nonNullable(nodeLookup.get(edge.source), `Source node ${edge.source} not found`)
  const target = nonNullable(nodeLookup.get(edge.target), `Target node ${edge.target} not found`)

  const sourceCenter = vector(getNodeCenter(source))
  const targetCenter = vector(getNodeCenter(target))

  // Edge is a loop
  if (source === target) {
    const loopSize = 80
    const centerOfTopBoundary = vector(0, source.height || 0)
      .multiply(-0.5)
      .add(sourceCenter)

    return [
      centerOfTopBoundary.add(vector(-loopSize / 2.5, -loopSize)),
      centerOfTopBoundary.add(vector(loopSize / 2.5, -loopSize)),
    ]
  }

  const sourceToTargetVector = targetCenter.subtract(sourceCenter)
  const sourceBorderPoint = getBorderPointOnVector(source, sourceCenter, sourceToTargetVector)
  const targetBorderPoint = getBorderPointOnVector(target, targetCenter, sourceToTargetVector.multiply(-1))

  return [sourceBorderPoint.add(targetBorderPoint.subtract(sourceBorderPoint).multiply(0.4))]
}

export function updateActiveWalkthrough({ context }: ActionArg): Partial<DiagramContext> {
  const { stepId, parallelPrefix } = nonNullable(context.activeWalkthrough, 'activeWalkthrough is null')
  const step = nonNullable(context.xyedges.find(x => x.id === stepId))
  return {
    xyedges: context.xyedges.map(edge => {
      const active = stepId === edge.id || (!!parallelPrefix && edge.id.startsWith(parallelPrefix))
      return Base.setData(edge, {
        active,
        dimmed: stepId !== edge.id,
      })
    }),
    xynodes: context.xynodes.map(node => {
      const dimmed = step.source !== node.id && step.target !== node.id
      if (node.type === 'seq-parallel') {
        return Base.setData(node, {
          color: parallelPrefix === node.data.parallelPrefix
            ? SeqParallelAreaColor.active
            : SeqParallelAreaColor.default,
          dimmed,
        })
      }
      return Base.setDimmed(node, dimmed)
    }),
  }
}
