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
      'global.email',
      'acc',
      'acc.testCustomer',
      'acc.eu'
    ])
    expect(edgeIds).toEqual([
      'prod.eu:prod.us',
      'acc.testCustomer:acc.eu',
      'customer.instance:prod.eu',
      'customer.instance:prod.us',
      'global.email:acc.testCustomer',
      'prod.eu:global.email',
      'prod.us:global.email',
      'acc.eu:global.email',
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
