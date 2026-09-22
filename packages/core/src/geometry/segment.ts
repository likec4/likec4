import { nearlyEqual } from './spline'
import type { XYPoint } from './types'

/**
 * Returns the Euclidean distance between two points, in their coordinate units.
 */
export function distanceBetween(a: XYPoint, b: XYPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Projects a point onto a line segment.
 *
 * @param p The point to project.
 * @param a The segment start.
 * @param b The segment end.
 * @returns The closest point, its position `t` from 0 at `a` to 1 at `b`, and its distance from `p`.
 * For a zero-length segment, returns `a` with `t` set to 0.
 */
export function projectOnSegment(p: XYPoint, a: XYPoint, b: XYPoint): { point: XYPoint; t: number; distance: number } {
  const dx = b.x - a.x, dy = b.y - a.y
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2))
  const point = { x: a.x + dx * t, y: a.y + dy * t }
  return { point, t, distance: distanceBetween(p, point) }
}

/**
 * A straight route segment, stored as `[from, to]`.
 */
export type Segment = [from: XYPoint, to: XYPoint]

/**
 * Checks whether a segment follows the axis and direction of a preceding segment.
 *
 * The caller must check that the segments connect; this function only checks their alignment.
 * Coordinates use the one-unit tolerance from {@link nearlyEqual}.
 */
export function continuesRun(previous: Segment, from: XYPoint, to: XYPoint): boolean {
  return (nearlyEqual(previous[0].x, from.x) && nearlyEqual(from.x, to.x) &&
    Math.sign(to.y - from.y) === Math.sign(from.y - previous[0].y))
    || (nearlyEqual(previous[0].y, from.y) && nearlyEqual(from.y, to.y) &&
      Math.sign(to.x - from.x) === Math.sign(from.x - previous[0].x))
}

/**
 * Returns the straight segments of a polyline in drawing order.
 *
 * Merges consecutive segments that share an axis and direction. Skips consecutive points
 * whose coordinates are equal within the tolerance from {@link nearlyEqual}.
 * Returns an empty array when no segment remains.
 */
export function polylineToSegments(points: ReadonlyArray<XYPoint>): Segment[] {
  const segments: Segment[] = []
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]!, to = points[i]!
    if (nearlyEqual(from.x, to.x) && nearlyEqual(from.y, to.y)) {
      continue
    }
    const previous = segments.at(-1)
    if (previous && continuesRun(previous, from, to)) {
      previous[1] = to
    } else {
      segments.push([from, to])
    }
  }
  return segments
}
