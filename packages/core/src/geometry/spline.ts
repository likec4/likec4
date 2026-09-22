import type { Point, XYPoint } from './types'

/** Coordinates within one diagram unit count as equal, to absorb Graphviz rounding. */
export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1
}

/**
 * True when every cubic of a Graphviz spline (`1 + 3n` points) is horizontal or vertical within
 * one unit. Trivially true without a complete cubic.
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
 * Every third point of a Graphviz spline, without consecutive duplicates. For `splines=ortho`
 * these are the route corners.
 */
export function splineToPolyline(points: ReadonlyArray<Point>): XYPoint[] {
  const result: XYPoint[] = []
  for (let i = 0; i < points.length; i += 3) {
    const [x, y] = points[i]!
    const prev = result.at(-1)
    if (!prev || !(nearlyEqual(prev.x, x) && nearlyEqual(prev.y, y))) {
      result.push({ x, y })
    }
  }
  return result
}
