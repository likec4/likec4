import { describe, expect, it } from 'vitest'
import { isOrthoSpline, splineToPolyline } from './spline'

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
})
