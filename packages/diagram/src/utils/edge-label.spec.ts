import { describe, expect, it } from 'vitest'
import { orthoSpline, source, target } from './__fixtures__/edges'
import { edgeLabelAnchor } from './edge-label'
import { type Segment, editedEdgePath, layoutedEdgePath } from './edge-path'

const seg = (x1: number, y1: number, x2: number, y2: number): Segment => [{ x: x1, y: y1 }, { x: x2, y: y2 }]

describe('edge label anchor', () => {
  it('anchors the label at half the path length under spline routing', () => {
    const path = {
      getTotalLength: () => 200,
      getPointAtLength: (distance: number) => ({ x: distance, y: distance / 2 + 0.4 }),
    }
    expect(edgeLabelAnchor({ path, segments: [], routing: 'spline' })).toEqual({ x: 100, y: 50 })
  })

  describe('under ortho routing', () => {
    const path = {
      getTotalLength: () => 1000,
      getPointAtLength: () => ({ x: -1, y: -1 }),
    }

    it('anchors the label at the midpoint of the longest segment', () => {
      const segments = [seg(0, 0, 100, 0), seg(100, 0, 100, 50), seg(100, 50, 300, 50), seg(300, 50, 300, 80)]
      expect(edgeLabelAnchor({ path, segments, routing: 'ortho' })).toEqual({ x: 200, y: 50 })
    })

    it('picks the first of equally long segments', () => {
      const segments = [seg(0, 0, 100, 0), seg(100, 0, 100, 100), seg(100, 100, 150, 100)]
      expect(edgeLabelAnchor({ path, segments, routing: 'ortho' })).toEqual({ x: 50, y: 0 })
    })

    it('measures the straight cubics of an untouched ortho edge the same way', () => {
      const { segments } = layoutedEdgePath({ points: orthoSpline, source, target, routing: 'ortho' })
      // right 60px, then down 120px: the vertical run wins
      expect(edgeLabelAnchor({ path, segments, routing: 'ortho' })).toEqual({ x: 160, y: 110 })
    })

    it('measures the straight pieces between the rounded corners of an edited edge', () => {
      const { segments } = editedEdgePath({ source, target, controlPoints: [{ x: 550, y: 150 }], routing: 'ortho' })
      // the horizontal run from the source border (x 202) to the corner at x 550 is the longest
      expect(edgeLabelAnchor({ path, segments, routing: 'ortho' })).toEqual({ x: 372, y: 150 })
    })

    it('falls back to half the path length when the edge has no straight segment', () => {
      expect(edgeLabelAnchor({ path, segments: [], routing: 'ortho' })).toEqual({ x: -1, y: -1 })
    })
  })
})
