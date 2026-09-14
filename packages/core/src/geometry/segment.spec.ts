import { describe, expect, it } from 'vitest'
import { distanceBetween, projectOnSegment } from './segment'

describe('distanceBetween', () => {
  it('is the euclidean distance', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('projectOnSegment', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 10, y: 0 }

  it('projects a point alongside the segment onto it', () => {
    expect(projectOnSegment({ x: 4, y: 3 }, a, b)).toEqual({ point: { x: 4, y: 0 }, t: 0.4, distance: 3 })
  })

  it('clamps to the nearest end beyond the segment', () => {
    expect(projectOnSegment({ x: 14, y: 3 }, a, b)).toEqual({ point: { x: 10, y: 0 }, t: 1, distance: 5 })
    expect(projectOnSegment({ x: -4, y: 3 }, a, b)).toEqual({ point: { x: 0, y: 0 }, t: 0, distance: 5 })
  })

  it('handles a zero-length segment', () => {
    expect(projectOnSegment({ x: 3, y: 4 }, a, a)).toEqual({ point: { x: 0, y: 0 }, t: 0, distance: 5 })
  })
})
