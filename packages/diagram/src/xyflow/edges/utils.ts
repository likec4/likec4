import { Position, type XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import type { DiagramFlowTypes } from '../types'

export function getNodeCenter(node: DiagramFlowTypes.InternalNode): XYPosition {
  const { width, height } = getNodeDimensions(node)
  const { x, y } = node.internals.positionAbsolute

  return {
    x: x + width / 2,
    y: y + height / 2
  }
}

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
export function getNodeIntersectionFromCenterToPoint(
  intersectionNode: DiagramFlowTypes.InternalNode,
  { x: x1, y: y1 }: XYPosition
) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const {
    width: intersectionNodeWidth,
    height: intersectionNodeHeight
  } = getNodeDimensions(intersectionNode)

  const intersectionNodePosition = intersectionNode.internals.positionAbsolute

  const w = intersectionNodeWidth / 2
  const h = intersectionNodeHeight / 2

  const x2 = intersectionNodePosition.x + w
  const y2 = intersectionNodePosition.y + h
  // const x1 = targetPoint.x
  // const y1 = targetPoint.y

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1))
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: DiagramFlowTypes.InternalNode, targetNode: DiagramFlowTypes.InternalNode): XYPosition {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const {
    width: intersectionNodeWidth,
    height: intersectionNodeHeight
  } = getNodeDimensions(intersectionNode)
  const {
    width: targetNodeWidth,
    height: targetNodeHeight
  } = getNodeDimensions(targetNode)

  const intersectionNodePosition = intersectionNode.internals.positionAbsolute
  const targetPosition = targetNode.internals.positionAbsolute

  const w = intersectionNodeWidth / 2
  const h = intersectionNodeHeight / 2

  const x2 = intersectionNodePosition.x + w
  const y2 = intersectionNodePosition.y + h
  const x1 = targetPosition.x + targetNodeWidth / 2
  const y1 = targetPosition.y + targetNodeHeight / 2

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
export function getPointPosition(node: DiagramFlowTypes.InternalNode, intersectionPoint: XYPosition) {
  const n = {
    // x: node.data.element.position[0],
    // y: node.data.element.position[1],
    ...node.internals.positionAbsolute,
    ...getNodeDimensions(node)
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
export function getEdgeParams(source: DiagramFlowTypes.InternalNode, target: DiagramFlowTypes.InternalNode) {
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
