import type { Point, XYPoint } from './types'

/**
 * Checks whether two coordinates differ by at most one diagram unit.
 *
 * This tolerance accounts for small coordinate differences in Graphviz output.
 */
export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1
}

/**
 * Checks whether each cubic segment of a Graphviz spline is horizontal or vertical.
 *
 * Expects `1 + 3n` points for `n` cubic segments. All four points of each segment must share
 * an x or y coordinate within the tolerance from {@link nearlyEqual}.
 * Returns true when there are no complete cubic segments; does not validate the point count.
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
 * Returns the points on a Graphviz spline, removing consecutive duplicates.
 *
 * Reads every third point, starting with the first, and compares coordinates with {@link nearlyEqual}.
 * For `splines=ortho`, these points describe the route corners. Returns an empty array for empty input.
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
