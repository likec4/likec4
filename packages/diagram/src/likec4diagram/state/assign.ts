import { type LayoutedView, type NodeId, type XYPoint, nonNullable } from '@likec4/core'
import type { InternalNode } from '@xyflow/react'
import { type NodeLookup, getNodeDimensions } from '@xyflow/system'
import { deepEqual as eq } from 'fast-equals'
import { mergeDeep, omit } from 'remeda'
import { assertEvent } from 'xstate'
import { Base, updateNodes } from '../../base'
import { type VectorValue, vector } from '../../utils/vector'
import { getNodeCenter } from '../../utils/xyflow'
import type { Types } from '../types'
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

export function mergeXYNodesEdges(
  context: Pick<DiagramContext, 'xynodes' | 'xyedges' | 'view'>,
  event: { view: LayoutedView; xynodes: Types.Node[]; xyedges: Types.Edge[] },
): { xynodes: Types.Node[]; xyedges: Types.Edge[]; view: LayoutedView } {
  const nextView = event.view
  const isSameView = context.view.id === nextView.id

  const xynodes = updateNodes(context.xynodes, event.xynodes)
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
