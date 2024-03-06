import { type MarkerType, Position, type XYPosition } from '@xyflow/react'
import type { XYFlowNode } from '../types'

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: XYFlowNode, targetNode: XYFlowNode): XYPosition {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const intersectionNodeWidth = intersectionNode.computed?.width ?? intersectionNode.data.element.width
  const intersectionNodeHeight = intersectionNode.computed?.height ?? intersectionNode.data.element.height
  const intersectionNodePosition = intersectionNode.computed?.positionAbsolute
    ?? { x: intersectionNode.data.element.position[0], y: intersectionNode.data.element.position[1] }
  const targetPosition = targetNode.computed?.positionAbsolute
    ?? { x: targetNode.data.element.position[0], y: targetNode.data.element.position[1] }

  const w = intersectionNodeWidth / 2
  const h = intersectionNodeHeight / 2

  const x2 = intersectionNodePosition.x + w
  const y2 = intersectionNodePosition.y + h
  const x1 = targetPosition.x + (targetNode.computed?.width ?? targetNode.data.element.width) / 2
  const y1 = targetPosition.y + (targetNode.computed?.height ?? targetNode.data.element.height) / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1))
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

// returns the position (top,right,bottom or right) passed node compared to the intersection point
export function getPointPosition(node: XYFlowNode, intersectionPoint: XYPosition) {
  const n = {
    x: node.data.element.position[0],
    y: node.data.element.position[1],
    ...node.computed?.positionAbsolute,
    width: node.computed?.width ?? node.data.element.width,
    height: node.computed?.height ?? node.data.element.height
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
    handlePosition
  ] as const
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(source: XYFlowNode, target: XYFlowNode) {
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
    targetPos
  }
}
