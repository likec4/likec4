import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('inout-expr', () => {
  describe('view of cloud.backend', () => {
    // Because we have cloud.frontend, customer will be included
    it('include -> customer ->', () => {
      const { nodeIds } = computeView('cloud.backend', [$include('*'), $include('-> customer ->')])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'cloud.backend',
        'amazon'
      ])
    })

    // Because we excluded cloud.frontend
    it('ignore -> customer ->', () => {
      const { nodeIds } = computeView('cloud.backend', [
        $include('*'),
        $exclude('cloud.frontend'),
        $include('-> customer ->')
      ])
      expect(nodeIds).toEqual([
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'cloud.backend',
        'amazon'
      ])
    })
  })
})
