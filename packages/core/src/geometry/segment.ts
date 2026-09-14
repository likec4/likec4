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
