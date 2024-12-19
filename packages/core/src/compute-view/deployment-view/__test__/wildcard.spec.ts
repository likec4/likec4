import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds, edges } = computeView(
      $include('*'),
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod',
      'prod.eu',
      'prod.us',
      'global',
      'acc',
      'acc.testCustomer',
      'acc.eu',
    ])
    console.dir(edges)
    expect(edgeIds).toEqual([
      'prod.eu:prod.us',
      'acc.testCustomer:acc.eu',
      'customer:prod.eu',
      'customer:prod.us',
      'global:acc.testCustomer',
      'prod.eu:global',
      'prod.us:global',
      'acc.eu:global',
      'global:customer',
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
