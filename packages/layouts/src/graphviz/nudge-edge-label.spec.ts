import type { BBox } from '@likec4/core/geometry'
import type { NodeId, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { nudgeLabelOffEndpoints } from './nudge-edge-label'

// two boxes one above the other, a straight vertical ortho edge between them
const a = { x: 0, y: 0, width: 200, height: 100, children: [] as NodeId[] }
const b = { x: 0, y: 160, width: 200, height: 100, children: [] as NodeId[] }
const nodes = new Map([['a' as NodeId, a], ['b' as NodeId, b]])

const edge = (labelBBox: BBox) => ({
  source: 'a' as NodeId,
  target: 'b' as NodeId,
  points: [[100, 100], [100, 100], [100, 160], [100, 160]] as [Point, ...Point[]],
  labelBBox,
})

describe('nudgeLabelOffEndpoints', () => {
  it('leaves a label alone when it clears both endpoint boxes', () => {
    const input = edge({ x: 80, y: 122, width: 40, height: 16 })
    expect(nudgeLabelOffEndpoints(input, nodes)).toBe(input)
  })

  it('moves a label that sits on the target box back along the edge until it clears', () => {
    const input = edge({ x: 80, y: 150, width: 40, height: 24 })
    const result = nudgeLabelOffEndpoints(input, nodes)
    expect(result).not.toBe(input)
    const bbox = result.labelBBox
    expect(bbox.y + bbox.height).toBeLessThanOrEqual(b.y - 6)
    expect(bbox.x).toBe(80)
  })

  it('moves a label that sits on the source box forward along the edge', () => {
    const input = edge({ x: 80, y: 90, width: 40, height: 24 })
    const bbox = nudgeLabelOffEndpoints(input, nodes).labelBBox
    expect(bbox.y).toBeGreaterThanOrEqual(a.y + a.height + 6)
    expect(bbox.x).toBe(80)
  })

  it('ignores compound endpoints', () => {
    const withCompound = new Map([['a' as NodeId, a], ['b' as NodeId, { ...b, children: ['x' as NodeId] }]])
    const input = edge({ x: 80, y: 150, width: 40, height: 24 })
    expect(nudgeLabelOffEndpoints(input, withCompound)).toBe(input)
  })

  it('leaves a label alone when it is wider than the whole gap', () => {
    const input = edge({ x: 0, y: 110, width: 400, height: 60 })
    expect(nudgeLabelOffEndpoints(input, nodes)).toBe(input)
  })
})
