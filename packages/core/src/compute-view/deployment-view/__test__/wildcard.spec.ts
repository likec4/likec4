import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*')
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'prod',
      'prod.eu',
      'prod.us',
      'global.email'
    ])
    expect(edgeIds).toEqual([
      'prod.eu:prod.us',
      'prod.us:prod.eu',
      'prod.eu:global.email',
      'prod.us:global.email',
      'customer.instance:prod.eu',
      'customer.instance:prod.us',
      'global.email:customer.instance'
    ])
  })

  it('should exclude all', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*'),
      $include('prod'),
      $exclude('*')
    )
    expect(nodeIds).toEqual([])
    expect(edgeIds).toEqual([])
  })
})
