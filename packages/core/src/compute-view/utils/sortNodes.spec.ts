import { describe, expect, it } from 'vitest'
import type { Fqn, ViewID, ComputedNode, ComputedEdge } from '../../types'
import { sortNodes } from './sortNodes'

const nodes: ComputedNode[] = [
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
] as any

describe('sortNodes', () => {

  const testnodes = (_edges: [source: string, target: string][] = []) => {
    const edges = _edges.map(([source, target]) => ({ source, target } as ComputedEdge))
    return [...nodes].sort(sortNodes(edges)).map(n => n.id as string)
  }

  it('should sort hierarchically, if no edges', () => {
    expect(testnodes()).toEqual([
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
    expect(testnodes([
      ['amazon', 'support'],
      ['amazon', 'customer'],
      ['customer', 'support'],
    ])).toEqual([
      'amazon',
      'customer',
      'support',
      'cloud', // <-- cloud is the first because it has children
      'cloud.backend',
      'cloud.frontend.adminPanel', // <-- this is the only difference, because it's a child of cloud
      'cloud.frontend.dashboard',
      'cloud.backend.graphql', // <-- it's a child of cloud.backend
      'cloud.backend.storage'
    ])
  })


    it('should sort using nested in/out edges', () => {
    expect(testnodes([
      ['customer', 'cloud.frontend.dashboard'],
      ['cloud.frontend.dashboard', 'cloud.backend.graphql'],
      ['cloud.backend.graphql', 'cloud.backend.storage'],
      ['cloud.backend.storage', 'amazon'],
      // ['support', 'cloud.frontend.adminPanel'],
    ])).toEqual([
      'cloud',
      'customer',
      'amazon',
      'support',
      'cloud.backend',
      'cloud.frontend.dashboard',
      'cloud.frontend.adminPanel',
      'cloud.backend.graphql',
      'cloud.backend.storage'
    ])
  })
})
