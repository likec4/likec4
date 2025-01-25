import { type NodeId, type XYPoint, invariant, nonNullable } from '@likec4/core'
import { getNodeDimensions } from '@xyflow/system'
import { deepEqual as eq } from 'fast-equals'
import { isEmpty, mergeDeep, omit } from 'remeda'
import { assertEvent } from 'xstate'
import { Base } from '../../base'
import { type Vector, vector, VectorImpl } from '../../utils/vector'
import type { Types } from '../types'
import type { ActionArg, DiagramContext } from './machine'

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

export function unfocusNodesEdges({ context }: ActionArg): Partial<DiagramContext> {
  const { xynodes, xyedges } = context
  return {
    xynodes: xynodes.map(Base.setDimmed(false)),
    xyedges: xyedges.map(Base.setData({
      dimmed: false,
      active: false,
    })),
  }
}

export function updateNavigationHistory({ context, event }: ActionArg): Partial<DiagramContext> {
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
  assertEvent(event, 'update.nodeData')
  const xynodes = context.xynodes.map((node): Types.Node =>
    node.id !== event.nodeId ? node : (({
      ...node,
      data: mergeDeep(node.data as any, event.data as any),
    }) as Types.Node)
  )
  return { xynodes }
}

export function updateEdgeData({ context, event }: ActionArg): Partial<DiagramContext> {
  assertEvent(event, 'update.edgeData')
  const xyedges = context.xyedges.map((edge): Types.Edge =>
    edge.id !== event.edgeId ? edge : (({
      ...edge,
      data: mergeDeep(edge.data as any, event.data as any),
    }) as Types.Edge)
  )
  return { xyedges }
}

export function resetEdgeControlPoints({ context }: ActionArg): Partial<DiagramContext> {
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

export function updateActiveWalkthrough({ context }: ActionArg): Partial<DiagramContext> {
  const { stepId, parallelPrefix } = nonNullable(context.activeWalkthrough, 'activeWalkthrough is null')
  const step = nonNullable(context.xyedges.find(x => x.id === stepId))
  return {
    xyedges: context.xyedges.map(edge => {
      const active = stepId === edge.id || (!!parallelPrefix && edge.id.startsWith(parallelPrefix))
      return Base.setData(edge, {
        active,
        dimmed: !active,
      })
    }),
    xynodes: context.xynodes.map(node => {
      const active = step.source === node.id || step.target === node.id
      return Base.setDimmed(node, !active)
    }),
  }
}
