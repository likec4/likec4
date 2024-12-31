import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

describe('cleanCrossBoundaryConnections', () => {
  it('should keep relations inside boundary', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2.*'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.zone1.ui',
      'prod.eu.zone2.ui',
      'prod.eu.zone1.api',
      'prod.eu.zone2.api',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'prod.eu.zone2.ui:prod.eu.zone2.api',
    ])
  })

  it('should keep relations inside boundary (2)', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('acc.testCustomer'),
      $include('prod._'),
      $include('acc._'),
    )
    expect(nodeIds).toEqual([
      'customer',
      'acc',
      'prod',
      'acc.testCustomer',
      'prod.eu',
      'acc.eu',
      'prod.us',
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu',
      'customer:prod.us',
      'prod.eu:prod.us',
      'acc.testCustomer:acc.eu',
    ])
  })

  it('should keep relations inside boundary and remove redundant edges', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2.*'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.zone1.ui',
      'prod.eu.zone2.ui',
      'prod.eu.zone1.api',
      'prod.eu.zone2.api',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'prod.eu.zone2.ui:prod.eu.zone2.api',
    ])
  })

  it('should exclude same-targeted relations from outer scope', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api',
      'prod.eu.zone2',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
    ])
  })

  it('should remove redundant edges based on deployment relations', () => {
    const { nodeIds, edgeIds, edges } = computeView(
      $include('prod.*'),
      $include('prod.eu.db'),
      $include('prod.us.db'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu',
      'prod.eu.db',
      'prod.us',
      'prod.us.db',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.db:prod.us.db',
    ])
    const [edge] = edges
    expect(edge).toMatchObject({
      label: 'replicates',
      color: 'green',
    })
  })
})
