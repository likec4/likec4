import { describe, expect, it } from 'vitest'
import { $include } from '../../element-view/__test__/fixture'
import { $step, compute } from './fixture'

describe('dynamic-view: include custom element with', () => {
  it('should include custom element', () => {
    const { nodeIds, edgeIds, nodes, edges } = compute([
      $step('customer -> cloud.frontend.dashboard'),
      $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
      $include('cloud.backend', {
        with: {
          title: null as any, // null should be ignored
          technology: 'nodejs',
          navigateTo: 'some-custom-view',
          description: undefined as any // undefined should be ignored
        }
      })
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql',
      'cloud.backend'
    ])
    expect(edgeIds).toEqual([
      'step-01',
      'step-02'
    ])
    expect(nodes).toMatchObject([
      {
        id: 'customer',
        parent: null,
        outEdges: ['step-01'],
        inEdges: []
      },
      {
        id: 'cloud.frontend.dashboard',
        parent: null,
        inEdges: [
          'step-01'
        ],
        outEdges: ['step-02']
      },
      {
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        inEdges: ['step-02'],
        outEdges: []
      },
      {
        id: 'cloud.backend',
        parent: null,
        technology: 'nodejs',
        inEdges: ['step-02'],
        navigateTo: 'some-custom-view',
        outEdges: []
      }
    ])
  })
})
