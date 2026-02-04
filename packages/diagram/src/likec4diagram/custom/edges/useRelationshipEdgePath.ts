// oxlint-disable exhaustive-deps
import { vector } from '@likec4/core/geometry'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import { first, isTruthy, last } from 'remeda'
import { useXYStore } from '../../../hooks/useXYFlow'
import {
  bezierPath,
  getNodeIntersectionFromCenterToPoint,
} from '../../../utils/xyflow'
import type { Types } from '../../types'

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
  // Subscribe to mimimal node changes to update edge path when nodes move
  const [
    sourceNodeWidth,
    sourceNodeHeight,
    targetNodeWidth,
    targetNodeHeight,
  ] = useXYStore(
    useCallback(({ nodeLookup }) => {
      const sourceNode = getNodeDimensions(nonNullable(nodeLookup.get(source), `source node ${source} not found`))
      const targetNode = getNodeDimensions(nonNullable(nodeLookup.get(target), `target node ${target} not found`))
      return [
        Math.ceil(sourceNode.width),
        Math.ceil(sourceNode.height),
        Math.ceil(targetNode.width),
        Math.ceil(targetNode.height),
      ] as const
    }, [source, target]),
    shallowEqual,
  )

  const isModified = isTruthy(data.controlPoints) || isControlPointDragging

  if (!isModified) {
    return bezierPath(data.points)
  }

  const sourceCenterPos = vector(sourceX, sourceY).trunc()
  const targetCenterPos = vector(targetX, targetY).trunc()

  const sourceNd = {
    // Calculate node top-left from center position
    ...sourceCenterPos
      .subtract(vector(sourceNodeWidth, sourceNodeHeight).divide(2))
      .trunc()
      .toObject(),
    width: sourceNodeWidth,
    height: sourceNodeHeight,
  }
  const targetNd = {
    // Calculate node top-left from center position
    ...targetCenterPos
      .subtract(vector(targetNodeWidth, targetNodeHeight).divide(2))
      .trunc()
      .toObject(),
    width: targetNodeWidth,
    height: targetNodeHeight,
  }

  const nodeMargin = 6
  const points = data.dir === 'back'
    ? [
      targetCenterPos,
      getNodeIntersectionFromCenterToPoint(targetNd, first(controlPoints) ?? sourceCenterPos, nodeMargin),
      ...controlPoints,
      getNodeIntersectionFromCenterToPoint(sourceNd, last(controlPoints) ?? targetCenterPos, nodeMargin),
      sourceCenterPos,
    ]
    : [
      sourceCenterPos,
      getNodeIntersectionFromCenterToPoint(sourceNd, first(controlPoints) ?? targetCenterPos, nodeMargin),
      ...controlPoints,
      getNodeIntersectionFromCenterToPoint(targetNd, last(controlPoints) ?? sourceCenterPos, nodeMargin),
      targetCenterPos,
    ]

  return nonNullable(curve(points))
}
