import { nearlyEqual } from './spline'
import type { XYPoint } from './types'

export function distanceBetween(a: XYPoint, b: XYPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Projects `p` onto segment `ab`: the closest point, its position `t` (0 at `a`, 1 at `b`) and the
 * distance. A zero-length segment returns `a` with `t` 0.
 */
export function projectOnSegment(p: XYPoint, a: XYPoint, b: XYPoint): { point: XYPoint; t: number; distance: number } {
  const dx = b.x - a.x, dy = b.y - a.y
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2))
  const point = { x: a.x + dx * t, y: a.y + dy * t }
  return { point, t, distance: distanceBetween(p, point) }
}

/** A straight route segment. */
export type Segment = [from: XYPoint, to: XYPoint]

/**
 * True when `from` to `to` continues `previous` on the same axis and direction, within one unit.
 * Does not check that the segments connect.
 */
export function continuesRun(previous: Segment, from: XYPoint, to: XYPoint): boolean {
  return (nearlyEqual(previous[0].x, from.x) && nearlyEqual(from.x, to.x) &&
    Math.sign(to.y - from.y) === Math.sign(from.y - previous[0].y))
    || (nearlyEqual(previous[0].y, from.y) && nearlyEqual(from.y, to.y) &&
      Math.sign(to.x - from.x) === Math.sign(from.x - previous[0].x))
}

/**
 * Straight segments of a polyline in drawing order, merging collinear pieces that head the same way
 * and skipping points that repeat within one unit.
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
