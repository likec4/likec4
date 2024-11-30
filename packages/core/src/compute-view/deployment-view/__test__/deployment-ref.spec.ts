import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView, computeView2 } from './fixture'

describe('DeploymentRefExpression', () => {
  it('should instance and node', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('customer.instance'),
      $include('prod.eu')
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'prod.eu'
    ])
    expect(edgeIds).toEqual([
      'customer.instance:prod.eu'
    ])
  })

  it('should include nodes and edges', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('customer'),
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu.zone1',
      'prod.eu.zone2'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone1',
      'customer:prod.eu.zone2',
      'prod.eu.zone1:prod.eu.zone2'
    ])
  })

  it('should include nodes and edges (preserve order)', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('customer'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu.zone2',
      'prod.eu.zone1'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone2',
      'customer:prod.eu.zone1',
      'prod.eu.zone2:prod.eu.zone1'
    ])
  })

  it('should include children', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('prod.eu.*'),
      $exclude('prod.eu.db')
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.media',
      'prod.eu.db'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1:prod.eu.zone2',
      'prod.eu.zone1:prod.eu.media',
      'prod.eu.zone1:prod.eu.db',
      'prod.eu.zone2:prod.eu.media',
      'prod.eu.zone2:prod.eu.db'
    ])
  })

  it('should include children and ensure sort', () => {
    const { nodeIds, edgeIds } = computeView2(
      $include('prod.eu.zone1.*')
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api'
    ])
  })
})
