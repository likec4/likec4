import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { disableDynamicBranchCollections, enableDynamicBranchCollections } from '../../../config/featureFlags'
import type { DynamicBranchCollection, DynamicBranchPath, DynamicStep } from '../../../types'
import { $step, compute } from './fixture'

describe('dynamic-view with branch collections', () => {
  beforeEach(() => {
    enableDynamicBranchCollections()
  })

  afterEach(() => {
    disableDynamicBranchCollections()
  })

  describe('parallel branch collections', () => {
    it('should compute parallel branches with multiple paths', () => {
      const parallelBranch: DynamicBranchCollection = {
        branchId: '/branch1',
        astPath: '/branch1',
        kind: 'parallel',
        parallelId: '/branch1',
        paths: [
          {
            pathId: '/branch1/path1',
            astPath: '/branch1/path1',
            pathName: 'success',
            pathTitle: 'Success Path',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/branch1/path2',
            astPath: '/branch1/path2',
            pathName: 'failure',
            pathTitle: 'Failure Path',
            steps: [$step('customer -> cloud.frontend.dashboard', { color: 'red' })],
          },
        ] as DynamicBranchPath[],
      }

      const { edges, branchCollections } = compute([parallelBranch])

      expect(edges).toHaveLength(2)
      expect(edges[0]?.id).toBe('step-01.01.01')
      expect(edges[1]?.id).toBe('step-01.02.01')

      expect(branchCollections).toBeDefined()
      expect(branchCollections).toHaveLength(1)
      expect(branchCollections?.[0]?.kind).toBe('parallel')
      expect(branchCollections?.[0]?.paths).toHaveLength(2)
    })

    it('should track branch trail in edges', () => {
      const parallelBranch: DynamicBranchCollection = {
        branchId: '/branch1',
        astPath: '/branch1',
        kind: 'parallel',
        parallelId: '/branch1',
        paths: [
          {
            pathId: '/branch1/path1',
            astPath: '/branch1/path1',
            pathName: 'path1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/branch1/path2',
            astPath: '/branch1/path2',
            pathName: 'path2',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
          },
        ] as DynamicBranchPath[],
      }

      const { edges } = compute([parallelBranch])

      expect(edges[0]?.branchTrail).toBeDefined()
      expect(edges[0]?.branchTrail).toHaveLength(1)
      expect(edges[0]?.branchTrail?.[0]).toMatchObject({
        branchId: '/branch1',
        pathId: '/branch1/path1',
        kind: 'parallel',
        pathIndex: 1,
        indexWithinPath: 1,
        pathName: 'path1',
      })

      expect(edges[1]?.branchTrail).toBeDefined()
      expect(edges[1]?.branchTrail?.[0]).toMatchObject({
        branchId: '/branch1',
        pathId: '/branch1/path2',
        kind: 'parallel',
        pathIndex: 2,
        indexWithinPath: 1,
        pathName: 'path2',
      })
    })

    it('should assign correct edge IDs to branch paths', () => {
      const parallelBranch: DynamicBranchCollection = {
        branchId: '/branch1',
        astPath: '/branch1',
        kind: 'parallel',
        parallelId: '/branch1',
        paths: [
          {
            pathId: '/branch1/path1',
            astPath: '/branch1/path1',
            steps: [
              $step('customer -> cloud.frontend.dashboard'),
              $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
            ],
          },
          {
            pathId: '/branch1/path2',
            astPath: '/branch1/path2',
            steps: [$step('customer -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const { edges, branchCollections } = compute([parallelBranch])

      expect(edges).toHaveLength(3)
      expect(edges[0]?.id).toBe('step-01.01.01')
      expect(edges[1]?.id).toBe('step-01.01.02')
      expect(edges[2]?.id).toBe('step-01.02.01')

      const collection = branchCollections?.[0]
      expect(collection?.paths[0]?.edgeIds).toEqual(['step-01.01.01', 'step-01.01.02'])
      expect(collection?.paths[1]?.edgeIds).toEqual(['step-01.02.01'])
    })

    it('should handle multiple sequential branches', () => {
      const branch1: DynamicBranchCollection = {
        branchId: '/branch1',
        astPath: '/branch1',
        kind: 'parallel',
        parallelId: '/branch1',
        paths: [
          {
            pathId: '/branch1/p1',
            astPath: '/branch1/p1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/branch1/p2',
            astPath: '/branch1/p2',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
          },
        ] as DynamicBranchPath[],
      }

      const branch2: DynamicBranchCollection = {
        branchId: '/branch2',
        astPath: '/branch2',
        kind: 'parallel',
        parallelId: '/branch2',
        paths: [
          {
            pathId: '/branch2/p1',
            astPath: '/branch2/p1',
            steps: [$step('cloud.backend.graphql -> amazon')],
          },
          {
            pathId: '/branch2/p2',
            astPath: '/branch2/p2',
            steps: [$step('cloud.backend -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const { edges, branchCollections } = compute([branch1, branch2])

      expect(edges).toHaveLength(4)
      expect(edges[0]?.id).toBe('step-01.01.01')
      expect(edges[1]?.id).toBe('step-01.02.01')
      expect(edges[2]?.id).toBe('step-02.01.01')
      expect(edges[3]?.id).toBe('step-02.02.01')

      expect(branchCollections).toHaveLength(2)
    })
  })

  describe('alternate branch collections', () => {
    it('should compute alternate branches with multiple paths', () => {
      const alternateBranch: DynamicBranchCollection = {
        branchId: '/branch1',
        astPath: '/branch1',
        kind: 'alternate',
        paths: [
          {
            pathId: '/branch1/success',
            astPath: '/branch1/success',
            pathName: 'success',
            pathTitle: 'Success',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/branch1/failure',
            astPath: '/branch1/failure',
            pathName: 'failure',
            pathTitle: 'Failure',
            steps: [$step('customer -> amazon', { color: 'red' })],
          },
        ] as DynamicBranchPath[],
      }

      const { edges, branchCollections } = compute([alternateBranch])

      expect(edges).toHaveLength(2)
      expect(branchCollections).toBeDefined()
      expect(branchCollections?.[0]?.kind).toBe('alternate')
      expect(branchCollections?.[0]?.paths).toHaveLength(2)
    })

    it('should support default path in alternates', () => {
      const alternateBranch: DynamicBranchCollection = {
        branchId: '/branch1',
        astPath: '/branch1',
        kind: 'alternate',
        defaultPathId: '/branch1/default',
        paths: [
          {
            pathId: '/branch1/default',
            astPath: '/branch1/default',
            pathName: 'default',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/branch1/alt',
            astPath: '/branch1/alt',
            pathName: 'alt',
            steps: [$step('customer -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const { branchCollections } = compute([alternateBranch])

      const collection = branchCollections?.[0]
      expect(collection?.defaultPathId).toBe('/branch1/default')
      expect(collection?.paths[0]?.isDefaultPath).toBe(true)
      expect(collection?.paths[1]?.isDefaultPath).toBe(false)
    })
  })

  describe('nested branch collections', () => {
    it('should handle nested parallel in alternate', () => {
      const nestedParallel: DynamicBranchCollection = {
        branchId: '/nested',
        astPath: '/nested',
        kind: 'parallel',
        parallelId: '/nested',
        paths: [
          {
            pathId: '/nested/p1',
            astPath: '/nested/p1',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
          },
          {
            pathId: '/nested/p2',
            astPath: '/nested/p2',
            steps: [$step('cloud.backend.graphql -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const alternateBranch: DynamicBranchCollection = {
        branchId: '/outer',
        astPath: '/outer',
        kind: 'alternate',
        paths: [
          {
            pathId: '/outer/simple',
            astPath: '/outer/simple',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/outer/complex',
            astPath: '/outer/complex',
            steps: [nestedParallel as any],
          },
        ] as DynamicBranchPath[],
      }

      const { edges, branchCollections } = compute([alternateBranch])

      expect(edges).toHaveLength(3)
      expect(branchCollections).toHaveLength(2) // Both outer and nested collections

      // First edge is from simple path
      expect(edges[0]?.branchTrail).toHaveLength(1)
      expect(edges[0]?.branchTrail?.[0]?.pathId).toBe('/outer/simple')

      // Second and third edges are from nested parallel within alternate
      expect(edges[1]?.branchTrail).toHaveLength(2)
      expect(edges[1]?.branchTrail?.[0]?.pathId).toBe('/outer/complex')
      expect(edges[1]?.branchTrail?.[1]?.pathId).toBe('/nested/p1')

      expect(edges[2]?.branchTrail).toHaveLength(2)
      expect(edges[2]?.branchTrail?.[1]?.pathId).toBe('/nested/p2')
    })

    it('should track nested branch trail correctly', () => {
      const innerBranch: DynamicBranchCollection = {
        branchId: '/inner',
        astPath: '/inner',
        kind: 'parallel',
        parallelId: '/inner',
        paths: [
          {
            pathId: '/inner/p1',
            astPath: '/inner/p1',
            steps: [$step('cloud.backend.graphql -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const outerBranch: DynamicBranchCollection = {
        branchId: '/outer',
        astPath: '/outer',
        kind: 'parallel',
        parallelId: '/outer',
        paths: [
          {
            pathId: '/outer/p1',
            astPath: '/outer/p1',
            steps: [innerBranch as any],
          },
        ] as DynamicBranchPath[],
      }

      const { edges } = compute([outerBranch])

      expect(edges).toHaveLength(1)
      expect(edges[0]?.branchTrail).toHaveLength(2)
      expect(edges[0]?.branchTrail?.[0]).toMatchObject({
        branchId: '/outer',
        pathId: '/outer/p1',
        pathIndex: 1,
        indexWithinPath: 1,
      })
      expect(edges[0]?.branchTrail?.[1]).toMatchObject({
        branchId: '/inner',
        pathId: '/inner/p1',
        pathIndex: 1,
        indexWithinPath: 1,
      })
    })
  })

  describe('mixed steps and branches', () => {
    it('should handle regular steps before branches', () => {
      const step = $step('customer -> cloud.frontend.dashboard')
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        paths: [
          {
            pathId: '/branch/p1',
            astPath: '/branch/p1',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
          },
          {
            pathId: '/branch/p2',
            astPath: '/branch/p2',
            steps: [$step('cloud.frontend.dashboard -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const { edges } = compute([step, branch])

      expect(edges).toHaveLength(3)
      expect(edges[0]?.id).toBe('step-01')
      expect(edges[0]?.branchTrail).toBeUndefined()
      expect(edges[1]?.id).toBe('step-02.01.01')
      expect(edges[1]?.branchTrail).toBeDefined()
      expect(edges[2]?.id).toBe('step-02.02.01')
    })

    it('should handle regular steps after branches', () => {
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        paths: [
          {
            pathId: '/branch/p1',
            astPath: '/branch/p1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
        ] as DynamicBranchPath[],
      }
      const step = $step('cloud.frontend.dashboard -> cloud.backend.graphql')

      const { edges } = compute([branch, step])

      expect(edges).toHaveLength(2)
      expect(edges[0]?.id).toBe('step-01.01.01')
      expect(edges[0]?.branchTrail).toBeDefined()
      expect(edges[1]?.id).toBe('step-02')
      expect(edges[1]?.branchTrail).toBeUndefined()
    })
  })

  describe('legacy compatibility', () => {
    it('should handle legacy parallel format', () => {
      const legacyParallel: DynamicBranchCollection = {
        branchId: '/legacy',
        astPath: '/legacy',
        kind: 'parallel',
        parallelId: '/legacy',
        paths: [
          {
            pathId: '/legacy/p1',
            astPath: '/legacy/p1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
          {
            pathId: '/legacy/p2',
            astPath: '/legacy/p2',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
            isAnonymous: true,
          },
        ] as DynamicBranchPath[],
        __parallel: [
          $step('customer -> cloud.frontend.dashboard'),
          $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
        ] as any,
      }

      const { edges } = compute([legacyParallel])

      expect(edges).toHaveLength(2)
      expect(edges[0]?.id).toBe('step-01.01.01')
      expect(edges[1]?.id).toBe('step-01.02.01')
    })
  })

  describe('feature flag disabled', () => {
    it('should fall back to legacy processing when feature flag is disabled', () => {
      disableDynamicBranchCollections()

      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        paths: [
          {
            pathId: '/branch/p1',
            astPath: '/branch/p1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
        ] as DynamicBranchPath[],
        __parallel: [$step('customer -> cloud.frontend.dashboard')] as any,
      }

      const { edges, branchCollections } = compute([branch])

      expect(edges).toHaveLength(1)
      expect(branchCollections).toBeUndefined()
    })
  })

  describe('path metadata', () => {
    it('should preserve path names and titles', () => {
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        paths: [
          {
            pathId: '/branch/p1',
            astPath: '/branch/p1',
            pathName: 'success',
            pathTitle: 'Happy Path',
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
          {
            pathId: '/branch/p2',
            astPath: '/branch/p2',
            pathName: 'failure',
            pathTitle: 'Error Path',
            steps: [$step('customer -> amazon')],
          },
        ] as DynamicBranchPath[],
      }

      const { branchCollections } = compute([branch])

      expect(branchCollections?.[0]?.paths[0]).toMatchObject({
        pathName: 'success',
        pathTitle: 'Happy Path',
      })
      expect(branchCollections?.[0]?.paths[1]).toMatchObject({
        pathName: 'failure',
        pathTitle: 'Error Path',
      })
    })

    it('should preserve path descriptions and tags', () => {
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'alternate',
        paths: [
          {
            pathId: '/branch/p1',
            astPath: '/branch/p1',
            pathName: 'opt1',
            description: 'First option',
            tags: ['critical'],
            steps: [$step('customer -> cloud.frontend.dashboard')],
          },
        ] as DynamicBranchPath[],
      }

      const { branchCollections } = compute([branch])

      expect(branchCollections?.[0]?.paths[0]).toMatchObject({
        pathName: 'opt1',
        description: 'First option',
        tags: ['critical'],
      })
    })
  })
})