import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*'),
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'dev',
      'dev.devCustomer',
      'acc',
      'acc.eu',
      'global',
      'customer',
      'prod',
      'acc.testCustomer',
      'prod',
      'dev.devCloud',
      'acc.eu',
      'prod.eu',
      'prod.us',
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu',
      'customer:prod.us',
      'global:customer',
      'global:acc.testCustomer',
      'prod.eu:global',
      'prod.us:global',
      'acc.eu:global',
      'prod.eu:prod.us',
      'dev.devCustomer:dev.devCloud',
      'acc.testCustomer:acc.eu',
      'prod.eu:global.email',
      'prod.us:global.email',
      'dev.devCloud:global.email',
      'acc.eu:global.email',
      'customer.instance:prod.eu',
      'customer.instance:prod.us',
      'global.email:dev.devCustomer',
      'global.email:acc.testCustomer',
      'global.email:customer.instance',
    ])
  })

  it('should exclude all', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*'),
      $include('prod'),
      $exclude('*'),
    )
    expect(nodeIds).toEqual([])
    expect(edgeIds).toEqual([])
  })
})
