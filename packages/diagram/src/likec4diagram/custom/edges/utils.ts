import { type InternalNode, type XYPosition, Position } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { getNodeIntersection } from '../../../utils/xyflow'

// returns the position (top,right,bottom or right) passed node compared to the intersection point
export function getPointPosition(node: InternalNode, intersectionPoint: XYPosition) {
  const n = {
    // x: node.data.element.position[0],
    // y: node.data.element.position[1],
    ...node.internals.positionAbsolute,
    ...getNodeDimensions(node),
  }
  const nx = Math.round(n.x)
  const ny = Math.round(n.y)
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  let handlePosition = Position.Top
  if (px <= nx + 1) {
    handlePosition = Position.Left
  } else if (px >= nx + n.width - 1) {
    handlePosition = Position.Right
  } else if (py <= ny + 1) {
    handlePosition = Position.Top
  } else if (py >= n.y + n.height - 1) {
    handlePosition = Position.Bottom
  }

  let handleWidth = 8, handleHeight = 8

  let offsetX = 0
  let offsetY = 0

  // this is a tiny detail to make the markerEnd of an edge visible.
  // The handle position that gets calculated has the origin top-left, so depending which side we are using, we add a little offset
  // when the handlePosition is Position.Right for example, we need to add an offset as big as the handle itself in order to get the correct position
  switch (handlePosition) {
    case Position.Left:
      offsetX = -handleWidth
      break
    case Position.Right:
      offsetX = handleWidth
      break
    case Position.Top:
      offsetY = -handleHeight
      break
    case Position.Bottom:
      offsetY = handleHeight
      break
  }

  return [
    intersectionPoint.x + offsetX,
    intersectionPoint.y + offsetY,
    handlePosition,
  ] as const
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)

  const [sx, sy, sourcePos] = getPointPosition(source, sourceIntersectionPoint)
  const [tx, ty, targetPos] = getPointPosition(target, targetIntersectionPoint)

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  }
}
