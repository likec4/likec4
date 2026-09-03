import { describe, expect, it } from 'vitest'
import type { Types } from '../types'
import { buildSimGraph } from './useGraphForceSimulation'

function testNode(id: string, x: number, y: number): Types.GraphElementNode {
  return {
    id,
    position: { x, y },
  } as unknown as Types.GraphElementNode
}

function testEdge(id: string, source: string, target: string): Types.RelationshipEdge {
  return {
    id,
    source,
    target,
  } as unknown as Types.RelationshipEdge
}

describe('buildSimGraph', () => {
  it('seeds each simulation node at the center of its graph-element node', () => {
    // position is the circle's top-left corner (center - radius), so home center = position + radius
    const a = testNode('a', 100, 100)

    const { nodes } = buildSimGraph([a], [])

    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({ id: 'a', homeX: 110, homeY: 110, x: 110, y: 110 })
  })

  it('keeps a link when both endpoints exist among the given nodes', () => {
    const a = testNode('a', 0, 0)
    const b = testNode('b', 100, 100)
    const edge = testEdge('a-b', 'a', 'b')

    const { links } = buildSimGraph([a, b], [edge])

    expect(links).toEqual([{ source: 'a', target: 'b' }])
  })

  it('drops links with a dangling endpoint not present in the given nodes', () => {
    // e.g. the other endpoint was hidden by a `where` filter, or belongs to a compound that
    // was flattened away - passing it through would make d3-force's forceLink throw
    const a = testNode('a', 0, 0)
    const edgeToMissingNode = testEdge('a-ghost', 'a', 'ghost')

    const { links } = buildSimGraph([a], [edgeToMissingNode])

    expect(links).toEqual([])
  })
})
