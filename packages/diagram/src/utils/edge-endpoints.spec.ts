import { describe, expect, it } from 'vitest'
import { edgeEndCenters } from './edge-endpoints'

const node = (id: string, x: number, y: number, handleBounds?: unknown) => ({
  id,
  position: { x, y },
  measured: { width: 100, height: 60 },
  internals: { positionAbsolute: { x, y }, handleBounds },
})

describe('edgeEndCenters', () => {
  const edge = { source: 'a', target: 'b', sourceX: 50, sourceY: 63, targetX: 50, targetY: 297 }

  it('uses the handle centers, not the handle sides XYFlow passes to the edge', () => {
    // 6px handles at the box centre: XYFlow reports the handle side (63), the route starts at its centre (60)
    const nodeLookup = new Map([
      ['a', node('a', 0, 0, { source: [{ x: 47, y: 57, width: 6, height: 6 }], target: null })],
      ['b', node('b', 0, 240, { source: null, target: [{ x: 47, y: 27, width: 6, height: 6 }] })],
    ])
    expect(edgeEndCenters(nodeLookup as never, edge)).toEqual({
      source: { x: 50, y: 60 },
      target: { x: 50, y: 270 },
    })
  })

  it('falls back to the XYFlow positions when a node is missing', () => {
    expect(edgeEndCenters(new Map() as never, edge)).toEqual({
      source: { x: 50, y: 63 },
      target: { x: 50, y: 297 },
    })
  })
})
