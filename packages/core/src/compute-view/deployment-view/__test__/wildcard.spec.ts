import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView, computeView2 } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('*')
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'prod',
      'prod.eu',
      'prod.us'
    ])
    expect(edgeIds).toEqual([
      'customer.instance:prod.eu',
      'prod.eu:prod.us'
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
