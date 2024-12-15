import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeViewV2 as computeView } from './fixture'

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
        'customer',
        'support',
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel'
      ])
      expect(edgeIds).toEqual([
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
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'email',
        'amazon'
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend:cloud.backend',
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.adminPanel',
        'cloud.backend:email',
        'cloud.backend:amazon'
      ])
    })

    it('exclude -> amazon', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('-> email ->'),
        $exclude('-> amazon')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend'
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend:cloud.backend',
        'customer:cloud.frontend',
        'support:cloud.frontend'
      ])
    })

    // exclude outgoing from cloud
    it('exclude cloud ->', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('email ->'),
        $exclude('cloud ->')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend'
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend:cloud.backend',
        'customer:cloud.frontend',
        'support:cloud.frontend'
      ])
    })

    it('exclude -> *', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('-> *')
      ])
      expect(nodeIds).toEqual([
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'email',
        'amazon'
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend:cloud.backend',
        'cloud.backend:email',
        'cloud.backend:amazon'
      ])
    })

    it('exclude -> cloud.frontend.dashboard', () => {
      const { nodeIds, edges, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('email'),
        $exclude('-> cloud.frontend.dashboard')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'amazon'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'support:cloud.frontend',
        'cloud.backend:amazon',
        'customer:cloud'
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
        'support',
        'cloud.frontend',
        'cloud.frontend.adminPanel',
        'cloud.frontend.dashboard',
        'cloud.backend',
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
