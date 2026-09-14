import type { Point, XYPoint } from './types'

/**
 * Whether two coordinates are within one unit of each other.
 * Graphviz emits sub-pixel noise on axis-aligned routes, so spline geometry compares with this tolerance.
 */
export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1
}

/**
 * Whether every cubic of a Graphviz spline (`1 + 3n` points) is axis-aligned, as `splines=ortho` produces.
 * All four points of a cubic must share an axis: a curved arc has its endpoints aligned too.
 */
export function isOrthoSpline(points: ReadonlyArray<Point>): boolean {
  for (let i = 0; i + 3 < points.length; i += 3) {
    const cubic = [points[i]!, points[i + 1]!, points[i + 2]!, points[i + 3]!]
    const sameX = cubic.every(([x]) => nearlyEqual(x, cubic[0]![0]))
    const sameY = cubic.every(([, y]) => nearlyEqual(y, cubic[0]![1]))
    if (!sameX && !sameY) {
      return false
    }
  }
  return true
}

/**
 * On-curve points of a Graphviz spline (every third point), consecutive duplicates removed.
 * Under `splines=ortho` these are the corners of the route.
 */
export function splineToPolyline(points: ReadonlyArray<Point>): XYPoint[] {
  const result: XYPoint[] = []
  for (let i = 0; i < points.length; i += 3) {
    const [x, y] = points[i]!
    const prev = result[result.length - 1]
    if (!prev || !(nearlyEqual(prev.x, x) && nearlyEqual(prev.y, y))) {
      result.push({ x, y })
    }
  }
  return result
}
