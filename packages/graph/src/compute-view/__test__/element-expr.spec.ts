import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('element-expr', () => {
  it('include elements without relations', () => {
    const { nodeIds, edgeIds } = computeView([$include('customer'), $include('support')])
    expect(nodeIds).toEqual(['customer', 'support'])
    expect(edgeIds).toEqual([])
  })

  it('include elements with relations', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud.frontend'),
      $include('support')
    ])
    expect(nodeIds).toEqual(['support', 'customer', 'cloud.frontend'])
    expect(edgeIds).toEqual(['customer:cloud.frontend', 'support:cloud.frontend'])
  })

  it('include elements with descedants', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud.*'),
      $include('support')
    ])
    expect(nodeIds).toEqual(['support', 'customer', 'cloud.frontend', 'cloud.backend'])
    expect(edgeIds).to.have.same.members([
      'cloud.frontend:cloud.backend',
      'customer:cloud.frontend',
      'support:cloud.frontend'
    ])
  })

  it('exclude element ref', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud'),
      $include('cloud.*'),
      $include('support'),
      $exclude('cloud.backend')
    ])
    expect(nodeIds).toEqual(['support', 'customer', 'cloud.frontend', 'cloud'])
    expect(edgeIds).to.have.same.members(['customer:cloud.frontend', 'support:cloud.frontend'])
  })

  describe('view of cloud', () => {
    it('include *', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [$include('*')])
      expect(nodeIds).toEqual([
        'support',
        'customer',
        'cloud.frontend',
        'cloud.backend',
        'cloud',
        'amazon'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'customer:cloud.frontend',
        'support:cloud.frontend'
      ])
    })

    it('include *, exclude support', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [$include('*'), $exclude('support')])
      expect(nodeIds).toEqual(['customer', 'cloud.frontend', 'cloud.backend', 'cloud', 'amazon'])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'customer:cloud.frontend'
      ])
    })

    it('include *, exclude cloud', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('support'),
        $exclude('cloud')
      ])
      expect(nodeIds).toEqual(['customer', 'cloud.frontend', 'cloud.backend', 'amazon'])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'customer:cloud.frontend'
      ])
    })

    it('include *, cloud.frontend.*', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $include('cloud.frontend.*')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend.dashboard',
        'support',
        'cloud.frontend.adminPanel',
        'cloud.frontend',
        'cloud.backend',
        'cloud',
        'amazon'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.backend:amazon',
        'cloud.frontend.adminPanel:cloud.backend',
        'support:cloud.frontend.adminPanel',
        'cloud.frontend.dashboard:cloud.backend',
        'customer:cloud.frontend.dashboard'
      ])
    })
  })

  describe('view of cloud.frontend', () => {
    it('include *', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [$include('*')])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend.dashboard',
        'support',
        'cloud.frontend.adminPanel',
        'cloud.frontend',
        'cloud.backend'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend.adminPanel:cloud.backend',
        'support:cloud.frontend.adminPanel',
        'cloud.frontend.dashboard:cloud.backend',
        'customer:cloud.frontend.dashboard'
      ])
    })
    it('include *, cloud', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [$include('*'), $include('cloud')])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend.dashboard',
        'support',
        'cloud.frontend.adminPanel',
        'cloud.frontend',
        'cloud.backend',
        'cloud'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend.adminPanel:cloud.backend',
        'support:cloud.frontend.adminPanel',
        'cloud.frontend.dashboard:cloud.backend',
        'customer:cloud.frontend.dashboard'
      ])
    })
    it('include *, cloud, exclude support', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [
        $include('*'),
        $include('cloud'),
        $exclude('support')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'cloud.frontend',
        'cloud.backend',
        'cloud'
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend.adminPanel:cloud.backend',
        'cloud.frontend.dashboard:cloud.backend',
        'customer:cloud.frontend.dashboard'
      ])
    })
    it('include *, cloud, exclude cloud.backend', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [
        $include('*'),
        $include('cloud'),
        $exclude('cloud.backend')
      ])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend.dashboard',
        'support',
        'cloud.frontend.adminPanel',
        'cloud.frontend',
        'cloud'
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.adminPanel'
      ])
    })
  })

  describe('view of cloud.backend.graphql', () => {
    it('include *', () => {
      const { nodeIds, edgeIds } = computeView('cloud.backend.graphql', [$include('*')])
      expect(nodeIds).toEqual(['cloud.frontend', 'cloud.backend.graphql', 'cloud.backend.storage'])
      expect(edgeIds).to.have.same.members([
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.frontend:cloud.backend.graphql'
      ])
    })
  })
})
