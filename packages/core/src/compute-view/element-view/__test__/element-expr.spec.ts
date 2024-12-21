import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('element-expr', () => {
  it('include elements without relations', () => {
    const { nodeIds, edgeIds } = computeView([$include('customer'), $include('support')])
    expect(nodeIds).toEqual(['customer', 'support'])
    expect(edgeIds).toEqual([])
  })

  it('include elements with relations', () => {
    const { nodes, nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud.frontend'),
      $include('support'),
      $exclude('cloud'),
    ])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud.frontend',
    ])
    expect(edgeIds).toEqual(['customer:cloud.frontend', 'support:cloud.frontend'])

    for (const node of nodes) {
      expect(node).not.toHaveProperty('depth')
      expect(node).toHaveProperty('level', 0)
    }
  })

  it('include elements with descedants', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud.*'),
      $include('support'),
    ])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
    ])
    expect(edgeIds).toEqual([
      'cloud.frontend:cloud.backend',
      'customer:cloud.frontend',
      'support:cloud.frontend',
    ])
  })

  it('exclude element ref', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud'),
      $include('cloud.*'),
      $include('support'),
      $exclude('cloud.backend'),
    ])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
    ])
    expect(edgeIds).toEqual([
      'customer:cloud.frontend',
      'support:cloud.frontend',
    ])
  })

  describe('view of cloud', () => {
    it('include *', () => {
      const { nodes, nodeIds, edgeIds } = computeView('cloud', [$include('*')])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'email',
        'amazon',
      ])
      for (const node of nodes) {
        // cloud has depth 1 (the only node with depth)
        if (node.id === 'cloud') {
          expect(node).toHaveProperty('depth', 1)
        } else {
          expect(node).not.toHaveProperty('depth')
        }
        // nested nodes have level 1
        if (node.id.startsWith('cloud.')) {
          expect(node).toHaveProperty('level', 1)
        } else {
          expect(node).toHaveProperty('level', 0)
        }
      }
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'customer:cloud.frontend',
        'support:cloud.frontend',
        'cloud.backend:email',
        'cloud.backend:amazon',
      ])
    })

    it('include *, exclude support', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [$include('*'), $exclude('support')])
      expect(nodeIds).toEqual([
        'customer',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'email',
        'amazon',
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend',
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'cloud.backend:email',
      ])
    })

    it('include *, exclude cloud', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('support'),
        $exclude('cloud'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend',
        'cloud.backend',
        'email',
        'amazon',
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend',
        'cloud.frontend:cloud.backend',
        'cloud.backend:amazon',
        'cloud.backend:email',
      ])
    })

    it('include *, cloud.frontend.*', () => {
      const { nodes, nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $include('cloud.frontend.*'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
        'email',
        'amazon',
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend.dashboard:cloud.backend',
        'cloud.frontend.supportPanel:cloud.backend',
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
        'cloud.backend:email',
        'cloud.backend:amazon',
      ])

      // check depth
      const frontend = nodes.find(n => n.id === 'cloud.frontend')!
      expect(frontend).toHaveProperty('depth', 1)
      const cloud = nodes.find(n => n.id === 'cloud')!
      expect(cloud).toHaveProperty('depth', 2)
    })

    it('include *, exclude backend', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $include('cloud.backend.*'),
        $exclude('cloud.backend'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'amazon',
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend.graphql',
        'cloud.backend.graphql:cloud.backend.storage',
        'customer:cloud.frontend',
        'support:cloud.frontend',
        'cloud.backend.storage:amazon',
      ])
    })
  })

  describe('view of cloud.frontend', () => {
    it('include *', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [$include('*')])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend.dashboard:cloud.backend',
        'cloud.frontend.supportPanel:cloud.backend',
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
      ])
    })
    it('include *, cloud', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [$include('*'), $include('cloud')])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
        'cloud.frontend.supportPanel:cloud.backend',
        'cloud.frontend.dashboard:cloud.backend',
      ])
    })
    it('include *, exclude support', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [
        $include('*'),
        $exclude('support'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend.dashboard:cloud.backend',
        'cloud.frontend.supportPanel:cloud.backend',
        'customer:cloud.frontend.dashboard',
      ])
    })
    it('include *, cloud, exclude cloud.backend', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [
        $include('*'),
        $include('cloud'),
        $exclude('cloud.backend'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
      ])
    })
  })

  describe('view of cloud.backend', () => {
    it('include *', () => {
      const view = computeView('cloud.backend', [$include('*')])
      expect(view).toMatchObject({
        nodeIds: [
          'cloud.frontend',
          'cloud.backend',
          'cloud.backend.graphql',
          'cloud.backend.storage',
          'amazon',
        ],
        edgeIds: [
          'cloud.backend.graphql:cloud.backend.storage',
          'cloud.backend.storage:amazon',
          'cloud.frontend:cloud.backend.graphql',
        ],
      })
    })
    it('include *, cloud.frontend.* -> cloud.backend', () => {
      const { nodeIds, edgeIds } = computeView('cloud.backend', [
        $include('*'),
        $include('cloud.frontend.* -> cloud.backend'),
      ])
      expect(nodeIds).toEqual([
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'amazon',
      ])
      expect(edgeIds).toEqual([
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.backend.storage:amazon',
        'cloud.frontend.dashboard:cloud.backend.graphql',
        'cloud.frontend.supportPanel:cloud.backend.graphql',
      ])
    })
    it('include *, cloud.frontend, cloud.frontend.* -> cloud.backend', () => {
      const { nodeIds, edgeIds } = computeView('cloud.backend', [
        $include('*'),
        $include('cloud.frontend'),
        $include('cloud.frontend.* -> cloud.backend'),
      ])
      expect(nodeIds).toEqual([
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'amazon',
      ])
      expect(edgeIds).toEqual([
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.backend.storage:amazon',
        'cloud.frontend.dashboard:cloud.backend.graphql',
        'cloud.frontend.supportPanel:cloud.backend.graphql',
      ])
    })
    it('include *, cloud', () => {
      const view = computeView('cloud.backend', [
        $include('*'),
        $include('cloud'),
      ])
      expect(view).toMatchObject({
        nodeIds: [
          'cloud',
          'cloud.frontend',
          'cloud.backend',
          'cloud.backend.graphql',
          'cloud.backend.storage',
          'amazon',
        ],
        edgeIds: [
          'cloud.backend.graphql:cloud.backend.storage',
          'cloud.frontend:cloud.backend.graphql',
          'cloud.backend.storage:amazon',
        ],
      })
    })
  })

  describe('view of cloud.backend.graphql', () => {
    it('include *', () => {
      const { nodeIds, edgeIds } = computeView('cloud.backend.graphql', [$include('*')])
      expect(nodeIds).toEqual(['cloud.frontend', 'cloud.backend.graphql', 'cloud.backend.storage'])
      expect(edgeIds).to.have.same.members([
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.frontend:cloud.backend.graphql',
      ])
    })

    it('include *, amazon', () => {
      const { nodeIds, edgeIds } = computeView('cloud.backend.graphql', [
        $include('*'),
        $include('amazon'),
      ])
      expect(nodeIds).toEqual([
        'cloud.frontend',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'amazon',
      ])
      expect(edgeIds).toEqual([
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.backend.storage:amazon',
        'cloud.frontend:cloud.backend.graphql',
      ])
    })
  })
})
