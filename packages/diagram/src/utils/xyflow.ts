import { type NonEmptyArray, type Point, BBox } from '@likec4/core'
import { vector } from '@likec4/core/geometry'
import { invariant } from '@likec4/core/utils'
import { type InternalNode, type Rect, type XYPosition, Position } from '@xyflow/react'
import { type NodeHandle, type Padding, type PaddingWithUnit, getNodeDimensions } from '@xyflow/system'
import { Bezier } from 'bezier-js'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { flatMap, hasAtLeast, isArray, isNumber } from 'remeda'

export function distance(a: XYPosition, b: XYPosition) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

/**
 * Minimal type to access only needed properties of InternalNode
 */
export type MinimalInternalNode = {
  internals: {
    positionAbsolute: XYPosition
  }
  measured?: {
    width?: number
    height?: number
  }
  width?: number
  height?: number
  initialWidth?: number
  initialHeight?: number
}
/**
 * Extracts only the minimal properties from an InternalNode
 * needed for geometric calculations.
 *
 * @param nd - The InternalNode to extract from.
 * @returns An object containing only the necessary properties.
 */
export function extractMinimalInternalNode<N extends InternalNode>(nd: N): MinimalInternalNode {
  const minimal: MinimalInternalNode = {
    internals: {
      positionAbsolute: {
        x: Math.round(nd.internals.positionAbsolute.x),
        y: Math.round(nd.internals.positionAbsolute.y),
      },
    },
  }
  if (nd.measured) {
    minimal.measured = nd.measured
  }
  if (isNumber(nd.width)) {
    minimal.width = nd.width
  }
  if (isNumber(nd.height)) {
    minimal.height = nd.height
  }
  if (isNumber(nd.initialWidth)) {
    minimal.initialWidth = nd.initialWidth
  }
  if (isNumber(nd.initialHeight)) {
    minimal.initialHeight = nd.initialHeight
  }
  return minimal
}

export function isEqualMinimalInternalNodes(a: MinimalInternalNode, b: MinimalInternalNode) {
  const posA = a.internals.positionAbsolute
  const posB = b.internals.positionAbsolute
  if (posA.x !== posB.x || posA.y !== posB.y) {
    return false
  }
  const widthA = a.measured?.width ?? a.width ?? a.initialWidth ?? 0
  const widthB = b.measured?.width ?? b.width ?? b.initialWidth ?? 0
  if (widthA !== widthB) {
    return false
  }

  const heightA = a.measured?.height ?? a.height ?? a.initialHeight ?? 0
  const heightB = b.measured?.height ?? b.height ?? b.initialHeight ?? 0

  return heightA === heightB
}

export function isEqualRects(a: Rect, b: Rect) {
  return a.x === b.x
    && a.y === b.y
    && Math.round(a.width) === Math.round(b.width)
    && Math.round(a.height) === Math.round(b.height)
}

export const nodeToRect = (nd: MinimalInternalNode): Rect => ({
  x: Math.round(nd.internals.positionAbsolute.x),
  y: Math.round(nd.internals.positionAbsolute.y),
  width: nd.measured?.width ?? nd.width ?? nd.initialWidth ?? 0,
  height: nd.measured?.height ?? nd.height ?? nd.initialHeight ?? 0,
})

export function getNodeCenter(node: MinimalInternalNode): XYPosition {
  const { width, height } = getNodeDimensions(node)
  const { x, y } = node.internals.positionAbsolute

  return {
    x: Math.round(x + width / 2),
    y: Math.round(y + height / 2),
  }
}

/**
 * Helper function returns the intersection point
 * of the line between the center of the intersectionNode and the target
 *
 * @param intersectionNode the node that is the center of the line
 * @param target position of the target
 * @param nodeMargin the margin of the intersectionNode. The point will be placed at nodeMargin distance from the border of the node
 * @returns coordinates of the intersection point
 */
export function getNodeIntersectionFromCenterToPoint(
  intersectionNode: BBox,
  target: XYPosition,
  nodeMargin: number = 0,
) {
  const { width, height } = intersectionNode
  const nodeCenter = BBox.center(intersectionNode)
  const v = vector(target.x, target.y).subtract(nodeCenter)
  const xScale = (nodeMargin + width / 2) / v.x
  const yScale = (nodeMargin + height / 2) / v.y

  const scale = Math.min(Math.abs(xScale), Math.abs(yScale))

  return vector(v).multiply(scale).add(nodeCenter).round()
}

/**
 * Helper function returns the intersection point
 * of the line between the center of the intersectionNode and the target
 *
 * @param intersectionNode the node that is the center of the line
 * @param targetNode the target node
 * @returns coordinates of the intersection point
 */
export function getNodeIntersection(
  intersectionNode: MinimalInternalNode,
  targetNode: MinimalInternalNode,
): XYPosition {
  return getNodeIntersectionFromCenterToPoint(nodeToRect(intersectionNode), getNodeCenter(targetNode))
}

/**
 * Checks if a rectangle is completely inside another rectangle.
 *
 * @param test - The rectangle to test.
 * @param target - The target rectangle.
 * @returns `true` if the `test` rectangle is completely inside the `target` rectangle, otherwise `false`.
 */
export const isInside = (test: Rect, target: Rect) => {
  return (
    test.x >= target.x
    && test.y >= target.y
    && test.x + test.width <= target.x + target.width
    && test.y + test.height <= target.y + target.height
  )
}

export function bezierControlPoints(points: NonEmptyArray<Point>): NonEmptyArray<XYPosition> {
  let [start, ...bezierPoints] = points
  invariant(start, 'start should be defined')
  const handles = [
    // start
  ] as XYPosition[]

  while (hasAtLeast(bezierPoints, 3)) {
    const [cp1, cp2, end, ...rest] = bezierPoints
    const bezier = new Bezier(start[0], start[1], cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1])
    // TODO: temporary, we need correcly derive catmull-rom from bezier. Actually, from poly-bezier
    const inflections = bezier.inflections()
    if (inflections.length === 0) {
      inflections.push(0.5)
    }
    inflections.forEach(t => {
      const { x, y } = bezier.get(t)
      handles.push({
        x: Math.round(x),
        y: Math.round(y),
      })
    })
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')
  invariant(hasAtLeast(handles, 1), 'at least one control point should be generated')

  return handles
}

// If points are within 2px, consider them the same
export function isSamePoint(a: XYPosition | Point, b: XYPosition | Point) {
  const pointA = isArray(a) ? { x: a[0], y: a[1] } : a
  const pointB = isArray(b) ? { x: b[0], y: b[1] } : b
  return distanceBetweenPoints(pointA, pointB) < 2.1
}

export function distanceBetweenPoints(a: XYPosition, b: XYPosition) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function stopPropagation(e: ReactMouseEvent) {
  return e.stopPropagation()
}

export function bezierPath(bezierSpline: NonEmptyArray<Point>) {
  let [start, ...points] = bezierSpline
  invariant(start, 'start should be defined')
  let path = `M ${start[0]},${start[1]}`

  while (hasAtLeast(points, 3)) {
    const [cp1, cp2, end, ...rest] = points
    path = path + ` C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${end[0]},${end[1]}`
    points = rest
  }
  invariant(points.length === 0, 'all points should be consumed')

  return path
}

export function toXYFlowPosition(position: 'left' | 'right' | 'top' | 'bottom'): Position {
  switch (position) {
    case 'left':
      return Position.Left
    case 'right':
      return Position.Right
    case 'top':
      return Position.Top
    case 'bottom':
      return Position.Bottom
  }
}

export function createXYFlowNodeNandles(bbox: BBox): NodeHandle[] {
  const center = BBox.center(bbox)
  return flatMap(['source', 'target'] as const, type => [
    {
      type,
      position: Position.Top,
      x: center.x,
      y: bbox.y,
    },
    {
      type,
      position: Position.Left,
      x: bbox.x,
      y: center.y,
    },
    {
      type,
      position: Position.Right,
      x: bbox.x + bbox.width,
      y: center.y,
    },
    {
      type,
      position: Position.Bottom,
      x: center.x,
      y: bbox.y + bbox.height,
    },
  ])
}

/**
 * Parses a single padding value to a number
 * @internal
 * @param padding - Padding to parse
 * @param viewport - Width or height of the viewport
 * @returns The padding in pixels
 */
function parsePadding(padding: PaddingWithUnit, viewport: number): number {
  if (typeof padding === 'number') {
    return Math.floor((viewport - viewport / (1 + padding)) * 0.5)
  }

  if (typeof padding === 'string' && padding.endsWith('px')) {
    const paddingValue = parseFloat(padding)
    if (!Number.isNaN(paddingValue)) {
      return Math.floor(paddingValue)
    }
  }

  if (typeof padding === 'string' && padding.endsWith('%')) {
    const paddingValue = parseFloat(padding)
    if (!Number.isNaN(paddingValue)) {
      return Math.floor(viewport * paddingValue * 0.01)
    }
  }

  console.error(
    `[React Flow] The padding value "${padding}" is invalid. Please provide a number or a string with a valid unit (px or %).`,
  )
  return 0
}

/**
 * Parses the paddings to an object with top, right, bottom, left, x and y paddings
 * @internal
 * @param padding - Padding to parse
 * @param width - Width of the viewport
 * @param height - Height of the viewport
 * @returns An object with the paddings in pixels
 */
export function parsePaddings(
  padding: Padding,
  width: number,
  height: number,
): { top: number; bottom: number; left: number; right: number; x: number; y: number } {
  if (typeof padding === 'string' || typeof padding === 'number') {
    const paddingY = parsePadding(padding, height)
    const paddingX = parsePadding(padding, width)
    return {
      top: paddingY,
      right: paddingX,
      bottom: paddingY,
      left: paddingX,
      x: paddingX * 2,
      y: paddingY * 2,
    }
  }

  if (typeof padding === 'object') {
    const top = parsePadding(padding.top ?? padding.y ?? 0, height)
    const bottom = parsePadding(padding.bottom ?? padding.y ?? 0, height)
    const left = parsePadding(padding.left ?? padding.x ?? 0, width)
    const right = parsePadding(padding.right ?? padding.x ?? 0, width)
    return { top, right, bottom, left, x: left + right, y: top + bottom }
  }

  return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 }
}
