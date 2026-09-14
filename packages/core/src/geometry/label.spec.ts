import { describe, expect, it } from 'vitest'
import { placeLabelAlongSegments } from './label'
import type { Segment } from './segment'

const seg = (x1: number, y1: number, x2: number, y2: number): Segment => [{ x: x1, y: y1 }, { x: x2, y: y2 }]
const size = { width: 60, height: 20 }

describe('placeLabelAlongSegments', () => {
  it('centres the label above the middle of a horizontal run', () => {
    expect(placeLabelAlongSegments({ segments: [seg(0, 100, 200, 100)], size, obstacles: [] }))
      .toEqual({ x: 70, y: 76, width: 60, height: 20 })
  })

  it('puts the label to the right of a vertical run', () => {
    expect(placeLabelAlongSegments({ segments: [seg(100, 0, 100, 200)], size, obstacles: [] }))
      .toEqual({ x: 104, y: 90, width: 60, height: 20 })
  })

  it('picks the longest run of an L-shaped route', () => {
    const segments = [seg(0, 0, 60, 0), seg(60, 0, 60, 300)]
    expect(placeLabelAlongSegments({ segments, size, obstacles: [] })).toEqual({ x: 64, y: 140, width: 60, height: 20 })
  })

  it('picks the first of two equally long runs', () => {
    const segments = [seg(0, 0, 100, 0), seg(100, 0, 100, 100), seg(100, 100, 150, 100)]
    expect(placeLabelAlongSegments({ segments, size, obstacles: [] })).toEqual({ x: 20, y: -24, width: 60, height: 20 })
  })

  it('uses the other side of the line when the first side is on a node', () => {
    const above = { x: 0, y: 40, width: 200, height: 50 }
    expect(placeLabelAlongSegments({ segments: [seg(0, 100, 200, 100)], size, obstacles: [above] }))
      .toEqual({ x: 70, y: 104, width: 60, height: 20 })
  })

  it('slides along the run when both sides are blocked at the middle', () => {
    const across = { x: 180, y: 0, width: 40, height: 200 }
    const box = placeLabelAlongSegments({ segments: [seg(0, 100, 400, 100)], size, obstacles: [across] })
    expect(box.y).toBe(76)
    // clear of the node plus the 6 unit clearance on either side
    expect(box.x >= 226 || box.x + box.width <= 174).toBe(true)
  })

  it('falls back to the middle of the longest run when nothing clears', () => {
    const wall = { x: -100, y: -100, width: 500, height: 500 }
    expect(placeLabelAlongSegments({ segments: [seg(0, 100, 200, 100)], size, obstacles: [wall] }))
      .toEqual({ x: 70, y: 76, width: 60, height: 20 })
  })
})
