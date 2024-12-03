import { describe, expect, it } from 'vitest'
import { $exclude, $include, $where, computeView } from './fixture'

describe('wildcard-expr', () => {
  it('include *', () => {
    const { nodeIds, edgeIds } = computeView('cloud', [$include('*')])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'email',
      'amazon'
    ])
    expect(edgeIds).to.have.same.members([
      'customer:cloud.frontend',
      'support:cloud.frontend',
      'cloud.frontend:cloud.backend',
      'cloud.backend:amazon',
      'cloud.backend:email'
    ])
  })

  it('include * where tag', () => {
    const { nodeIds, edgeIds } = computeView([
      $include(
        $where('*', {
          or: [
            { tag: { eq: 'aws' } },
            { tag: { neq: 'next' } }
          ]
        })
      )
    ])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'email',
      'amazon'
    ])
    expect(edgeIds).toEqual([])
  })

  it('exclude * where kind', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('*'),
      $exclude($where('*', { kind: { eq: 'actor' } }))
    ])
    expect(nodeIds).toEqual([
      'cloud',
      'email',
      'amazon'
    ])
    expect(edgeIds).toEqual([
      'cloud:amazon',
      'cloud:email',
      'email:cloud'
    ])
  })

  // See compute-view/compute-predicates.ts#L67
  describe('include parent if view root is a leaf and have no siblings', () => {
    // has no siblings
    it('should add amazon for s3', () => {
      const { nodeIds, edgeIds } = computeView('amazon.s3', [$include('*')])
      expect(nodeIds).toEqual(['cloud', 'amazon', 'amazon.s3'])
      expect(edgeIds).to.have.same.members(['cloud:amazon.s3'])
    })

    // has siblings
    it('should not add cloud.backend for cloud.backend.storage', () => {
      const { nodeIds, edgeIds } = computeView('cloud.backend.storage', [$include('*')])
      expect(nodeIds).toEqual(['cloud.backend.graphql', 'cloud.backend.storage', 'amazon'])
      expect(edgeIds).to.have.same.members([
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.backend.storage:amazon'
      ])
    })
  })
})
