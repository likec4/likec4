import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*'),
    )
    expect(nodeIds).toEqual([
      'dev',
      'dev.devCloud',
      'acc',
      'acc.eu',
      'global',
      'customer',
      'prod',
      'dev.devCustomer',
      'acc.testCustomer',
      'prod.eu',
      'prod.us',
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu',
      'customer:prod.us',
      'global:customer',
      'global:dev.devCustomer',
      'global:acc.testCustomer',
      'prod.eu:global',
      'prod.us:global',
      'dev.devCloud:global',
      'acc.eu:global',
      'prod.eu:prod.us',
      'dev.devCustomer:dev.devCloud',
      'acc.testCustomer:acc.eu',
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
