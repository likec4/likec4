import type { Tagged } from 'type-fest'
import type { NonEmptyArray } from '../types/_common'
import { invariant } from '../utils/invariant'
import type { Point, XYPoint } from './types'

/** Coordinates within one diagram unit count as equal, to absorb Graphviz rounding. */
export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1
}

/**
 * A complete Graphviz spline whose cubics are all horizontal or vertical, as checked by {@link isOrthoSpline}.
 * Tagged so that a `false` result does not narrow a caller's `NonEmptyArray<Point>` to `never`.
 */
export type OrthoSpline = Tagged<NonEmptyArray<Point>, 'OrthoSpline'>

/**
 * True when `points` is a complete Graphviz spline (`1 + 3n` points, at least one) and every cubic is
 * horizontal or vertical within one unit. A single point is an ortho spline without cubics.
 */
export function isOrthoSpline(points: ReadonlyArray<Point>): points is OrthoSpline {
  if (!isSplineLength(points.length)) {
    return false
  }
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
 *
 * @throws when `points` is not a spline of `1 + 3n` points
 */
export function splineToPolyline(points: ReadonlyArray<Point>): NonEmptyArray<XYPoint> {
  invariant(isSplineLength(points.length), `Expected a spline of 1 + 3n points, got ${points.length}`)
  const [x0, y0] = points[0]!
  const result: NonEmptyArray<XYPoint> = [{ x: x0, y: y0 }]
  for (let i = 3; i < points.length; i += 3) {
    const [x, y] = points[i]!
    const prev = result[result.length - 1]!
    if (!(nearlyEqual(prev.x, x) && nearlyEqual(prev.y, y))) {
      result.push({ x, y })
    }
  }
  return result
}

function isSplineLength(length: number): boolean {
  return length % 3 === 1
}
