import {
  type BBox,
  nonNullable,
  vector,
} from '@likec4/core'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { useCallback } from 'react'
import { first, isTruthy, last } from 'remeda'
import { useXYStore } from '../../../hooks/useXYFlow'
import {
  bezierPath,
  getNodeIntersectionFromCenterToPoint,
  isEqualRects,
  nodeToRect,
} from '../../../utils/xyflow'
import type { Types } from '../../types'

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => Math.round(d.x))
  .y(d => Math.round(d.y))

const isSameRects = <T extends { sourceNode: BBox; targetNode: BBox }>(a: T, b: T) =>
  isEqualRects(a.sourceNode, b.sourceNode) &&
  isEqualRects(a.targetNode, b.targetNode)

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
  const {
    sourceNode,
    targetNode,
  } = useXYStore(
    useCallback(({ nodeLookup }) => {
      const sourceNode = nonNullable(nodeLookup.get(source), `source node ${source} not found`)
      const targetNode = nonNullable(nodeLookup.get(target), `target node ${target} not found`)
      return {
        sourceNode: nodeToRect(sourceNode),
        targetNode: nodeToRect(targetNode),
      }
    }, [source, target]),
    isSameRects,
  )

  const isModified = isTruthy(data.controlPoints) || isControlPointDragging

  if (isModified) {
    const sourceCenterPos = { x: sourceX, y: sourceY }
    const targetCenterPos = { x: targetX, y: targetY }
    const sourceNd = {
      ...vector(sourceX, sourceY)
        .subtract(vector(sourceNode.width, sourceNode.height).divide(2))
        .round()
        .toObject(),
      width: sourceNode.width,
      height: sourceNode.height,
    }
    const targetNd = {
      ...vector(targetX, targetY)
        .subtract(vector(targetNode.width, targetNode.height).divide(2))
        .round()
        .toObject(),
      width: targetNode.width,
      height: targetNode.height,
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

  return bezierPath(data.points)
}
