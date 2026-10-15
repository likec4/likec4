import { describe, expect, it } from 'vitest'
import { BBox } from './bbox'
import { type LabelRoute, placeLabelAlongSegments, placeLabelsAlongRoutes } from './label'
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

  it('slides past a crossing relationship without covering the line', () => {
    const crossing = seg(100, 50, 100, 150)
    const box = placeLabelAlongSegments({
      segments: [seg(0, 100, 200, 100)],
      size,
      obstacles: [],
      routes: [crossing],
    })
    expect(BBox.intersects(box, { x: 98, y: 50, width: 4, height: 100 })).toBe(false)
    expect(box.y + box.height <= 100 || box.y >= 100).toBe(true)
  })

  it('finds a narrow clear position between routes that lies between sampling steps', () => {
    const crossings = [100, 140].map(y => seg(0, y, 400, y))
    const box = placeLabelAlongSegments({
      segments: [seg(100, 60, 100, 170)],
      size: { width: 60, height: 35 },
      obstacles: [
        { x: 0, y: 0, width: 400, height: 60 },
        { x: 0, y: 180, width: 400, height: 60 },
      ],
      routes: crossings,
    })
    expect(box.y).toBeGreaterThanOrEqual(102)
    expect(box.y + box.height).toBeLessThanOrEqual(138)
  })
})

describe('placeLabelsAlongRoutes', () => {
  const route = (id: string, x: number): LabelRoute => ({
    id,
    segments: [seg(x, 0, x, 300)],
    labelBBox: { x: x + 4, y: 140, ...size },
  })

  it('keeps neighbouring labels clear of each other and both routes', () => {
    const routes = [route('a', 100), route('b', 120)]
    const placed = placeLabelsAlongRoutes(routes, [])
    expect(BBox.intersects(placed.get('a')!, placed.get('b')!)).toBe(false)
    for (const box of placed.values()) {
      for (const x of [100, 120]) {
        expect(BBox.intersects(box, { x: x - 1, y: 0, width: 2, height: 300 })).toBe(false)
      }
    }
    expect(placeLabelsAlongRoutes([...routes].reverse(), [])).toEqual(placed)
  })

  it('reserves a hand-moved label before placing automatic labels', () => {
    const automatic = route('a', 100)
    const fixed = { ...route('z', 300), fixed: true, labelBBox: automatic.labelBBox }
    const placed = placeLabelsAlongRoutes([automatic, fixed], [])
    expect(placed.get('z')).toBe(fixed.labelBBox)
    expect(BBox.intersects(placed.get('a')!, placed.get('z')!)).toBe(false)
  })

  it('avoids an unlabelled route and reserves labels on routes without segments', () => {
    const routes: LabelRoute[] = [
      route('a', 100),
      { id: 'unlabelled', segments: [seg(120, 0, 120, 300)], labelBBox: null },
      { id: 'no-segments', segments: [], labelBBox: { x: 36, y: 140, ...size } },
    ]
    const placed = placeLabelsAlongRoutes(routes, [])
    expect(placed.has('unlabelled')).toBe(false)
    expect(placed.get('no-segments')).toBe(routes[2]!.labelBBox)
    expect(BBox.intersects(placed.get('a')!, placed.get('no-segments')!)).toBe(false)
    expect(BBox.intersects(placed.get('a')!, { x: 119, y: 0, width: 2, height: 300 })).toBe(false)
  })
})
