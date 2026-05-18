import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from './__test__/TestHelper'
import { toComputedEdges } from './utils'

const builder = Builder
  .specification({
    elements: {
      el: {},
    },
    deployments: {
      node: {},
    },
  })
  .model(({ el }, _) =>
    _(
      el('client'),
      el('server'),
    )
  )

//
// Deployment model with two deployment relations between the same source and target
//
const depWithMultipleSameDirection = builder.deployment((_, d) =>
  d(
    _.node('aws').with(
      _.instanceOf('client', 'client'),
      _.instanceOf('server', 'server'),
    ),
    _.rel('aws.client', 'aws.server', 'alpha'),
    _.rel('aws.client', 'aws.server', 'beta'),
  )
)

//
// Deployment model with relations in both directions (same label for bidirectional merge)
//
const depWithBothDirections = builder.deployment((_, d) =>
  d(
    _.node('aws').with(
      _.instanceOf('client', 'client'),
      _.instanceOf('server', 'server'),
    ),
    _.rel('aws.client', 'aws.server', 'sync'),
    _.rel('aws.server', 'aws.client', 'sync'),
  )
)

//
// Deployment model with multiple relations → expanded edges avoid bidirectional merge
//
const depWithMultiBothDirections = builder.deployment((_, d) =>
  d(
    _.node('aws').with(
      _.instanceOf('client', 'client'),
      _.instanceOf('server', 'server'),
    ),
    _.rel('aws.client', 'aws.server', 'alpha'),
    _.rel('aws.client', 'aws.server', 'beta'),
    _.rel('aws.server', 'aws.client', 'alpha'),
  )
)

//
// Partial expansion: some relations match predicate, some don't
//
const depForPartialExpansion = builder.deployment((_, d) =>
  d(
    _.node('aws').with(
      _.instanceOf('client', 'client'),
      _.instanceOf('server', 'server'),
    ),
    _.rel('aws.client', 'aws.server', 'alpha'),
    _.rel('aws.client', 'aws.server', 'beta'),
  )
)

const { $include } = TestHelper

describe('toComputedEdges', () => {
  it('no expansion: multiple relations produce single merged edge', () => {
    const t = TestHelper.from(depWithMultipleSameDirection)
    const state = t.processPredicates($include('aws.**'))
    const edges = toComputedEdges(state.memory.connections as any)
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({
      label: '[...]',
      relations: expect.arrayContaining([
        expect.any(String),
        expect.any(String),
      ]),
    })
    expect(edges[0]!.relations).toHaveLength(2)
  })

  it('with expansion: multiple relations produce separate edges', () => {
    const t = TestHelper.from(depWithMultipleSameDirection)
    const state = t.processPredicates($include('aws.**'))
    const edges = toComputedEdges(state.memory.connections as any, () => true)
    expect(edges).toHaveLength(2)
    expect(edges[0]!.id).not.toBe(edges[1]!.id)
    expect(edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
    for (const edge of edges) {
      expect(edge.relations).toHaveLength(1)
    }
  })

  it('expanded edges are excluded from bidirectional merge', () => {
    const t = TestHelper.from(depWithMultiBothDirections)
    const state = t.processPredicates($include('aws.**'))
    // With expansion, alpha+beta from aws.client→aws.server are expanded.
    // aws.server→aws.client has 1 relation → not expanded (needs >1 relations).
    // The expanded edges skip mergeBidirectionalEdges entirely.
    const edges = toComputedEdges(state.memory.connections as any, () => true)
    // 2 expanded (alpha, beta from client→server) + 1 non-expanded (alpha from server→client) = 3
    expect(edges).toHaveLength(3)
    // No edge should have dir: 'both'
    for (const edge of edges) {
      expect(edge.dir).toBeUndefined()
    }
    // Verify expanded edges have correct individual labels
    const expandedLabels = edges
      .filter(e => e.relations.length === 1 && e.source !== 'aws.server')
      .map(e => e.label)
      .sort()
    expect(expandedLabels).toEqual(['alpha', 'beta'])
  })

  it('no expansion: bidirectional merge works', () => {
    const t = TestHelper.from(depWithBothDirections)
    const state = t.processPredicates($include('aws.**'))
    // Without expansion: 2 connections (client→server and server→client), each with 1 relation
    // Both have same label 'sync' → merged into dir: 'both'
    const edges = toComputedEdges(state.memory.connections as any)
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({
      dir: 'both',
      label: 'sync',
    })
  })

  it('expansion partial: predicate controls which relations expand', () => {
    const t = TestHelper.from(depForPartialExpansion)
    const state = t.processPredicates($include('aws.**'))
    const connectionId = state.memory.connections[0]!.id
    // Only expand the 'alpha' relation
    const shouldExpand = (rel: any) => rel.title === 'alpha'
    const edges = toComputedEdges(state.memory.connections as any, shouldExpand)
    // Alpha expands to its own edge, beta remains as a non-expanded (merged) edge
    // Both have 1 relation, but alpha has a computed hash ID while beta uses the connection ID
    expect(edges).toHaveLength(2)
    const alphaEdge = edges.find(e => e.label === 'alpha')!
    const betaEdge = edges.find(e => e.label === 'beta')!
    expect(alphaEdge.relations).toEqual([expect.any(String)])
    expect(alphaEdge.id).not.toBe(connectionId)
    expect(betaEdge.relations).toEqual([expect.any(String)])
    expect(betaEdge.id).toBe(connectionId)
  })

  it('predicate controls expansion per connection', () => {
    const t = TestHelper.from(depWithMultipleSameDirection)
    const state = t.processPredicates($include('aws.**'))
    const edges = toComputedEdges(state.memory.connections as any, () => false)
    expect(edges).toHaveLength(1)
    expect(edges[0]!.relations).toHaveLength(2)
  })
})
