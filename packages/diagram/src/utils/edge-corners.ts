import { isOrthoSpline, nearlyEqual, projectOnSegment, splineToPolyline } from '@likec4/core/geometry'
import type { EdgeRouting, NonEmptyArray, Point } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { type Endpoints, inDrawingOrder, orthoPolyline } from './edge-path'
import { bezierControlPoints } from './xyflow'

/**
 * Corners of an ortho spline: the on-curve points (every third one), endpoints excluded,
 * consecutive duplicates and collinear middles dropped.
 */
function orthoCorners(points: NonEmptyArray<Point>): XYPosition[] {
  const anchors = splineToPolyline(points).map(p => ({ x: Math.trunc(p.x), y: Math.trunc(p.y) }))
  const corners: XYPosition[] = []
  for (let i = 1; i < anchors.length - 1; i++) {
    const a = anchors[i - 1]!, b = anchors[i]!, c = anchors[i + 1]!
    const straight = (nearlyEqual(a.y, b.y) && nearlyEqual(b.y, c.y)) ||
      (nearlyEqual(a.x, b.x) && nearlyEqual(b.x, c.x))
    if (!straight) {
      corners.push(b)
    }
  }
  return corners
}

/**
 * Initial control points of an edge that has none yet, derived from its layouted points.
 * Under ortho routing these are the corners of the route (the midpoint for a straight edge);
 * spline routing, and legacy curved geometry under ortho, derive handles from the curve.
 */
export function initialControlPoints(
  points: NonEmptyArray<Point>,
  routing: EdgeRouting,
): XYPosition[] {
  if (routing !== 'ortho' || !isOrthoSpline(points)) {
    return bezierControlPoints(points)
  }
  const corners = orthoCorners(points)
  if (corners.length > 0) {
    return corners
  }
  const [ax, ay] = points[0]
  const [bx, by] = points[points.length - 1]!
  return [{ x: Math.trunc((ax + bx) / 2), y: Math.trunc((ay + by) / 2) }]
}

/** how close (flow units) a dragged corner must come to a neighbour's axis to snap onto it */
const SNAP_TOLERANCE = 8

/** node centres of the edge, in the order the edge is declared */
type CornerEditing = Endpoints<XYPosition> & {
  controlPoints: ReadonlyArray<XYPosition>
  routing: EdgeRouting
}

/**
 * Position of a dragged corner. Under ortho routing it snaps to the x or y of the previous
 * or next anchor (the node centres for the end corners) when within tolerance,
 * so a careful drag keeps segments straight and a deliberate one creates an elbow.
 * Snapping both axes onto the same neighbour makes the corner coincide with it,
 * which the drawn route then skips.
 */
export function snapCorner({ index, point, controlPoints, routing, ...edge }: CornerEditing & {
  index: number
  point: XYPosition
}): XYPosition {
  if (routing !== 'ortho') {
    return point
  }
  const [from, to] = inDrawingOrder(edge)
  const prev = controlPoints[index - 1] ?? from
  const next = controlPoints[index + 1] ?? to
  const snap = (value: number, candidates: number[]) => {
    let best = value, bestDistance = SNAP_TOLERANCE + 1
    for (const raw of candidates) {
      // node centres may be fractional; corners are stored as integers
      const candidate = Math.trunc(raw)
      const distance = Math.abs(candidate - value)
      if (distance <= SNAP_TOLERANCE && distance < bestDistance) {
        best = candidate
        bestDistance = distance
      }
    }
    return best
  }
  return {
    x: snap(point.x, [prev.x, next.x]),
    y: snap(point.y, [prev.y, next.y]),
  }
}

/**
 * Control points after inserting a new one where the user clicked.
 * Under spline routing the raw point is inserted before the segment (between consecutive anchors)
 * it is closest to. Under ortho routing the point is projected onto the drawn route
 * (elbow legs included), so the new corner lies exactly on the line until it is dragged.
 */
export function insertCorner({ point, controlPoints, routing, ...edge }: CornerEditing & {
  point: XYPosition
}): XYPosition[] {
  const [from, to] = inDrawingOrder(edge)
  const result = [...controlPoints]
  if (routing === 'ortho') {
    const { points, insertAt } = orthoPolyline(controlPoints, from, to)
    let best = { index: 0, point, distance: Infinity }
    for (let i = 1; i < points.length; i++) {
      const candidate = projectOnSegment(point, points[i - 1]!, points[i]!)
      if (candidate.distance < best.distance) {
        best = { index: insertAt[i]!, point: candidate.point, distance: candidate.distance }
      }
    }
    result.splice(best.index, 0, { x: Math.round(best.point.x), y: Math.round(best.point.y) })
    return result
  }
  const anchors = [from, ...controlPoints, to]
  const newPoint = { x: Math.round(point.x), y: Math.round(point.y) }
  let insertionIndex = 0
  let minDistance = Infinity
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]!, b = anchors[i + 1]!
    const abx = b.x - a.x, aby = b.y - a.y
    const apx = newPoint.x - a.x, apy = newPoint.y - a.y
    const bpx = newPoint.x - b.x, bpy = newPoint.y - b.y
    // is the pointer alongside the segment?
    if ((abx * apx + aby * apy) * (abx * bpx + aby * bpy) < 0) {
      // distance to the segment approximated by a straight line
      const distanceToEdge = Math.abs(abx * apy - aby * apx) / Math.hypot(abx, aby)
      if (distanceToEdge < minDistance) {
        minDistance = distanceToEdge
        insertionIndex = i
      }
    }
  }
  result.splice(insertionIndex, 0, newPoint)
  return result
}
