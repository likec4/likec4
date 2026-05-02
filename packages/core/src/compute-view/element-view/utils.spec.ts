import { describe, expect, it, test } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from './__test__/TestHelper'
import { toComputedEdges } from './utils'

const builder = Builder
  .specification({
    elements: {
      el: {},
    },
  })
  .model(({ el }, m) =>
    m(
      el('sys1'),
      el('sys2'),
      el('sys2.el1'),
    )
  )

describe('toComputedEdges', () => {
  test('pick label from exact relation (if single)', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2.el1', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const [edge] = toComputedEdges(state.memory.connections)
    expect(edge).toMatchObject({
      'relations': [
        'rel1',
        'rel2',
      ],
      'label': 'alpha',
    })
  })

  test('dont pick label from exact relations (if multiple)', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const [edge] = toComputedEdges(state.memory.connections)
    expect(edge).toMatchObject({
      'relations': [
        'rel1',
        'rel2',
      ],
      'label': '[...]',
    })
  })

  test('no expansion: multiple direct relations produce single merged edge', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
        rel('sys1', 'sys2', 'gamma'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const edges = toComputedEdges(state.memory.connections)
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({
      label: '[...]',
      relations: expect.arrayContaining(['rel1', 'rel2', 'rel3']),
    })
  })

  test('with expansion: multiple direct relations produce separate edges', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const edges = toComputedEdges(state.memory.connections, () => true)
    expect(edges).toHaveLength(2)
    expect(edges[0]!.id).not.toBe(edges[1]!.id)
    expect(edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
  })

  test('with expansion: implicit relations are expanded individually', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2.el1', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const edges = toComputedEdges(state.memory.connections, () => true)
    expect(edges).toHaveLength(2)
    expect(edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
  })

  test('with expansion: all matching relations produce separate edges', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
        rel('sys1', 'sys2.el1', 'gamma'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const edges = toComputedEdges(state.memory.connections, () => true)
    expect(edges).toHaveLength(3)
    expect(edges.map(e => e.label).sort()).toEqual(['alpha', 'beta', 'gamma'])
    for (const edge of edges) {
      expect(edge.relations).toHaveLength(1)
    }
  })

  it('expanded edge IDs are stable hashes', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const edges1 = toComputedEdges(state.memory.connections, () => true)
    const edges2 = toComputedEdges(state.memory.connections, () => true)
    expect(edges1).toHaveLength(2)
    expect(edges1.map(e => e.id)).toEqual(edges2.map(e => e.id))
  })

  test('predicate controls expansion per connection', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const edges = toComputedEdges(state.memory.connections, () => false)
    expect(edges).toHaveLength(1)
  })

  test('expansion with where metadata predicate produces partial expansion', () => {
    const b = Builder
      .specification({
        elements: { el: {} },
        metadataKeys: ['protocol'],
      })
      .model(({ el }, m) =>
        m(
          el('sys1'),
          el('sys2'),
        )
      )

    const t = TestHelper.from(b.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', { title: 'alpha', metadata: { protocol: 'http' } }),
        rel('sys1', 'sys2', { title: 'beta', metadata: { protocol: 'http' } }),
        rel('sys1', 'sys2', { title: 'gamma', metadata: { protocol: 'grpc' } }),
        rel('sys1', 'sys2', { title: 'delta', metadata: { protocol: 'grpc' } }),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const conn = state.memory.connections[0]!
    const edges = toComputedEdges(
      state.memory.connections,
      (rel) => rel.metadata?.protocol === 'http',
    )
    // 2 expanded (http) + 1 merged (grpc) = 3 edges
    expect(edges).toHaveLength(3)
    const expanded = edges.filter(e => e.relations.length === 1)
    const merged = edges.filter(e => e.relations.length === 2)
    // Both http relations produce their own expanded edge
    expect(expanded).toHaveLength(2)
    expect(expanded.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
    // The two grpc relations produce a merged edge
    expect(merged).toHaveLength(1)
    expect(merged[0]!.id).toBe(conn.id)
    expect(merged[0]!.label).toBe('[...]')
  })
})
