import { describe, expect, it } from 'vitest'
import type { Fqn, ViewID, ComputedNode, ComputedEdge } from '../../types'
import { sortNodes } from './sortNodes'

type TestComputedNode = {
  id: string,
  parent?: string | null
  children?: string[]
}


describe('sortNodes', () => {


  const testnodes = (nodes: TestComputedNode[], _edges: [source: string, target: string][] = []) => {
    const edges = _edges.map(([source, target]) => ({ source, target } as ComputedEdge))
    return nodes.map(nd => ({
      parent: null,
      children: [],
      ...nd
    }) as ComputedNode).sort(sortNodes(edges)).map(n => n.id as string)
  }

  describe('two nodes inside', () => {

    const nodes = [
      {
        'id': 'customer',
      },
      {
        'id': 'cloud',
        'children': [
          'cloud.backend',
          'cloud.frontend',
        ],
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
      expect(testnodes(nodes)).toEqual([
        'cloud', // <-- cloud is the first because it has children
        'customer',
        'cloud.backend',
        'cloud.frontend',
      ])
    })

    it('should sort nested nodes using edges', () => {
      expect(testnodes(nodes, [
        ['cloud.frontend', 'cloud.backend'],
      ])).toEqual([
        'cloud',
        'customer',
        'cloud.frontend',
        'cloud.backend'
      ])

      expect(testnodes(nodes, [
        ['cloud.backend', 'cloud.frontend'],
      ])).toEqual([
        'cloud',
        'customer',
        'cloud.backend',
        'cloud.frontend',
      ])
    })

    it('should sort nodes using edges', () => {
      expect(testnodes(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
      ])).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend'
      ])
    })

  })

  describe('three nodes inside and two outside', () => {

    const nodes = [
      {
        'id': 'customer',
      },
          {
        'id': 'amazon',
      },
      {
        'id': 'cloud',
        'children': [
          'cloud.backend',
          'cloud.db',
          'cloud.frontend',
        ],
      },
      {
        'id': 'cloud.backend',
        'parent': 'cloud',
      },
      {
        'id': 'cloud.frontend',
        'parent': 'cloud',
      },
      {
        'id': 'cloud.db',
        'parent': 'cloud',
      }
    ] satisfies TestComputedNode[]

    it('should sort hierarchically, if no edges', () => {
      expect(testnodes(nodes)).toEqual([
        'cloud', // <-- cloud is the first because it has children
        'amazon',
        'customer',
        'cloud.backend',
        'cloud.db',
        'cloud.frontend',
      ])
    })

    it('should sort nested nodes using edges', () => {
      expect(testnodes(nodes, [
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
      ])).toEqual([
        'cloud', // <-- cloud is the first because it has children
        'amazon',
        'customer',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db'
      ])
    })

    it('should sort nodes using edges', () => {

      expect(testnodes(nodes, [
        ['customer', 'cloud.frontend'],
        ['cloud.frontend', 'cloud.backend'],
        ['cloud.backend', 'cloud.db'],
        ['cloud.db', 'amazon'],
      ])).toEqual([
        'customer',
        'cloud',
        'amazon',
        'cloud.frontend',
        'cloud.backend',
        'cloud.db'
      ])
    })

  })

  describe('data from test model', () => {

    const nodes = [
      {
        'children': [],
        'id': 'amazon',
        'parent': null,
      },
      {
        'children': [
          'cloud.backend',
          'cloud.frontend.adminPanel',
          'cloud.frontend.dashboard',
        ],
        'id': 'cloud',
        'parent': null,
      },
      {
        'children': [],
        'id': 'customer',
        'parent': null,
      },
      {
        'children': [],
        'id': 'support',
        'parent': null,
      },
      {
        'children': [
          'cloud.backend.graphql',
          'cloud.backend.storage',
        ],
        'id': 'cloud.backend',
        'parent': 'cloud',
      },
      {
        'children': [],
        'id': 'cloud.backend.graphql',
        'parent': 'cloud.backend',
      },
      {
        'children': [],
        'id': 'cloud.backend.storage',
        'parent': 'cloud.backend',
      },
      {
        'children': [],
        'id': 'cloud.frontend.adminPanel',
        'parent': 'cloud',
      },
      {
        'children': [],
        'id': 'cloud.frontend.dashboard',
        'parent': 'cloud'
      },
    ] satisfies TestComputedNode[]

    it('should sort hierarchically, if no edges', () => {
      expect(testnodes(nodes, )).toEqual([
        'cloud', // <-- cloud is the first because it has children
        'amazon',
        'customer',
        'support',
        'cloud.backend',
        'cloud.frontend.adminPanel', // <-- this is the only difference, because it's a child of cloud
        'cloud.frontend.dashboard',
        'cloud.backend.graphql', // <-- it's a child of cloud.backend
        'cloud.backend.storage'
      ])
    })

    it('should sort using in/out edges', () => {
      expect(testnodes(nodes, [
        ['amazon', 'support'],
        ['amazon', 'customer'],
        ['customer', 'support'],
      ])).toEqual([
        'amazon',
        'cloud',
        'customer',
        'support',
        'cloud.backend',
        'cloud.frontend.adminPanel', // <-- this is the only difference, because it's a child of cloud
        'cloud.frontend.dashboard',
        'cloud.backend.graphql', // <-- it's a child of cloud.backend
        'cloud.backend.storage'
      ])
    })


    it('should sort using nested in/out edges', () => {
      expect(testnodes(nodes, [
        ['customer', 'cloud.frontend.dashboard'],
        ['cloud.frontend.dashboard', 'cloud.backend.graphql'],
        ['cloud.backend.graphql', 'cloud.backend.storage'],
        ['cloud.backend.storage', 'amazon'],
        // ['support', 'cloud.frontend.adminPanel'],
      ])).toEqual([
        'customer',
        'cloud',
        'support',
        'amazon',
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'cloud.backend',
        'cloud.backend.graphql',
        'cloud.backend.storage'
      ])
    })
  })
})
