import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('incoming-expr', () => {
  describe('top level', () => {
    it('include -> amazon.*', () => {
      const { nodeIds, edgeIds } = computeView([$include('-> amazon.*')])
      expect(nodeIds).toEqual(['cloud', 'amazon.s3'])
      expect(edgeIds).to.have.same.members(['cloud:amazon.s3'])
    })

    it('include -> cloud.frontend.*', () => {
      const { nodeIds, edgeIds } = computeView([$include('-> cloud.frontend.*')])
      expect(nodeIds).toEqual([
        'support',
        'cloud.frontend.adminPanel',
        'customer',
        'cloud.frontend.dashboard'
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.adminPanel'
      ])
    })
  })

  describe('view of cloud', () => {
    it('include -> cloud.frontend.*', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $include('-> cloud.frontend.*')
      ])
      expect(nodeIds).toEqual([
        'support',
        'cloud.frontend.adminPanel',
        'customer',
        'cloud.frontend.dashboard',
        'cloud.frontend',
        'cloud.backend',
        'cloud',
        'amazon'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.adminPanel'
      ])
    })

    it('exclude -> amazon', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [$include('*'), $exclude('-> amazon')])
      expect(nodeIds).toEqual(['support', 'customer', 'cloud.frontend', 'cloud.backend', 'cloud'])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'customer:cloud.frontend',
        'support:cloud.frontend'
      ])
    })

    it('exclude -> *', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [$include('*'), $exclude('-> *')])
      expect(nodeIds).toEqual(['cloud.frontend', 'cloud.backend', 'cloud', 'amazon'])
      expect(edgeIds).to.have.same.members(['cloud.frontend:cloud.backend', 'cloud.backend:amazon'])
    })

    it('exclude -> cloud.frontend.dashboard', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('-> cloud.frontend.dashboard')
      ])
      expect(nodeIds).toEqual(['support', 'cloud.frontend', 'cloud.backend', 'cloud', 'amazon'])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'support:cloud.frontend'
      ])
    })

    it('exclude -> amazon', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [$include('*'), $exclude('-> amazon')])
      expect(nodeIds).toEqual(['support', 'customer', 'cloud.frontend', 'cloud.backend', 'cloud'])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'customer:cloud.frontend',
        'support:cloud.frontend'
      ])
    })
  })

  describe('view of cloud.frontend', () => {
    it('include -> cloud.backend.*', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [
        $include('*'),
        $include('-> cloud.backend.*')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend.dashboard',
        'support',
        'cloud.frontend.adminPanel',
        'cloud.frontend',
        // 'cloud.backend', // implicit is removed, due to `-> cloud.backend.*`
        'cloud.backend.graphql'
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.adminPanel',
        'cloud.frontend.adminPanel:cloud.backend.graphql',
        'cloud.frontend.dashboard:cloud.backend.graphql'
      ])
    })
  })
})
