import { nearlyEqual } from './spline'
import type { XYPoint } from './types'

/**
 * Euclidean distance between two points
 */
export function distanceBetween(a: XYPoint, b: XYPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Closest point of the segment `[a, b]` to `p`, its position `t` along the segment (0 at `a`, 1 at `b`)
 * and the distance from `p` to it
 */
export function projectOnSegment(p: XYPoint, a: XYPoint, b: XYPoint): { point: XYPoint; t: number; distance: number } {
  const dx = b.x - a.x, dy = b.y - a.y
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2))
  const point = { x: a.x + dx * t, y: a.y + dy * t }
  return { point, t, distance: distanceBetween(p, point) }
}

/**
 * A straight piece of a route, as `[from, to]`
 */
export type Segment = [from: XYPoint, to: XYPoint]

/**
 * Whether the piece `from -> to` continues the straight run of `previous`: same axis, same direction
 */
export function continuesRun(previous: Segment, from: XYPoint, to: XYPoint): boolean {
  return (nearlyEqual(previous[0].x, from.x) && nearlyEqual(from.x, to.x) &&
    Math.sign(to.y - from.y) === Math.sign(from.y - previous[0].y))
    || (nearlyEqual(previous[0].y, from.y) && nearlyEqual(from.y, to.y) &&
      Math.sign(to.x - from.x) === Math.sign(from.x - previous[0].x))
}

/**
 * Straight runs of a polyline: consecutive pieces that share an axis and head the same way
 * form one segment, a change of direction starts a new one. Zero-length pieces are skipped.
 */
export function polylineToSegments(points: ReadonlyArray<XYPoint>): Segment[] {
  const segments: Segment[] = []
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]!, to = points[i]!
    if (nearlyEqual(from.x, to.x) && nearlyEqual(from.y, to.y)) {
      continue
    }
    const previous = segments[segments.length - 1]
    if (previous && continuesRun(previous, from, to)) {
      previous[1] = to
    } else {
      segments.push([from, to])
    }
  }
  return segments
}
