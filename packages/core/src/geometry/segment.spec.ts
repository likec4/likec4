import { describe, expect, it } from 'vitest'
import { type Segment, distanceBetween, polylineToSegments, projectOnSegment } from './segment'

const seg = (x1: number, y1: number, x2: number, y2: number): Segment => [{ x: x1, y: y1 }, { x: x2, y: y2 }]

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

describe('polylineToSegments', () => {
  it('merges collinear pieces heading the same way and splits at corners', () => {
    expect(polylineToSegments([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }])).toEqual([
      seg(0, 0, 100, 0),
      seg(100, 0, 100, 80),
    ])
  })

  it('keeps a U-turn as two segments', () => {
    expect(polylineToSegments([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 40, y: 0 }])).toEqual([
      seg(0, 0, 100, 0),
      seg(100, 0, 40, 0),
    ])
  })
})
