import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView, computeView2 } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('*')
    )
    expect(nodeIds).toEqual([
      'global.email',
      'customer.instance',
      'prod',
      'prod.eu',
      'prod.us'
    ])
    expect(edgeIds).toEqual([
      'prod.eu:prod.us',
      'prod.us:prod.eu',
      'customer.instance:prod.eu',
      'customer.instance:prod.us',
      'global.email:customer.instance',
      'prod.eu:global.email',
      'prod.us:global.email'
    ])
  })

  it('should exclude all', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('*'),
      $include('prod'),
      $exclude('*')
    )
    expect(nodeIds).toEqual([])
    expect(edgeIds).toEqual([])
  })
})
