import { Graph, alg } from '@dagrejs/graphlib'
import { indexBy, pluck, toPairs } from 'rambdax'
import { describe, expect, it } from 'vitest'
import type { ComputedEdge, ComputedNode, Fqn } from '../../types'
import { commonAncestor, parentFqn } from '../../utils'
import { sortNodes } from './sortNodes'

type TestComputedNode = {
  id: string,
  parent?: string | null
  children?: string[]
}


describe('sortNodes', () => {

  it('should do topological sort', () => {
    const g = new Graph({
      compound: true,
      directed: true,
      multigraph: false
    })

    g.setNode('customer')
    g.setNode('cloud')
    g.setNode('cloud.frontend')
    g.setEdge('cloud', 'cloud.frontend')

    g.setNode('cloud.backend')
    g.setEdge('cloud', 'cloud.backend')

    g.setNode('cloud.backend.graphql')
    g.setEdge('cloud.backend', 'cloud.backend.graphql')

    g.setNode('cloud.backend.storage')
    g.setEdge('cloud.backend', 'cloud.backend.storage')


    g.setEdge('cloud.backend.graphql', 'cloud.backend.storage')

    g.setEdge('cloud.frontend', 'cloud.backend.graphql')
    g.setEdge('cloud.frontend', 'cloud.backend')

    g.setEdge('customer', 'cloud.frontend')
    g.setEdge('customer', 'cloud')


    expect(alg.topsort(g)).toEqual([
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage'
    ])
  })


  const testnodes = (_nodes: TestComputedNode[], _edges: [source: string, target: string][] = []) => {
    const nodesreg = indexBy(
      n => n.id,
      _nodes.map(nd => ({
        parent: null,
        children: [],
        ...nd
      }) as ComputedNode)
    )
    const edges = _edges.map(([source, target]) => {
      let parent = commonAncestor(source as Fqn, target as Fqn)
      while (parent) {
        if (parent in nodesreg) {
          break
        }
        parent = parentFqn(parent)
      }
      return {
        parent,
        source,
        target
      } as ComputedEdge
    })
    return sortNodes(new Map(toPairs(nodesreg)), edges)
  }

  const expectSorting = (_nodes: TestComputedNode[], _edges: [source: string, target: string][] = []) =>
    expect(testnodes(_nodes, _edges).map(n => n.id))

  describe('two nodes inside', () => {

    const nodes = [
      {
        'id': 'cloud',
      },
      {
        'id': 'customer',
      },
      {
        'id': 'cloud.backend',
        'parent': 'cloud',
      },
      {
        'id': 'cloud.frontend',
        'parent': 'cloud',
      }
    ] satisfies TestComputedNode[]

    it('should sort hierarchically, if no edges', () => {
      expectSorting(nodes).toEqual([
        'customer',
        'cloud',
        'cloud.backend',
        'cloud.frontend',
      ])
    })

    it('should sort nested nodes using edges', () => {
      expectSorting(nodes, [
        ['cloud.frontend', 'cloud.backend'],
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
      ])
    })

    it('should sort nodes using edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend'
      ])
    })

  })

  describe('three nodes inside', () => {

    const nodes = [
      {
        'id': 'cloud',
      },
      {
        'id': 'customer',
      },
      {
        'id': 'amazon',
      },
      {
        'id': 'cloud.db',
        'parent': 'cloud',
      },
      {
        'id': 'cloud.backend',
        'parent': 'cloud',
      },
      {
        'id': 'cloud.frontend',
        'parent': 'cloud',
      },

    ] satisfies TestComputedNode[]

    it('should sort hierarchically if no edges and source order', () => {
      const sorted = testnodes(nodes)
      expect(pluck('id', sorted)).toEqual([
        'customer', // customer is the first in the list
        'amazon',
        'cloud',
        'cloud.db',
        'cloud.backend',
        'cloud.frontend',
      ])

      const cloud = sorted[2]!
      expect(cloud).toMatchObject({
        id: 'cloud',
        parent: null,
        children: [
          'cloud.db',
          'cloud.backend',
          'cloud.frontend'
        ]
      })
    })

    it('should sort nested nodes using edges', () => {
      const sorted = testnodes(nodes, [
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
      ])
      expect(pluck('id', sorted)).toEqual([
        'customer',
        'amazon',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db'
      ])

      const cloud = sorted[2]!
      expect(cloud).toMatchObject({
        id: 'cloud',
        parent: null,
        children: [
          'cloud.frontend',
          'cloud.backend',
          'cloud.db'
        ]
      })
    })

    it('should sort nodes using edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
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
      expectSorting(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
        ['amazon', 'cloud.backend'],
      ]).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db',
        'amazon',
      ])
    })

  })

  describe('data from test model', () => {

    const nodes = [
      {
        'id': 'amazon',
      },
      {
        'id': 'cloud',
      },
      {
        'id': 'customer',
      },
      {
        'id': 'support',
      },
      {
        'id': 'cloud.backend',
        'parent': 'cloud',
      },
      {
        'id': 'amazon.rds',
        'parent': 'amazon',
      },
      {
        'id': 'cloud.backend.graphql',
        'parent': 'cloud.backend',
      },
      {
        'id': 'cloud.backend.storage',
        'parent': 'cloud.backend',
      },
      {
        'id': 'cloud.frontend.adminPanel',
        'parent': 'cloud',
      },
      {
        'id': 'cloud.frontend.dashboard',
        'parent': 'cloud'
      },
    ] satisfies TestComputedNode[]

    it('should sort hierarchically, if no edges', () => {
      expectSorting(nodes).toEqual([
        'customer',
        'support',
        'amazon',
        'amazon.rds',
        'cloud',
        'cloud.backend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'cloud.frontend.adminPanel',
        'cloud.frontend.dashboard',
      ])
    })

    it('should sort using top level edges', () => {
      expectSorting(nodes, [
        ['amazon', 'support'],
        ['amazon', 'customer'],
        ['customer', 'support'],
      ]).toEqual([
        'amazon',
        'customer',
        'support',
        'amazon.rds',
        'cloud',
        'cloud.backend',
        'cloud.backend.graphql', // <-- it's a child of cloud.backend
        'cloud.backend.storage',
        'cloud.frontend.adminPanel', // <-- this is the only difference, because it's a child of cloud
        'cloud.frontend.dashboard'
      ])
    })

    it('should sort using nested in/out edges', () => {
      expectSorting(nodes, [
        ['customer', 'cloud.frontend.dashboard'],
        ['support', 'cloud.frontend.adminPanel'],
        ['cloud.frontend.dashboard', 'cloud.backend.graphql'],
        ['cloud.frontend.adminPanel', 'cloud.backend.graphql'],
        ['cloud.backend.graphql', 'cloud.backend.storage'],
        ['cloud.backend.storage', 'amazon.rds'],
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
        'amazon.rds',
      ])
    })
  })
})
