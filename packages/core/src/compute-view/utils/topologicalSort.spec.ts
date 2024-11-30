import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { Fqn } from '../../types/element'
import type { ComputedEdge, ComputedNode } from '../../types/view'
import { ancestorsFqn, commonAncestor } from '../../utils/fqn'
import { sortNodes } from './sortNodes'
import { topologicalSort } from './topologicalSort'

export type TestComputedNode = {
  id: string
  parent?: string
}

describe('topologicalSort', () => {
  const testnodes = (
    _nodes: TestComputedNode[],
    _edges: [source: string, target: string][] = []
  ) => {
    const nodes = _nodes.map(
      ({ id, parent }) =>
        ({
          id,
          parent: parent ?? null,
          children: _nodes.flatMap(n => (n.parent === id ? n.id : [])),
          inEdges: [],
          outEdges: []
        }) as unknown as ComputedNode
    )
    const edges = _edges.map(([source, target]) => {
      const parentId = commonAncestor(source as Fqn, target as Fqn)
      const edge = {
        id: `${source}:${target}`,
        source,
        target,
        parent: parentId
      } as ComputedEdge

      const sources = [source, ...ancestorsFqn(source as Fqn)]
      while (sources.length > 0) {
        const fqn = sources.shift()
        if (!fqn || fqn === parentId) {
          break
        }
        const node = nodes.find(n => n.id === fqn)
        if (node) {
          node.outEdges.push(edge.id)
        }
      }
      const targets = [target, ...ancestorsFqn(target as Fqn)]
      while (targets.length > 0) {
        const fqn = targets.shift()
        if (!fqn || fqn === parentId) {
          break
        }
        const node = nodes.find(n => n.id === fqn)
        if (node) {
          node.inEdges.push(edge.id)
        }
      }

      return edge
    })
    return { nodes, edges }
  }

  const expectSorting = (
    _nodes: TestComputedNode[],
    _edges: [source: string, target: string][] = []
  ) => expect(topologicalSort(testnodes(_nodes, _edges)).map(n => n.id))

  describe('two nodes inside', () => {
    const nodes = [
      { id: 'cloud' },
      { id: 'customer' },
      {
        id: 'cloud.backend',
        parent: 'cloud'
      },
      {
        id: 'cloud.frontend',
        parent: 'cloud'
      }
    ] satisfies TestComputedNode[]

    it('should keep sorting, if no edges', () => {
      expectSorting(nodes).toEqual(['cloud', 'customer', 'cloud.backend', 'cloud.frontend'])
    })

    it('should sort nested nodes using edges', () => {
      expectSorting(nodes, [['cloud.frontend', 'cloud.backend']]).toEqual([
        'cloud',
        'customer',
        'cloud.frontend',
        'cloud.backend'
      ])
    })

    it('should sort nodes using edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend']
      ]).toEqual(['customer', 'cloud', 'cloud.frontend', 'cloud.backend'])
    })
  })

  describe('three nodes inside', () => {
    const nodes = [
      {
        id: 'customer'
      },
      {
        id: 'amazon'
      },
      {
        id: 'cloud.frontend',
        parent: 'cloud'
      },
      {
        id: 'cloud'
      },
      {
        id: 'cloud.db',
        parent: 'cloud'
      },
      {
        id: 'cloud.backend',
        parent: 'cloud'
      }
    ] satisfies TestComputedNode[]

    it('should keep sorting, if no edges', () => {
      const sorted = sortNodes(testnodes(nodes))
      expect(map(sorted, prop('id'))).toEqual([
        'customer',
        'amazon',
        'cloud',
        'cloud.frontend',
        'cloud.db',
        'cloud.backend'
      ])

      const cloud = sorted.find(n => n.id === 'cloud')!
      expect(cloud).toMatchObject({
        id: 'cloud',
        parent: null,
        children: ['cloud.frontend', 'cloud.db', 'cloud.backend']
      })
    })

    it('should sort nested nodes using edges', () => {
      const sorted = sortNodes(
        testnodes(nodes, [
          ['cloud.frontend', 'cloud.backend'],
          ['cloud.backend', 'cloud.db']
        ])
      )
      expect(map(sorted, prop('id'))).toEqual([
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
        'amazon',
        'customer'
      ])

      const cloud = sorted.find(n => n.id === 'cloud')!
      expect(cloud).toMatchObject({
        id: 'cloud',
        parent: null,
        children: ['cloud.frontend', 'cloud.backend', 'cloud.db']
      })
    })

    it('should sort nodes using edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon']
      ]).toEqual(['customer', 'cloud', 'cloud.frontend', 'cloud.backend', 'cloud.db', 'amazon'])
    })

    it('should sort nodes using edges and ignore cycles', () => {
      expectSorting(nodes, [
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'cloud.backend']
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
        'amazon'
      ])
    })

    it('should sort nodes using edges and ignore cycles (2)', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'customer']
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
        'amazon'
      ])
    })
  })
})
