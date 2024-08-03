import { describe, expect, it } from 'vitest'
import { $custom, $include } from '../../compute-view/__test__/fixture'
import { $step, compute } from './fixture'

describe('dynamic-view: include custom element with', () => {
  it('should include custom element', () => {
    const { nodeIds, edgeIds, nodes, edges } = compute([
      $step('customer -> cloud.frontend.dashboard'),
      $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
      $include($custom('cloud.backend', {
        title: null as any, // null should be ignored
        technology: 'nodejs',
        navigateTo: 'some-custom-view',
        description: undefined as any // undefined should be ignored
      }))
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql',
      'cloud.backend'
    ])
    expect(edgeIds).toEqual([
      'step-001',
      'step-002'
    ])
    expect(nodes).toMatchObject([
      {
        id: 'customer',
        parent: null,
        outEdges: ['step-001'],
        inEdges: []
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: null,
        inEdges: [
          'step-001'
        ],
        outEdges: ['step-002']
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        inEdges: ['step-002'],
        outEdges: []
      },
      {
        id: 'cloud.backend',
        parent: null,
        technology: 'nodejs',
        inEdges: ['step-002'],
        navigateTo: 'some-custom-view',
        outEdges: []
      }
    ])
  })
})
