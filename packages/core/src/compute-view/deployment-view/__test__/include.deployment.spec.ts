import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

describe('DeploymentRefPredicate', () => {
  it('should include instance and node', () => {
    const { nodeIds, edgeIds } = computeView(
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
    const { nodeIds, edgeIds } = computeView(
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
      'customer:prod.eu.zone2'
    ])
  })

  it('should include nodes and edges (preserve order)', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1'),
      $include('prod')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod',
      'prod.eu.zone2',
      'prod.eu.zone1'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone2',
      'customer:prod.eu.zone1'
    ])
  })

  it('should include children', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.*')
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.media',
      'prod.eu.db'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1:prod.eu.media',
      'prod.eu.zone1:prod.eu.db',
      'prod.eu.zone2:prod.eu.media',
      'prod.eu.zone2:prod.eu.db'
    ])
  })

  it('should include children and ensure sort', () => {
    const { nodeIds, edgeIds } = computeView(
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

  it('should include descendants and ensure sort', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.**')
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.zone1.ui',
      'prod.eu.zone2.ui',
      'prod.eu.zone1.api',
      'prod.eu.zone2.api',
      'prod.eu.media',
      'prod.eu.db'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'prod.eu.zone2.ui:prod.eu.zone2.api',
      'prod.eu.zone1.api:prod.eu.media',
      'prod.eu.zone1.api:prod.eu.db',
      'prod.eu.zone1.ui:prod.eu.media',
      'prod.eu.zone2.api:prod.eu.media',
      'prod.eu.zone2.api:prod.eu.db',
      'prod.eu.zone2.ui:prod.eu.media'
    ])
  })

  it('should expand node 1', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.zone1._')
    )
    expect.soft(nodeIds).toEqual([
      'customer',
      'prod.eu.zone1',
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'customer:prod.eu.zone1.ui'
    ])
  })

  it('should expand node 2', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('*'),
      $include('prod.eu.zone1._')
    )
    expect.soft(nodeIds).toEqual([
      'customer.instance',
      'prod',
      'prod.eu',
      'prod.us',
      'prod.eu.zone1',
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api',
      'global.email'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'prod.eu.zone1.api:global.email',
      'prod.us:global.email',
      'customer.instance:prod.eu.zone1.ui',
      'customer.instance:prod.us',
      'global.email:customer.instance'
    ])
  })

  it('should expand node 3', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu._'),
      $include('prod.eu.zone2._')
    )
    expect.soft(nodeIds).toEqual([
      'customer',
      'prod.eu',
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.zone2.ui',
      'prod.eu.zone2.api',
      'prod.eu.media',
      'prod.eu.db'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone2.ui:prod.eu.zone2.api',
      'prod.eu.zone2.api:prod.eu.media',
      'prod.eu.zone2.api:prod.eu.db',
      'prod.eu.zone2.ui:prod.eu.media',
      'prod.eu.zone1:prod.eu.media',
      'prod.eu.zone1:prod.eu.db',
      'customer:prod.eu.zone2.ui',
      'customer:prod.eu.zone1'
    ])
  })
})
