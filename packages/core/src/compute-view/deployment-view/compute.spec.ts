import { describe, expect, it } from 'vitest'
import { $exclude, $include, $showAncestors, computeView } from './__test__/fixture'

describe('computeDeploymentView', () => {
  describe('showAncestors feature', () => {
    it('should NOT include ancestors by default (showAncestors: false)', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
      )
      // Without showAncestors, only the zone1.ui element should be included (no ancestors)
      expect(nodeIds).toEqual(['prod.eu.zone1.ui'])
    })

    it('should include ancestors when showAncestors is true', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
        $showAncestors(true),
      )
      // With showAncestors, should include ancestors of prod (which is the root)
      expect(nodeIds).toContain('prod')
      expect(nodeIds).toContain('prod.eu')
      expect(nodeIds).toContain('prod.eu.zone1')
      expect(nodeIds).toContain('prod.eu.zone1.ui')
    })

    it('should include ancestors for multiple elements', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
        $include('prod.us.zone1.ui'),
        $showAncestors(true),
      )
      // Both zones should have their ancestors included
      expect(nodeIds).toContain('prod')
      expect(nodeIds).toContain('prod.eu')
      expect(nodeIds).toContain('prod.eu.zone1')
      expect(nodeIds).toContain('prod.us')
      expect(nodeIds).toContain('prod.us.zone1')
    })

    it('should handle nested ancestors correctly', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.zone1.ui'),
        $showAncestors(true),
      )
      // Should include all levels: prod -> eu -> zone1 -> zone1.ui
      // Note: Ancestors are added after the included element, so order is root-to-leaf
      expect(nodeIds).toEqual([
        'prod',
        'prod.eu',
        'prod.eu.zone1',
        'prod.eu.zone1.ui',
      ])
    })

    it('should work with exclude rules', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.**'),
        $exclude('prod.eu.auth'),
        $showAncestors(true),
      )
      // Should include ancestors even with excludes
      expect(nodeIds).toContain('prod')
      expect(nodeIds).toContain('prod.eu')
      // auth should be excluded
      expect(nodeIds).not.toContain('prod.eu.auth')
    })

    it('should work with wildcard patterns', () => {
      const { nodeIds } = computeView(
        $include('prod.eu.**'),
        $showAncestors(true),
      )
      // Should include all descendants and their ancestors
      expect(nodeIds).toContain('prod')
      expect(nodeIds).toContain('prod.eu')
      expect(nodeIds).toContain('prod.eu.zone1')
      expect(nodeIds).toContain('prod.eu.zone2')
    })
  })
})
