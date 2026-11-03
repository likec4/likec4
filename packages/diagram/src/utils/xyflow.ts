import type { NonEmptyArray, Point } from '@likec4/core'
import { type XYPoint, BBox, vector } from '@likec4/core/geometry'
import { invariant } from '@likec4/core/utils'
import type { Rect, XYPosition } from '@xyflow/react'
import { type Padding as XYFlowPadding, type PaddingWithUnit, getNodeDimensions } from '@xyflow/system'
import { Bezier } from 'bezier-js'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { hasAtLeast, isArray } from 'remeda'

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

export function isEqualRects(a: Rect, b: Rect): boolean {
  return Math.trunc(a.x) === Math.trunc(b.x)
    && Math.trunc(a.y) === Math.trunc(b.y)
    && Math.trunc(a.width) === Math.trunc(b.width)
    && Math.trunc(a.height) === Math.trunc(b.height)
}

export function isLeafNodeType(type: string | undefined): boolean {
  return type !== 'compound-element' && type !== 'compound-deployment' && type !== 'view-group'
}

export function leafNodeRects(nodes: Iterable<MinimalInternalNode & { type?: string | undefined }>): Rect[] {
  const rects: Rect[] = []
  for (const node of nodes) {
    if (isLeafNodeType(node.type)) {
      rects.push(nodeToRect(node))
    }
  }
  return rects
}

export function nodeToRect(nd: MinimalInternalNode): Rect {
  return ({
    x: Math.trunc(nd.internals.positionAbsolute.x),
    y: Math.trunc(nd.internals.positionAbsolute.y),
    width: Math.round(nd.measured?.width ?? nd.width ?? nd.initialWidth ?? 0),
    height: Math.round(nd.measured?.height ?? nd.height ?? nd.initialHeight ?? 0),
  })
}

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
): XYPosition {
  const { width, height } = intersectionNode
  const nodeCenter = BBox.center(intersectionNode)
  const v = vector(target.x, target.y).subtract(nodeCenter)
  const xScale = (nodeMargin + width / 2) / v.x
  const yScale = (nodeMargin + height / 2) / v.y

  const scale = Math.min(Math.abs(xScale), Math.abs(yScale))

  return vector(v).multiply(scale).add(nodeCenter).trunc().toObject()
}

export function bezierControlPoints(points: NonEmptyArray<Point>): NonEmptyArray<XYPoint> {
  let [start, ...bezierPoints] = points
  invariant(start, 'start should be defined')
  const handles = [
    // start
  ] as XYPoint[]

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
        x: Math.trunc(x),
        y: Math.trunc(y),
      })
    })
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')
  invariant(hasAtLeast(handles, 1), 'at least one control point should be generated')

  return handles
}

/**
 * Checks if two points are the same, considering both XYPoint (object ) and Point (tuple) formats.
 * @returns `true` If points are within 2px
 */
export function isSamePoint(a: XYPosition | Point, b: XYPosition | Point): boolean {
  if (a === b) {
    return true
  }
  const [ax, ay] = isArray(a) ? a : [a.x, a.y]
  const [bx, by] = isArray(b) ? b : [b.x, b.y]
  return Math.hypot(bx - ax, by - ay) < 2.1
}

export function stopPropagation(e: ReactMouseEvent): void {
  e.nativeEvent.stopImmediatePropagation()
  e.stopPropagation()
}

const printPoint = (point: Point) => {
  return `${Math.trunc(point[0])},${Math.trunc(point[1])}`
}

export function bezierPath(bezierSpline: NonEmptyArray<Point>): string {
  let [start, ...points] = bezierSpline
  invariant(start, 'start should be defined')
  let path = `M ${printPoint(start)}`

  while (hasAtLeast(points, 3)) {
    const [cp1, cp2, end, ...rest] = points
    path = path + ` C ${printPoint(cp1)} ${printPoint(cp2)} ${printPoint(end)}`
    points = rest
  }
  invariant(points.length === 0, 'all points should be consumed')

  return path
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
  padding: XYFlowPadding,
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
