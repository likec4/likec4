import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView, computeView2 } from './fixture'

describe('cleanCrossBoundaryConnections', () => {
  it('should keep relations inside boundary', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2.*')
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1.ui',
      'prod.eu.zone2.ui',
      'prod.eu.zone1.api',
      'prod.eu.zone2.api'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'prod.eu.zone2.ui:prod.eu.zone2.api'
    ])
  })

  it('should exclude same-targeted relations from outer scope', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2')
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1.ui',
      'prod.eu.zone2',
      'prod.eu.zone1.api'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api'
    ])
  })
})