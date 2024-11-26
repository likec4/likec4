import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('deployment view: deployment ref', () => {
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
      'customer:prod.eu.zone2',
      'prod.eu.zone1:prod.eu.zone2'
    ])
  })

  it('should include nodes and edges (preserve order)', () => {
    const { nodeIds, edgeIds } = computeView(
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
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.*'),
      $exclude('prod.eu.db')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.media'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone1',
      'customer:prod.eu.zone2',
      'prod.eu.zone1:prod.eu.media',
      'prod.eu.zone1:prod.eu.zone2',
      'prod.eu.zone2:prod.eu.media'
    ])
  })

  it('should include node with nested', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu._')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu',
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.db',
      'prod.eu.media'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone1',
      'customer:prod.eu.zone2',
      'prod.eu.zone1:prod.eu.media',
      'prod.eu.zone1:prod.eu.db',
      'prod.eu.zone1:prod.eu.zone2',
      'prod.eu.zone2:prod.eu.media',
      'prod.eu.zone2:prod.eu.db'
    ])
  })

  it('should not include node._ if view is empty', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu._')
    )
    expect(nodeIds).toEqual([])
    expect(edgeIds).toEqual([])
  })

  it('should include node._ if nested instances', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.zone1._')
    )
    expect(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api'
    ])
  })

  it('should remember implicits from node._', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu._'),
      $include('customer')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu.zone1',
      'prod.eu.zone2'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone2',
      'customer:prod.eu.zone1'
    ])
  })

  it('should include instances only', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.zone1.ui'),
      $include('prod.eu.zone1.api')
    )
    expect(nodeIds).toEqual([
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api'
    ])
  })

  it('should include instances and deployment relation', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.us'),
      $include('prod.eu.db')
    )
    expect(nodeIds).toEqual([
      'prod.eu',
      'prod.eu.db',
      'prod.us'
    ])
    expect(edgeIds).toEqual([
      'prod.eu.db:prod.us'
    ])
  })

  it('should include instance with relative ancestor', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1.ui')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu.zone1', // because of prod.eu.zone2
      'prod.eu.zone1.ui',
      'prod.eu.zone2'
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone2',
      'customer:prod.eu.zone1.ui',
      'prod.eu.zone1.ui:prod.eu.zone2'
    ])
  })

  it('should include instance without ancestor if the only child', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer.instance'),
      $include('prod.eu.zone1')
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'prod.eu.zone1'
    ])
    expect(edgeIds).toEqual([
      'customer.instance:prod.eu.zone1'
    ])
  })

  it.todo('WEIRD ORDER', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1.ui'),
      $include('prod.eu.zone2._')
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod.eu.zone1',
      'prod.eu.zone1.ui',
      'prod.eu.zone2',
      'prod.eu.zone2.ui',
      'prod.eu.zone2.api'
    ])
    // expect(edgeIds).toEqual([
    //   'customer.instance:prod.eu.zone1',
    // ])
  })
})
