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
        'customer',
        'cloud.frontend.dashboard',
        'support',
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
        'cloud.frontend.dashboard',
        'cloud.backend',
        'email',
        'amazon',
        'cloud.frontend.adminPanel'
      ])
      expect(edgeIds).toEqual([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.adminPanel',
        'cloud.backend:amazon',
        'cloud.backend:email',
        'cloud.frontend:cloud.backend'
      ])
    })

    it('exclude -> amazon', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('-> email'),
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
        'customer:cloud.frontend',
        'support:cloud.frontend',
        'cloud.frontend:cloud.backend'
      ])
    })

    // exclude outgoing from cloud
    it.todo('exclude cloud ->', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('cloud ->')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.backend',
        'cloud.frontend'
      ])
      expect(edgeIds).toEqual([
        'customer:cloud.frontend',
        'support:cloud.frontend',
        'cloud.frontend:cloud.backend'
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
        'cloud.backend:amazon',
        'cloud.backend:email'
      ])
    })

    it('exclude -> cloud.frontend.dashboard', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('email'),
        $exclude('-> cloud.frontend.dashboard')
      ])
      expect(nodeIds).toEqual([
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'amazon'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
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
        'support',
        'customer',
        'cloud.frontend',
        'cloud.frontend.adminPanel',
        'cloud.frontend.dashboard',
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
