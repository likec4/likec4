import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*')
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'acc',
      'acc.testCustomer',
      'prod',
      'acc.eu',
      'prod.eu',
      'prod.us',
      'global.email'
    ])
    expect(edgeIds).toEqual([
      'prod.eu:prod.us',
      'acc.testCustomer:acc.eu',
      'prod.eu:global.email',
      'prod.us:global.email',
      'acc.eu:global.email',
      'customer.instance:prod.eu',
      'customer.instance:prod.us',
      'global.email:acc.testCustomer',
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
