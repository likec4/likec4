import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

describe('wildcard-expr', () => {
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

  // See compute-view/compute-predicates.ts#L67
  describe('include parent if view root is a leaf and have no siblings', () => {
    // has no siblings
    it('should add amazon for s3', () => {
      const { nodeIds, edgeIds } = computeView('amazon.s3', [$include('*')])
      expect(nodeIds).toEqual(['cloud', 'amazon.s3', 'amazon'])
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
