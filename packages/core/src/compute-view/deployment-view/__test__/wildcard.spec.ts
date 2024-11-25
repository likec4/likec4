import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

describe('deployment view: wildcard', () => {
  it('should include root nodes', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*')
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'prod',
      'prod.eu'
    ])
    expect(edgeIds).toEqual([
      'customer.instance:prod.eu'
    ])
  })
})
