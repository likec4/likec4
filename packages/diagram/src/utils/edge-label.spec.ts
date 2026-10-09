import { type Segment, BBox } from '@likec4/core/geometry'
import { describe, expect, it } from 'vitest'
import { orthoSpline, source, spline, target } from './__fixtures__/edges'
import { edgeLabelPosition } from './edge-label'
import { editedEdgePath, layoutedEdgePath } from './edge-path'

const seg = (x1: number, y1: number, x2: number, y2: number): Segment => [{ x: x1, y: y1 }, { x: x2, y: y2 }]
const size = { width: 60, height: 20 }
const path = {
  getTotalLength: () => 200,
  getPointAtLength: (distance: number) => ({ x: distance, y: distance / 2 + 0.4 }),
}

describe('edge label position', () => {
  it('centres the label on half the path length under spline routing', () => {
    expect(edgeLabelPosition({ path, segments: [], routing: 'spline', size, obstacles: [] })).toEqual({ x: 70, y: 40 })
  })

  it('ignores the segments and the obstacles under spline routing', () => {
    const { segments } = layoutedEdgePath({ points: spline, source, target, routing: 'spline' })
    expect(edgeLabelPosition({ path, segments, routing: 'spline', size, obstacles: [source.node] })).toEqual({
      x: 70,
      y: 40,
    })
  })

  describe('under ortho routing', () => {
    it('puts the label above the middle of the longest horizontal run', () => {
      const segments = [seg(0, 100, 200, 100), seg(200, 100, 200, 150)]
      expect(edgeLabelPosition({ path, segments, routing: 'ortho', size, obstacles: [] })).toEqual({ x: 70, y: 76 })
    })

    it('puts the label to the right of the longest vertical run of an untouched ortho edge', () => {
      const { segments } = layoutedEdgePath({ points: orthoSpline, source, target, routing: 'ortho' })
      // right 60px, then down 120px: beside the vertical run, at its middle
      expect(edgeLabelPosition({ path, segments, routing: 'ortho', size, obstacles: [] })).toEqual({ x: 164, y: 100 })
    })

    it('uses the other side of the line when a node sits on the first side', () => {
      const { segments } = editedEdgePath({ source, target, controlPoints: [{ x: 550, y: 150 }], routing: 'ortho' })
      // the horizontal run from the source border to the corner is the longest; a node above it
      const above = { x: 300, y: 60, width: 100, height: 70 }
      const placed = edgeLabelPosition({ path, segments, routing: 'ortho', size, obstacles: [above] })
      expect(placed.y).toBe(154)
    })

    it('slides along the run past a node that blocks both sides', () => {
      const segments = [seg(0, 100, 400, 100)]
      const across = { x: 180, y: 0, width: 40, height: 200 }
      const placed = edgeLabelPosition({ path, segments, routing: 'ortho', size, obstacles: [across] })
      expect(placed.y).toBe(76)
      expect(placed.x >= 226 || placed.x + size.width <= 174).toBe(true)
    })

    it('keeps an edited label clear of another label and a nearby relationship', () => {
      const segments = [seg(0, 100, 400, 100)]
      const label = { x: 170, y: 76, ...size }
      const routes = [...segments, seg(0, 110, 400, 110)]
      const placed = {
        ...edgeLabelPosition({ path, segments, routing: 'ortho', size, obstacles: [label], routes }),
        ...size,
      }
      expect(BBox.intersects(placed, label)).toBe(false)
      // The second relationship crosses every label placed below the edited route.
      expect(placed.y + placed.height).toBeLessThan(100)
    })

    it('centres a hand-moved label on the longest run itself, ignoring obstacles', () => {
      const segments = [seg(0, 100, 200, 100), seg(200, 100, 200, 150)]
      const across = { x: 80, y: 0, width: 40, height: 200 }
      expect(edgeLabelPosition({
        path,
        segments,
        routing: 'ortho',
        size,
        obstacles: [across],
        routes: [seg(0, 95, 200, 95)],
        customized: true,
      }))
        .toEqual({ x: 70, y: 90 })
    })

    it('falls back to half the path length when the edge has no straight run', () => {
      expect(edgeLabelPosition({ path, segments: [], routing: 'ortho', size, obstacles: [] })).toEqual({ x: 70, y: 40 })
    })
  })
})
