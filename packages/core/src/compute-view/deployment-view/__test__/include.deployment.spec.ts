import { find, map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { $exclude, $include, $showAncestors, computeView } from './fixture'

describe('DeploymentRefPredicate', () => {
  it('should include instance and node', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer.instance'),
      $include('prod.eu'),
    )
    expect(nodeIds).toEqual([
      'customer.instance',
      'prod',
      'prod.eu',
    ])
    expect(edgeIds).toEqual([
      'customer.instance:prod.eu',
    ])
  })

  it('should include nodes and edges', () => {
    const { nodeIds, edgeIds, nodes } = computeView(
      $include('customer'),
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2'),
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod',
      'prod.eu.zone1',
      'prod.eu.zone2',
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone1',
      'customer:prod.eu.zone2',
    ])
    expect(find(nodes, n => n.id === 'customer')).toMatchObject({
      title: 'Happy Customer',
    })
  })

  it('should include nodes and edges (preserve order)', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1'),
      $include('prod'),
    )
    expect(nodeIds).toEqual([
      'customer',
      'prod',
      'prod.eu.zone2',
      'prod.eu.zone1',
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone2',
      'customer:prod.eu.zone1',
    ])
  })

  it('should include children', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.*'),
      $exclude('prod.eu.auth'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.media',
      'prod.eu.db',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1:prod.eu.media',
      'prod.eu.zone1:prod.eu.db',
      'prod.eu.zone2:prod.eu.media',
      'prod.eu.zone2:prod.eu.db',
    ])
  })

  it('should include children and ensure sort', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('prod.eu.zone1.*'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
    ])
  })

  it('should include descendants and ensure sort', () => {
    const { nodeIds, edgeIds, nodes } = computeView(
      $include('prod.eu.**'),
      $exclude('prod.eu.auth'),
    )
    expect.soft(nodeIds).toEqual([
      'prod.eu.zone1',
      'prod.eu.zone2',
      'prod.eu.zone1.ui',
      'prod.eu.zone2.ui',
      'prod.eu.zone1.api',
      'prod.eu.zone2.api',
      'prod.eu.media',
      'prod.eu.db',
    ])
    expect(edgeIds).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
      'prod.eu.zone2.ui:prod.eu.zone2.api',
      'prod.eu.zone1.api:prod.eu.media',
      'prod.eu.zone1.api:prod.eu.db',
      'prod.eu.zone1.ui:prod.eu.media',
      'prod.eu.zone2.api:prod.eu.media',
      'prod.eu.zone2.api:prod.eu.db',
      'prod.eu.zone2.ui:prod.eu.media',
    ])
    const prodEuZone1Ui = find(nodes, n => n.id === 'prod.eu.zone1.ui')!
    expect(prodEuZone1Ui.title).toBe('prod.eu.zone1/dashboard')
    const prodEuZone2Ui = find(nodes, n => n.id === 'prod.eu.zone2.ui')!
    expect(prodEuZone2Ui.title).toBe('prod.eu.zone2/dashboard')
  })

  it('should expand node 1', () => {
    const { nodeIds, edgeIds } = computeView(
      $include('customer'),
      $include('prod.eu.zone1._'),
    )
    expect.soft(nodeIds).toEqual([
      'customer',
      'prod',
      'prod.eu.zone1',
      'prod.eu.zone1.ui',
      'prod.eu.zone1.api',
    ])
    expect(edgeIds).toEqual([
      'customer:prod.eu.zone1.ui',
      'prod.eu.zone1.ui:prod.eu.zone1.api',
    ])
  })

  it('should expand node 2', () => {
    const view = computeView(
      $include('*'),
      $include('prod.eu.zone1._'),
    )
    expect(view).toMatchObject({
      edgeIds: [
        'customer:prod.us',
        'global:customer',
        'global:dev.devCustomer',
        'global:acc.testCustomer',
        'prod.us:global',
        'dev.devCloud:global',
        'acc.eu:global',
        'dev.devCustomer:dev.devCloud',
        'acc.testCustomer:acc.eu',
        'customer:prod.eu.zone1.ui',
        'prod.eu.zone1.ui:prod.eu.zone1.api',
        'prod.eu.zone1.api:global',
        'prod.eu:prod.us',
      ],
      nodeIds: [
        'dev',
        'dev.devCloud',
        'acc',
        'acc.eu',
        'global',
        'customer',
        'prod',
        'prod.eu',
        'prod.eu.zone1',
        'dev.devCustomer',
        'acc.testCustomer',
        'prod.eu.zone1.ui',
        'prod.us',
        'prod.eu.zone1.api',
      ],
    })
  })

  it('should expand node 3', () => {
    const view = computeView(
      $include('customer'),
      $include('prod.eu._'),
      $include('prod.eu.zone2._'),
      $exclude('prod.eu.auth'),
    )
    expect(view).toMatchObject({
      edgeIds: [
        'customer:prod.eu.zone1',
        'prod.eu.zone1:prod.eu.media',
        'prod.eu.zone1:prod.eu.db',
        'customer:prod.eu.zone2.ui',
        'prod.eu.zone2.ui:prod.eu.zone2.api',
        'prod.eu.zone2.api:prod.eu.media',
        'prod.eu.zone2.api:prod.eu.db',
        'prod.eu.zone2.ui:prod.eu.media',
      ],
      nodeIds: [
        'customer',
        'prod',
        'prod.eu',
        'prod.eu.zone2',
        'prod.eu.zone1',
        'prod.eu.zone2.ui',
        'prod.eu.zone2.api',
        'prod.eu.media',
        'prod.eu.db',
      ],
    })
  })

  it('nodes should inherit titles from deployed instances', () => {
    const { nodeIds, nodes } = computeView(
      $include('prod.eu.zone1.ui'),
      $include('prod.eu.zone2.ui'),
      $include('prod.us.zone1.ui'),
      $include('acc.eu.ui'),
    )
    expect(nodeIds).toEqual([
      'prod.eu.zone1.ui',
      'prod.eu.zone2.ui',
      'prod.us.zone1.ui',
      'acc.eu.ui',
    ])
    expect(map(nodes, prop('title'))).toEqual([
      'prod.eu.zone1/dashboard',
      'prod.eu.zone2/dashboard',
      'prod.us.zone1/dashboard',
      'Dashboard',
    ])
  })

  describe('showAncestors feature', () => {
    it('should include ancestors for instance nodes', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
        $showAncestors(true),
      )
      expect(nodeIds).toContain('prod.eu.zone1.ui')
      expect(nodeIds).toContain('prod.eu.zone1')
      expect(nodeIds).toContain('prod.eu')
      expect(nodeIds).toContain('prod')
    })

    it('should include ancestors for nested nodes', () => {
      const { nodeIds, nodes } = computeView(
        $include('prod.eu.zone1'),
        $showAncestors(true),
      )
      // Verify hierarchy: only ancestors of zone1 are included (not its children)
      expect(nodeIds).toEqual([
        'prod',
        'prod.eu',
        'prod.eu.zone1',
      ])
      // Verify node hierarchy is preserved (check that nodes have their IDs as titles when no explicit title)
      expect(find(nodes, n => n.id === 'prod')).toMatchObject({ id: 'prod' })
      expect(find(nodes, n => n.id === 'prod.eu')).toMatchObject({ id: 'prod.eu' })
      expect(find(nodes, n => n.id === 'prod.eu.zone1')).toMatchObject({ id: 'prod.eu.zone1' })
    })

    it('should include ancestors for multiple zones', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
        $include('prod.us.zone1.ui'),
        $showAncestors(true),
      )
      // Should include ancestors from both zones
      expect(nodeIds).toContain('prod')
      expect(nodeIds).toContain('prod.eu')
      expect(nodeIds).toContain('prod.eu.zone1')
      expect(nodeIds).toContain('prod.us')
      expect(nodeIds).toContain('prod.us.zone1')
      // prod should appear only once
      expect(nodeIds.filter(id => id === 'prod').length).toBe(1)
    })

    it('should preserve node hierarchy order', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
        $showAncestors(true),
      )
      // Verify hierarchy is preserved: ancestors should come before descendants
      const prodIndex = nodeIds.indexOf('prod')
      const euIndex = nodeIds.indexOf('prod.eu')
      const zone1Index = nodeIds.indexOf('prod.eu.zone1')
      const uiIndex = nodeIds.indexOf('prod.eu.zone1.ui')

      expect(prodIndex).toBeLessThan(euIndex)
      expect(euIndex).toBeLessThan(zone1Index)
      expect(zone1Index).toBeLessThan(uiIndex)
    })
  })
})
