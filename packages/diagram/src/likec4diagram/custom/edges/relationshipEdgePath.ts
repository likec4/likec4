import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { first, last } from 'remeda'
import type {
  NodeConnectionBoundaryEnd,
  NodeConnectionBoundaryRequest,
  NodeConnectionBoundaryResolver,
} from '../../../context/NodeConnectionBoundary'
import { getNodeIntersectionFromCenterToPoint } from '../../../utils/xyflow'
import type { Types } from '../../types'

type NodeBounds = NodeConnectionBoundaryRequest['nodeBounds']

export function resolveNodeConnectionPoint(
  resolver: NodeConnectionBoundaryResolver | null,
  nodeId: string,
  nodeBounds: NodeBounds,
  toward: XYPosition,
  end: NodeConnectionBoundaryEnd,
): XYPosition | null {
  if (!resolver) {
    return null
  }
  const point = resolver({
    nodeId,
    nodeBounds,
    toward,
    end,
  })
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null
}

export function resolvePersistedPathEndpoints(
  points: Types.RelationshipEdgeData['points'],
  resolver: NodeConnectionBoundaryResolver | null,
  sourceId: string,
  sourceBounds: NodeBounds,
  targetId: string,
  targetBounds: NodeBounds,
  direction: Types.RelationshipEdgeData['dir'],
): Types.RelationshipEdgeData['points'] {
  if (!resolver || points.length < 2) {
    return points
  }

  const lastIndex = points.length - 1
  const sourceIndex = direction === 'back' ? lastIndex : 0
  const targetIndex = direction === 'back' ? 0 : lastIndex
  const sourceAdjacentIndex = sourceIndex === 0 ? 1 : lastIndex - 1
  const targetAdjacentIndex = targetIndex === 0 ? 1 : lastIndex - 1
  const sourceAdjacent = nonNullable(points[sourceAdjacentIndex])
  const targetAdjacent = nonNullable(points[targetAdjacentIndex])

  const sourcePoint = resolveNodeConnectionPoint(
    resolver,
    sourceId,
    sourceBounds,
    { x: sourceAdjacent[0], y: sourceAdjacent[1] },
    'source',
  )
  const targetPoint = resolveNodeConnectionPoint(
    resolver,
    targetId,
    targetBounds,
    { x: targetAdjacent[0], y: targetAdjacent[1] },
    'target',
  )

  if (!sourcePoint && !targetPoint) {
    return points
  }

  const resolvedPoints = [...points] as Types.RelationshipEdgeData['points']
  if (sourcePoint) {
    const current = nonNullable(points[sourceIndex])
    const dx = sourcePoint.x - current[0]
    const dy = sourcePoint.y - current[1]
    resolvedPoints[sourceIndex] = [sourcePoint.x, sourcePoint.y]
    resolvedPoints[sourceAdjacentIndex] = [sourceAdjacent[0] + dx, sourceAdjacent[1] + dy]
  }
  if (targetPoint) {
    const current = nonNullable(points[targetIndex])
    const dx = targetPoint.x - current[0]
    const dy = targetPoint.y - current[1]
    resolvedPoints[targetIndex] = [targetPoint.x, targetPoint.y]
    resolvedPoints[targetAdjacentIndex] = [targetAdjacent[0] + dx, targetAdjacent[1] + dy]
  }
  return resolvedPoints
}

export function resolveControlPointRoute({
  resolver,
  sourceId,
  sourceBounds,
  sourceDefaultBounds = sourceBounds,
  sourceCenter,
  targetId,
  targetBounds,
  targetDefaultBounds = targetBounds,
  targetCenter,
  controlPoints,
  direction,
}: {
  resolver: NodeConnectionBoundaryResolver | null
  sourceId: string
  sourceBounds: NodeBounds
  sourceDefaultBounds?: NodeBounds
  sourceCenter: XYPosition
  targetId: string
  targetBounds: NodeBounds
  targetDefaultBounds?: NodeBounds
  targetCenter: XYPosition
  controlPoints: XYPosition[]
  direction: Types.RelationshipEdgeData['dir']
}): XYPosition[] {
  const sourceToward = direction === 'back'
    ? last(controlPoints) ?? targetCenter
    : first(controlPoints) ?? targetCenter
  const targetToward = direction === 'back'
    ? first(controlPoints) ?? sourceCenter
    : last(controlPoints) ?? sourceCenter
  const nodeMargin = 6
  const sourceRoutePoint = resolveNodeConnectionPoint(
    resolver,
    sourceId,
    sourceBounds,
    sourceToward,
    'source',
  ) ?? getNodeIntersectionFromCenterToPoint(sourceDefaultBounds, sourceToward, nodeMargin)
  const targetRoutePoint = resolveNodeConnectionPoint(
    resolver,
    targetId,
    targetBounds,
    targetToward,
    'target',
  ) ?? getNodeIntersectionFromCenterToPoint(targetDefaultBounds, targetToward, nodeMargin)

  return direction === 'back'
    ? [
      targetCenter,
      targetRoutePoint,
      ...controlPoints,
      sourceRoutePoint,
      sourceCenter,
    ]
    : [
      sourceCenter,
      sourceRoutePoint,
      ...controlPoints,
      targetRoutePoint,
      targetCenter,
    ]
}
