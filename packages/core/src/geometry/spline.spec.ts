import { describe, expect, expectTypeOf, it } from 'vitest'
import type { NonEmptyArray } from '../types/_common'
import { type OrthoSpline, isOrthoSpline, splineToPolyline } from './spline'
import type { Point, XYPoint } from './types'

describe('isOrthoSpline', () => {
  it('accepts a spline whose cubics are all axis-aligned', () => {
    // two cubics: a horizontal run and a vertical run (Graphviz ortho output has collinear control points)
    expect(isOrthoSpline([[0, 0], [10, 0], [20, 0], [30, 0], [30, 10], [30, 20], [30, 30]])).toBe(true)
  })

  it('tolerates sub-pixel noise', () => {
    expect(isOrthoSpline([[0, 0], [10, 0.5], [20, 0.9], [30, 0]])).toBe(true)
  })

  it('rejects a cubic whose control points leave the axis, even when its endpoints are aligned', () => {
    expect(isOrthoSpline([[0, 0], [10, 20], [20, 20], [30, 0]])).toBe(false)
  })

  it('accepts a single point', () => {
    expect(isOrthoSpline([[5, 5]])).toBe(true)
  })

  it('rejects input that is not a spline of 1 + 3n points', () => {
    expect(isOrthoSpline([])).toBe(false)
    expect(isOrthoSpline([[0, 0], [10, 0]])).toBe(false)
    expect(isOrthoSpline([[0, 0], [10, 0], [20, 0], [30, 0], [40, 0]])).toBe(false)
  })

  it('narrows the points to a non-empty array', () => {
    const points: ReadonlyArray<Point> = [[5, 5]]
    expect(isOrthoSpline(points)).toBe(true)
    if (isOrthoSpline(points)) {
      expectTypeOf(points).toEqualTypeOf<OrthoSpline>()
      expectTypeOf(points).toExtend<NonEmptyArray<Point>>()
    }
  })

  it('keeps a rejected non-empty array non-empty', () => {
    const points: NonEmptyArray<Point> = [[0, 0], [10, 10], [20, 0], [30, 10]]
    if (isOrthoSpline(points)) {
      throw new Error('expected a curved spline to be rejected')
    }
    expectTypeOf(points).toEqualTypeOf<NonEmptyArray<Point>>()
    expect(points.map(([x]) => x)).toEqual([0, 10, 20, 30])
  })
})

describe('splineToPolyline', () => {
  it('keeps every third point and drops consecutive duplicates', () => {
    expect(splineToPolyline([[0, 0], [5, 0], [10, 0], [10, 0], [10, 5], [10, 10], [10, 10]])).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ])
  })

  it('treats points within one unit as the same corner', () => {
    expect(splineToPolyline([[0, 0], [1, 0], [2, 0], [0.6, 0.4]])).toEqual([{ x: 0, y: 0 }])
  })

  it('returns a non-empty polyline', () => {
    expectTypeOf(splineToPolyline([[5, 5]])).toEqualTypeOf<NonEmptyArray<XYPoint>>()
    expect(splineToPolyline([[5, 5]])).toEqual([{ x: 5, y: 5 }])
  })

  it('throws on input that is not a spline of 1 + 3n points', () => {
    expect(() => splineToPolyline([])).toThrow('Expected a spline of 1 + 3n points, got 0')
    expect(() => splineToPolyline([[0, 0], [10, 0]])).toThrow('got 2')
    expect(() => splineToPolyline([[0, 0], [10, 0], [20, 0], [30, 0], [40, 0]])).toThrow('got 5')
  })
})
