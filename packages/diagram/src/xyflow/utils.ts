import { hasAtLeast, invariant } from '@likec4/core'
import type { DiagramEdge, Point } from '@likec4/core'
import type { InternalNode, Rect, XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { Bezier } from 'bezier-js'
import { isArray } from 'remeda'
import type { InternalXYFlowNode } from './types'

export function toDomPrecision(v: number | null) {
  if (v === null) {
    return 0.01
  }
  return Math.round(v * 100) / 100
}

export function distance(a: XYPosition, b: XYPosition) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

export const nodeToRect = (nd: InternalXYFlowNode): Rect => ({
  x: nd.internals.positionAbsolute.x,
  y: nd.internals.positionAbsolute.y,
  width: nd.measured.width ?? nd.width ?? nd.data.element.width,
  height: nd.measured.height ?? nd.height ?? nd.data.element.height
})

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

export function bezierControlPoints(diagramEdge: DiagramEdge) {
  let [start, ...bezierPoints] = diagramEdge.points
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
        y: Math.round(y)
      })
    })
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')

  return handles
}

// If points are within 3px, consider them the same
const isClose = (a: number, b: number) => {
  return Math.abs(a - b) < 3.1
}

export function isSamePoint(a: XYPosition | Point, b: XYPosition | Point) {
  const [ax, ay] = isArray(a) ? a : [a.x, a.y]
  const [bx, by] = isArray(b) ? b : [b.x, b.y]
  return isClose(ax, bx) && isClose(ay, by)
}

export function distanceBetweenPoints(a: XYPosition, b: XYPosition) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

export function stopPropagation(e: React.MouseEvent) {
  return e.stopPropagation()
}

export function centerXYInternalNode<N extends InternalNode>(nd: N) {
  const { width, height } = getNodeDimensions(nd)
  return {
    x: nd.internals.positionAbsolute.x + width / 2,
    y: nd.internals.positionAbsolute.y + height / 2
  }
}
