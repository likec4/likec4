import { map, prop } from 'remeda'
import type { TupleToUnion } from 'type-fest'
import { describe, expect, it } from 'vitest'
import type { Fqn } from '../../types/element'
import type { ComputedEdge, EdgeId } from '../../types/view'
import { type ComputedNodeSource, buildComputedNodes } from './buildComputedNodes'
import { linkNodesWithEdges } from './link-nodes-with-edges'
import { topologicalSort } from './topological-sort'

function ids<T extends { id: string }>(items: T[]) {
  return map(items, prop('id'))
}

describe('topologicalSort', () => {
  // #region
  function testmodel<const NodeId extends string>(
    nodes: readonly [NodeId, ...NodeId[]],
    edges: Array<`${NoInfer<NodeId>} -> ${NoInfer<NodeId>}`> = [],
  ) {
    const nodesMap = buildComputedNodes(
      nodes.map(id => ({ id, title: id }) as any as ComputedNodeSource),
    )
    const _edges = edges.map(s => {
      const [source, target] = s.split(' -> ') as [Fqn, Fqn]
      return {
        id: `${source} -> ${target}` as EdgeId,
        source,
        target,
        parent: null,
        label: null,
        relations: [],
      } as ComputedEdge
    })
    linkNodesWithEdges(nodesMap, _edges)
    return topologicalSort({
      nodes: nodesMap,
      edges: _edges,
    })
  }

  function expectOrder<const NodeIds extends readonly [string, ...string[]]>(
    nodes: NodeIds,
    edges: Array<`${TupleToUnion<NoInfer<NodeIds>>} -> ${TupleToUnion<NoInfer<NodeIds>>}`> = [],
  ) {
    const sorted = testmodel(nodes, edges)

    return expect({
      nodes: ids(sorted.nodes),
      edges: ids(sorted.edges),
    })
  }

  function expectNodesOrder<const NodeIds extends readonly [string, ...string[]]>(
    nodes: NodeIds,
    edges: Array<`${TupleToUnion<NoInfer<NodeIds>>} -> ${TupleToUnion<NoInfer<NodeIds>>}`> = [],
  ) {
    const sorted = testmodel(nodes, edges)
    return expect(ids(sorted.nodes))
  }
  // #endregion

  describe('two nodes inside', () => {
    const nodes = [
      'cloud',
      'customer',
      'cloud.backend',
      'cloud.frontend',
    ] as const

    it('should keep sorting, if no edges', () => {
      expectNodesOrder(nodes).toEqual(['cloud', 'customer', 'cloud.backend', 'cloud.frontend'])
    })

    it('should sort nested nodes using edges', () => {
      expectNodesOrder(nodes, [
        'cloud.frontend -> cloud.backend',
      ]).toEqual([
        'cloud',
        'customer',
        'cloud.frontend',
        'cloud.backend',
      ])
    })

    it('should sort nodes using edges', () => {
      expectNodesOrder(nodes, [
        'customer -> cloud.frontend',
        'cloud.frontend -> cloud.backend',
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
      ])
    })
  })

  describe('three nodes inside', () => {
    const nodes = [
      'customer',
      'cloud.frontend',
      'cloud.db',
      'cloud',
      'amazon',
      'cloud.backend',
    ] as const

    it('should keep sorting, if no edges', () => {
      const sorted = testmodel(nodes).nodes
      expect(ids(sorted)).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.db',
        'amazon',
        'cloud.backend',
      ])

      const cloud = sorted.find(n => n.id === 'cloud')!
      expect(cloud).toMatchObject({
        id: 'cloud',
        parent: null,
        children: ['cloud.frontend', 'cloud.db', 'cloud.backend'],
      })
    })

    it('should sort nested nodes using edges', () => {
      expectNodesOrder(nodes, [
        'cloud.frontend -> cloud.backend',
        'cloud.backend -> cloud.db',
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'amazon', // initial order
        'cloud.backend',
        'cloud.db',
      ])
    })

    it('should sort nodes using edges', () => {
      expectNodesOrder(nodes, [
        'customer -> cloud.frontend',
        'cloud.frontend -> cloud.backend',
        'cloud.backend -> cloud.db',
        'cloud.db -> amazon',
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
        'amazon',
      ])
    })

    it('should sort nodes using edges and ignore cycles', () => {
      expectOrder(nodes, [
        'cloud.db -> amazon',
        'amazon -> cloud.backend',
        'cloud.frontend -> cloud.backend',
        'cloud.backend -> cloud.db',
      ]).toMatchObject({
        nodes: [
          'customer',
          'cloud',
          'cloud.db',
          'cloud.frontend',
          'amazon',
          'cloud.backend',
        ],
        edges: [
          'cloud.db -> amazon',
          'amazon -> cloud.backend',
          'cloud.frontend -> cloud.backend',
          'cloud.backend -> cloud.db',
        ],
      })
    })

    it('should sort nodes using edges and ignore cycles (2)', () => {
      expectNodesOrder(nodes, [
        'customer -> cloud.frontend',
        'amazon -> customer',
        'cloud.frontend -> cloud.backend',
        'cloud.backend -> cloud.db',
        'cloud.db -> amazon',
      ]).toEqual([
        'amazon',
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
      ])
    })

    it('should sort nodes using edges and ignore cycles (3)', () => {
      expectOrder([
        'customer',
        'cloud.backend.email',
        'cloud.frontend',
        'cloud',
        'cloud.backend.api',
        'amazon.rds',
        'amazon',
        'cloud.backend',
      ], [
        'cloud.backend.email -> customer',
        'customer -> cloud.frontend',
        'amazon -> cloud',
        'cloud.backend.api -> amazon.rds',
        'cloud.frontend -> cloud.backend.api',
        'amazon.rds -> cloud.backend.api',
        'cloud.backend.api -> cloud.backend.email',
      ]).toMatchObject({
        nodes: [
          'cloud',
          'cloud.backend',
          'cloud.backend.email',
          'customer',
          'cloud.frontend',
          'cloud.backend.api',
          'amazon',
          'amazon.rds',
        ],
        edges: [
          'cloud.backend.email -> customer',
          'customer -> cloud.frontend',
          'cloud.backend.api -> amazon.rds',
          'cloud.frontend -> cloud.backend.api',
          'amazon.rds -> cloud.backend.api',
          'cloud.backend.api -> cloud.backend.email',
          'amazon -> cloud',
        ],
      })
    })
  })
})
