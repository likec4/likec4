import {
  nonNullable,
  vector,
} from '@likec4/core'
import type { XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { shallowEqual } from 'fast-equals'
import { useCallback, useMemo } from 'react'
import { first, isTruthy, last } from 'remeda'
import { useXYStore } from '../../../hooks/useXYFlow'
import {
  bezierPath,
  getNodeIntersectionFromCenterToPoint,
} from '../../../utils/xyflow'
import type { Types } from '../../types'

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => Math.round(d.x))
  .y(d => Math.round(d.y))

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
}) {
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
        Math.round(sourceNode.width),
        Math.round(sourceNode.height),
        Math.round(targetNode.width),
        Math.round(targetNode.height),
      ] as const
    }, [source, target]),
    shallowEqual,
  )

  const isModified = isTruthy(data.controlPoints) || isControlPointDragging

  return useMemo(
    () => {
      if (!isModified) {
        return bezierPath(data.points)
      }

      const sourceCenterPos = { x: sourceX, y: sourceY }
      const targetCenterPos = { x: targetX, y: targetY }
      const sourceNd = {
        ...vector(sourceX, sourceY)
          .subtract(vector(sourceNodeWidth, sourceNodeHeight).divide(2))
          .round()
          .toObject(),
        width: sourceNodeWidth,
        height: sourceNodeHeight,
      }
      const targetNd = {
        ...vector(targetX, targetY)
          .subtract(vector(targetNodeWidth, targetNodeHeight).divide(2))
          .round()
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
    },
    !isModified ? [data.points] : [
      isModified,
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourceNodeWidth,
      sourceNodeHeight,
      targetNodeWidth,
      targetNodeHeight,
      data.dir,
      controlPoints,
    ],
  )
}
