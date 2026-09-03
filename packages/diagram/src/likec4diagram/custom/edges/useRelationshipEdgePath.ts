// oxlint-disable exhaustive-deps
import { vector } from '@likec4/core/geometry'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import { isTruthy } from 'remeda'
import {
  useNodeConnectionBoundaryResolver,
} from '../../../context/NodeConnectionBoundary'
import { useXYStore } from '../../../hooks/useXYFlow'
import {
  bezierPath,
} from '../../../utils/xyflow'
import type { Types } from '../../types'
import {
  resolveControlPointRoute,
  resolvePersistedPathEndpoints,
} from './relationshipEdgePath'

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => Math.trunc(d.x))
  .y(d => Math.trunc(d.y))

/**
 * @returns SVG path data string for relationship edge
 */
export function useRelationshipEdgePath({
  props: {
    sourceX,
    sourceY,
    source,
    target,
    targetX,
    targetY,
    data,
  },
  controlPoints,
  isControlPointDragging,
}: {
  props: Types.EdgeProps<'relationship'>
  controlPoints: XYPosition[]
  isControlPointDragging: boolean
}): string {
  const boundaryResolver = useNodeConnectionBoundaryResolver()
  // Subscribe to mimimal node changes to update edge path when nodes move
  const [
    sourceNodeWidth,
    sourceNodeHeight,
    sourceNodeX,
    sourceNodeY,
    targetNodeWidth,
    targetNodeHeight,
    targetNodeX,
    targetNodeY,
  ] = useXYStore(
    useCallback(({ nodeLookup }) => {
      const sourceNode = nonNullable(nodeLookup.get(source), `source node ${source} not found`)
      const targetNode = nonNullable(nodeLookup.get(target), `target node ${target} not found`)
      const sourceNodeDimensions = getNodeDimensions(sourceNode)
      const targetNodeDimensions = getNodeDimensions(targetNode)
      return [
        sourceNodeDimensions.width,
        sourceNodeDimensions.height,
        sourceNode.internals.positionAbsolute.x,
        sourceNode.internals.positionAbsolute.y,
        targetNodeDimensions.width,
        targetNodeDimensions.height,
        targetNode.internals.positionAbsolute.x,
        targetNode.internals.positionAbsolute.y,
      ] as const
    }, [source, target]),
    shallowEqual,
  )

  const sourceCenterPos = vector(sourceX, sourceY).trunc()
  const targetCenterPos = vector(targetX, targetY).trunc()
  const sourceBounds = {
    x: sourceNodeX,
    y: sourceNodeY,
    width: sourceNodeWidth,
    height: sourceNodeHeight,
  }
  const targetBounds = {
    x: targetNodeX,
    y: targetNodeY,
    width: targetNodeWidth,
    height: targetNodeHeight,
  }
  const isModified = isTruthy(data.controlPoints) || isControlPointDragging

  if (!isModified) {
    if (boundaryResolver) {
      const resolvedPoints = resolvePersistedPathEndpoints(
        data.points,
        boundaryResolver,
        source,
        sourceBounds,
        target,
        targetBounds,
        data.dir,
      )
      if (resolvedPoints !== data.points) {
        return bezierPath(resolvedPoints)
      }
    }
    return bezierPath(data.points)
  }

  // Preserve the existing rectangular fallback, including its rounding.
  const sourceDefaultBounds = {
    ...sourceCenterPos
      .subtract(vector(Math.ceil(sourceNodeWidth), Math.ceil(sourceNodeHeight)).divide(2))
      .trunc()
      .toObject(),
    width: Math.ceil(sourceNodeWidth),
    height: Math.ceil(sourceNodeHeight),
  }
  const targetDefaultBounds = {
    ...targetCenterPos
      .subtract(vector(Math.ceil(targetNodeWidth), Math.ceil(targetNodeHeight)).divide(2))
      .trunc()
      .toObject(),
    width: Math.ceil(targetNodeWidth),
    height: Math.ceil(targetNodeHeight),
  }

  const points = resolveControlPointRoute({
    resolver: boundaryResolver,
    sourceId: source,
    sourceBounds,
    sourceDefaultBounds,
    sourceCenter: sourceCenterPos,
    targetId: target,
    targetBounds,
    targetDefaultBounds,
    targetCenter: targetCenterPos,
    controlPoints,
    direction: data.dir,
  })

  return nonNullable(curve(points))
}
