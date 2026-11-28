import { describe, expect, it } from 'vitest'
import { edgeEndsFromNodes } from './edge-endpoints'

const node = (id: string, x: number, y: number, handleBounds?: unknown) => ({
  id,
  position: { x, y },
  measured: { width: 100, height: 60 },
  internals: { positionAbsolute: { x, y }, handleBounds },
})

describe('edgeEndsFromNodes', () => {
  const edge = { source: 'a', target: 'b', sourceX: 50, sourceY: 63, targetX: 50, targetY: 297 }

  it('returns the handle centers, not the handle sides XYFlow passes to the edge, with the node bounds', () => {
    // 6px handles at the box centre: XYFlow reports the handle side (63), the route starts at its centre (60)
    const nodeLookup = new Map([
      ['a', node('a', 0, 0, { source: [{ x: 47, y: 57, width: 6, height: 6 }], target: null })],
      ['b', node('b', 0, 240, { source: null, target: [{ x: 47, y: 27, width: 6, height: 6 }] })],
    ])
    expect(edgeEndsFromNodes(nodeLookup as never, edge)).toEqual({
      source: { center: { x: 50, y: 60 }, node: { x: 0, y: 0, width: 100, height: 60 } },
      target: { center: { x: 50, y: 270 }, node: { x: 0, y: 240, width: 100, height: 60 } },
    })
  })

  it('falls back to a box of size zero at the XYFlow position when a node is missing', () => {
    expect(edgeEndsFromNodes(new Map() as never, edge)).toEqual({
      source: { center: { x: 50, y: 63 }, node: { x: 50, y: 63, width: 0, height: 0 } },
      target: { center: { x: 50, y: 297 }, node: { x: 50, y: 297, width: 0, height: 0 } },
    })
  })
})
