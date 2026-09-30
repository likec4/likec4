import { describe, expect, it } from 'vitest'
import type { Types } from '../types'
import { buildSimGraph, selectGraphTopology } from './useGraphForceSimulation'

function testNode(id: string, x: number, y: number, overrides: Partial<Types.Node> = {}): Types.Node {
  return {
    id,
    type: 'graph-element',
    position: { x, y },
    ...overrides,
  } as unknown as Types.Node
}

function testEdge(id: string, source: string, target: string, overrides: Partial<Types.Edge> = {}): Types.Edge {
  return {
    id,
    type: 'relationship',
    source,
    target,
    ...overrides,
  } as unknown as Types.Edge
}

describe('selectGraphTopology', () => {
  it('excludes hidden nodes', () => {
    const visible = testNode('visible', 0, 0)
    const hidden = testNode('hidden', 0, 0, { hidden: true })

    const { graphNodes } = selectGraphTopology([visible, hidden], [])

    expect(graphNodes.map(n => n.id)).toEqual(['visible'])
  })

  it('excludes hidden edges, so an invisible relationship stops pulling nodes together', () => {
    const a = testNode('a', 0, 0)
    const b = testNode('b', 100, 0)
    const visibleEdge = testEdge('a-b', 'a', 'b')
    const hiddenEdge = testEdge('a-b-hidden', 'a', 'b', { hidden: true })

    const { graphEdges } = selectGraphTopology([a, b], [visibleEdge, hiddenEdge])

    expect(graphEdges.map(e => e.id)).toEqual(['a-b'])
  })

  it('excludes nodes/edges that are not graph-element/relationship typed', () => {
    const graphNode = testNode('a', 0, 0)
    const otherNode = testNode('b', 0, 0, { type: 'element' })
    const relationshipEdge = testEdge('a-a', 'a', 'a')
    const otherEdge = testEdge('other', 'a', 'a', { type: 'seq-step' })

    const { graphNodes, graphEdges } = selectGraphTopology([graphNode, otherNode], [relationshipEdge, otherEdge])

    expect(graphNodes.map(n => n.id)).toEqual(['a'])
    expect(graphEdges.map(e => e.id)).toEqual(['a-a'])
  })

  it('changes the topology key when a relationship is hidden or revealed, even with the same nodes', () => {
    const a = testNode('a', 0, 0)
    const b = testNode('b', 100, 0)
    const edge = testEdge('a-b', 'a', 'b')
    const hiddenEdge = testEdge('a-b', 'a', 'b', { hidden: true })

    const { topologyKey: withEdge } = selectGraphTopology([a, b], [edge])
    const { topologyKey: withoutEdge } = selectGraphTopology([a, b], [hiddenEdge])

    expect(withEdge).not.toBe(withoutEdge)
  })
})

describe('buildSimGraph', () => {
  it('seeds each simulation node at the center of its graph-element node', () => {
    // position is the circle's top-left corner (center - radius), so home center = position + radius
    const a = testNode('a', 100, 100) as Types.GraphElementNode

    const { nodes } = buildSimGraph([a], [])

    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({ id: 'a', homeX: 110, homeY: 110, x: 110, y: 110 })
  })

  it('keeps a link when both endpoints exist among the given nodes', () => {
    const a = testNode('a', 0, 0) as Types.GraphElementNode
    const b = testNode('b', 100, 100) as Types.GraphElementNode
    const edge = testEdge('a-b', 'a', 'b') as Types.RelationshipEdge

    const { links } = buildSimGraph([a, b], [edge])

    expect(links).toEqual([{ source: 'a', target: 'b' }])
  })

  it('drops links with a dangling endpoint not present in the given nodes', () => {
    // e.g. the other endpoint was hidden by a `where` filter, or belongs to a compound that
    // was flattened away - passing it through would make d3-force's forceLink throw
    const a = testNode('a', 0, 0) as Types.GraphElementNode
    const edgeToMissingNode = testEdge('a-ghost', 'a', 'ghost') as Types.RelationshipEdge

    const { links } = buildSimGraph([a], [edgeToMissingNode])

    expect(links).toEqual([])
  })
})
