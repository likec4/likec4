import {
  ancestorsFqn,
  commonAncestor,
  compareRelations,
  type ComputedEdge,
  type ComputedNode,
  type Fqn
} from '@likec4/core'
import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { sortNodes } from './sortNodes'

export type TestComputedNode = {
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
    edges.sort(compareRelations).reverse()
    return { nodes, edges }
  }

  it('should generate valid testnodes', () => {
    expect(
      testnodes(
        [
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
            id: 'cloud.frontend.ui',
            parent: 'cloud.frontend'
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
        ],
        [
          ['customer', 'cloud.frontend.ui'],
          ['cloud.frontend.ui', 'cloud.backend'],
          ['cloud.backend', 'cloud.db'],
          ['cloud.db', 'amazon']
        ]
      )
    ).toMatchSnapshot()
  })

  const expectSorting = (
    _nodes: TestComputedNode[],
    _edges: [source: string, target: string][] = []
  ) => expect(sortNodes(testnodes(_nodes, _edges)).map(n => n.id))

  describe('two nodes inside', () => {
    const nodes = [
      {
        id: 'cloud.backend',
        parent: 'cloud'
      },
      {
        id: 'cloud'
      },
      {
        id: 'customer'
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
        'cloud',
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
        // ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'cloud.backend']
      ]).toEqual(['customer', 'amazon', 'cloud', 'cloud.frontend', 'cloud.db', 'cloud.backend'])
    })

    it('should sort nodes using edges and ignore cycles (2)', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'customer']
      ]).toEqual(['customer', 'cloud', 'cloud.frontend', 'cloud.backend', 'cloud.db', 'amazon'])
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
        // We test this
        'customer',
        'support',
        'cloud',
        // they have no edges, besides link to parent
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'cloud.backend',
        'cloud.backend.storage',
        'cloud.backend.graphql',
        'amazon',
        'amazon.rds'
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
        'customer',
        'support',
        'cloud',
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'cloud.backend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'amazon',
        'amazon.rds'
      ])
    })
  })
})
