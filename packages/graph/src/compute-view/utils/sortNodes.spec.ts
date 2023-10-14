import { pluck } from 'rambdax'
import { describe, expect, it } from 'vitest'
import type { ComputedEdge, ComputedNode } from '@likec4/core'
import { sortNodes } from './sortNodes'

type TestComputedNode = {
  id: string
  parent?: string
}

describe('sortNodes', () => {
  const testnodes = (
    _nodes: TestComputedNode[],
    _edges: [source: string, target: string][] = []
  ) => {
    const nodes = _nodes.map(
      ({ id, parent }) =>
        ({
          id,
          parent: parent ?? null,
          children: []
        }) as unknown as ComputedNode
    )
    const edges = _edges.map(([source, target]) => {
      // let parent = commonAncestor(source as Fqn, target as Fqn)
      // while (parent) {
      //   if (parent in nodesreg) {
      //     break
      //   }
      //   parent = parentFqn(parent)
      // }
      return {
        source,
        target
      } as ComputedEdge
    })
    return sortNodes(nodes, edges) as ComputedNode[]
  }

  const expectSorting = (
    _nodes: TestComputedNode[],
    _edges: [source: string, target: string][] = []
  ) => expect(testnodes(_nodes, _edges).map(n => n.id))

  describe('two nodes inside', () => {
    const nodes = [
      {
        id: 'cloud'
      },
      {
        id: 'customer'
      },
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
        'customer',
        'cloud.frontend',
        'cloud.backend',
        'cloud'
      ])
    })

    it('should sort nodes using edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend']
      ]).toEqual(['customer', 'cloud.frontend', 'cloud.backend', 'cloud'])
    })
  })

  describe('three nodes inside', () => {
    const nodes = [
      {
        id: 'cloud'
      },
      {
        id: 'customer'
      },
      {
        id: 'amazon'
      },
      {
        id: 'cloud.db',
        parent: 'cloud'
      },
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
      const sorted = testnodes(nodes)
      expect(pluck('id', sorted)).toEqual([
        'cloud',
        'customer',
        'amazon',
        'cloud.db',
        'cloud.backend',
        'cloud.frontend'
      ])

      const cloud = sorted[0]!
      expect(cloud).toMatchObject({
        id: 'cloud',
        parent: null,
        children: ['cloud.db', 'cloud.backend', 'cloud.frontend']
      })
    })

    it('should sort nested nodes using edges', () => {
      const sorted = testnodes(nodes, [
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db']
      ])
      expect(pluck('id', sorted)).toEqual([
        'amazon',
        'customer',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
        'cloud'
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
      ]).toEqual(['customer', 'cloud.frontend', 'cloud.backend', 'cloud.db', 'cloud', 'amazon'])
    })

    it('should sort nodes using edges and ignore cycles', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'cloud.backend']
      ]).toEqual(['customer', 'cloud.frontend', 'cloud.backend', 'cloud.db', 'cloud', 'amazon'])
    })

    it('should sort nodes using edges and ignore cycles (2)', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'customer']
      ]).toEqual(['cloud', 'customer', 'amazon', 'cloud.db', 'cloud.backend', 'cloud.frontend'])
    })
  })

  describe('data from test model', () => {
    const nodes = [
      {
        id: 'amazon'
      },
      {
        id: 'cloud'
      },
      {
        id: 'customer'
      },
      {
        id: 'support'
      },
      {
        id: 'cloud.backend',
        parent: 'cloud'
      },
      {
        id: 'amazon.rds',
        parent: 'amazon'
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend'
      },
      {
        id: 'cloud.backend.storage',
        parent: 'cloud.backend'
      },
      {
        id: 'cloud.frontend.adminPanel',
        parent: 'cloud'
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: 'cloud'
      }
    ] satisfies TestComputedNode[]

    it('should keep original sort, if no edges', () => {
      expectSorting(nodes).toEqual([
        'amazon',
        'cloud',
        'customer',
        'support',
        'cloud.backend',
        'amazon.rds',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'cloud.frontend.adminPanel',
        'cloud.frontend.dashboard'
      ])
    })

    it('should sort using top level edges', () => {
      expectSorting(nodes, [
        ['support', 'cloud'],
        ['customer', 'support'],
        ['customer', 'cloud'],
        ['cloud', 'amazon']
      ]).toEqual([
        // they have no edges, besised link to parent
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'cloud.backend.storage',
        'cloud.backend.graphql',
        'cloud.backend',
        'amazon.rds',
        // We test this
        'customer',
        'support',
        'cloud',
        'amazon'
      ])
    })

    it('should sort using nested in/out edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend.dashboard'],
        ['support', 'cloud.frontend.adminPanel'],
        ['cloud.frontend.dashboard', 'cloud.backend.graphql'],
        ['cloud.frontend.adminPanel', 'cloud.backend.graphql'],
        ['cloud.backend.graphql', 'cloud.backend.storage'],
        ['cloud.backend.storage', 'amazon.rds']
      ]).toEqual([
        'support',
        'cloud.frontend.adminPanel',
        'customer',
        'cloud.frontend.dashboard',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'cloud.backend',
        'cloud',
        'amazon.rds',
        'amazon'
      ])
    })
  })
})
