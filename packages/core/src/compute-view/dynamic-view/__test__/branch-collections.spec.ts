import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { disableDynamicBranchCollections, enableDynamicBranchCollections } from '../../../config/featureFlags'
import type {
  DynamicBranchCollection,
  DynamicBranchPath,
  DynamicStep,
  DynamicViewStep,
  Fqn,
} from '../../../types'
import { $step, compute } from './fixture'

describe('dynamic-view branch collections', () => {
  beforeEach(() => {
    enableDynamicBranchCollections()
  })

  afterEach(() => {
    disableDynamicBranchCollections()
  })

  describe('parallel branches', () => {
    it('should compute parallel branch with multiple paths', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'success',
            pathTitle: 'Success Path',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
          {
            pathId: '/parallel@0/path@1',
            astPath: '/steps@0/paths@1',
            pathName: 'failure',
            pathTitle: 'Failure Path',
            steps: [$step('customer -> cloud.frontend.dashboard'), $step('cloud.frontend.dashboard -> cloud.backend.graphql')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.branchCollections).toBeDefined()
      expect(view.branchCollections).toHaveLength(1)

      const collection = view.branchCollections![0]
      expect(collection.kind).toBe('parallel')
      expect(collection.paths).toHaveLength(2)
      expect(collection.paths[0].pathName).toBe('success')
      expect(collection.paths[1].pathName).toBe('failure')
    })

    it('should generate correct edge IDs for parallel paths', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
          {
            pathId: '/parallel@0/path@1',
            astPath: '/steps@0/paths@1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.edgeIds).toHaveLength(2)
      expect(view.edgeIds[0]).toMatch(/^step-01\.01\.01$/)
      expect(view.edgeIds[1]).toMatch(/^step-01\.02\.01$/)
    })

    it('should track branch trail in edges', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'pathA',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.edges[0].branchTrail).toBeDefined()
      expect(view.edges[0].branchTrail).toHaveLength(1)
      expect(view.edges[0].branchTrail![0]).toMatchObject({
        branchId: '/parallel@0',
        pathId: '/parallel@0/path@0',
        kind: 'parallel',
        pathIndex: 1,
        indexWithinPath: 1,
        pathName: 'pathA',
      })
    })

    it('should handle multiple steps within a single path', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            steps: [
              $step('customer -> cloud.frontend.dashboard'),
              $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
            ],
            isAnonymous: true,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.edges).toHaveLength(2)
      expect(view.edges[0].branchTrail![0].indexWithinPath).toBe(1)
      expect(view.edges[1].branchTrail![0].indexWithinPath).toBe(2)
    })
  })

  describe('alternate branches', () => {
    it('should compute alternate branch with multiple paths', () => {
      const alternate: DynamicBranchCollection = {
        branchId: '/alternate@0',
        astPath: '/steps@0',
        kind: 'alternate',
        paths: [
          {
            pathId: '/alternate@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'optionA',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
          {
            pathId: '/alternate@0/path@1',
            astPath: '/steps@0/paths@1',
            pathName: 'optionB',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([alternate] as DynamicViewStep[])

      expect(view.branchCollections).toBeDefined()
      expect(view.branchCollections![0].kind).toBe('alternate')
      expect(view.branchCollections![0].paths).toHaveLength(2)
    })

    it('should generate branch trail for alternate paths', () => {
      const alternate: DynamicBranchCollection = {
        branchId: '/alternate@0',
        astPath: '/steps@0',
        kind: 'alternate',
        paths: [
          {
            pathId: '/alternate@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'default',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([alternate] as DynamicViewStep[])

      expect(view.edges[0].branchTrail).toBeDefined()
      expect(view.edges[0].branchTrail![0].kind).toBe('alternate')
    })
  })

  describe('nested branches', () => {
    it('should handle nested parallel within alternate', () => {
      const nestedParallel: DynamicBranchCollection = {
        branchId: '/nested-parallel',
        astPath: '/steps@0/paths@0/steps@0',
        kind: 'parallel',
        parallelId: '/nested-parallel',
        paths: [
          {
            pathId: '/nested-parallel/path@0',
            astPath: '/steps@0/paths@0/steps@0/paths@0',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
        ] as any,
      }

      const alternate: DynamicBranchCollection = {
        branchId: '/alternate@0',
        astPath: '/steps@0',
        kind: 'alternate',
        paths: [
          {
            pathId: '/alternate@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'complex',
            steps: [nestedParallel as any],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([alternate] as DynamicViewStep[])

      expect(view.branchCollections).toHaveLength(2)
      expect(view.edges[0].branchTrail).toHaveLength(2)
      expect(view.edges[0].branchTrail![0].kind).toBe('alternate')
      expect(view.edges[0].branchTrail![1].kind).toBe('parallel')
    })

    it('should track depth in branch trail', () => {
      const innerBranch: DynamicBranchCollection = {
        branchId: '/inner',
        astPath: '/steps@0/paths@0/steps@0',
        kind: 'parallel',
        parallelId: '/inner',
        paths: [
          {
            pathId: '/inner/path@0',
            astPath: '/steps@0/paths@0/steps@0/paths@0',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
        ] as any,
      }

      const outerBranch: DynamicBranchCollection = {
        branchId: '/outer',
        astPath: '/steps@0',
        kind: 'alternate',
        paths: [
          {
            pathId: '/outer/path@0',
            astPath: '/steps@0/paths@0',
            steps: [innerBranch as any],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([outerBranch] as DynamicViewStep[])

      const trail = view.edges[0].branchTrail!
      expect(trail).toHaveLength(2)
      expect(trail[0].branchId).toBe('/outer')
      expect(trail[1].branchId).toBe('/inner')
    })
  })

  describe('default path handling', () => {
    it('should mark default path in branch collection', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        defaultPathId: '/parallel@0/path@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'default',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
          {
            pathId: '/parallel@0/path@1',
            astPath: '/steps@0/paths@1',
            pathName: 'alternate',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.branchCollections![0].defaultPathId).toBe('/parallel@0/path@0')
      expect(view.branchCollections![0].paths[0].isDefaultPath).toBe(true)
      expect(view.branchCollections![0].paths[1].isDefaultPath).toBe(false)
    })
  })

  describe('mixed steps and branches', () => {
    it('should handle steps before and after branches', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@1',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@1/paths@0',
            steps: [$step('cloud.frontend.dashboard -> cloud.backend.graphql')],
            isAnonymous: true,
          },
        ] as any,
      }

      const steps = [
        $step('customer -> cloud.frontend.dashboard'),
        parallel as any,
        $step('cloud.backend.graphql -> cloud.backend.storage'),
      ]

      const view = compute(steps as DynamicViewStep[])

      expect(view.edges).toHaveLength(3)
      expect(view.edgeIds[0]).toBe('step-01')
      expect(view.edgeIds[1]).toMatch(/^step-02\.01\.01$/)
      expect(view.edgeIds[2]).toBe('step-03')
      expect(view.edges[1].branchTrail).toBeDefined()
      expect(view.edges[0].branchTrail).toBeUndefined()
      expect(view.edges[2].branchTrail).toBeUndefined()
    })
  })

  describe('edge ID formatting', () => {
    it('should use dot notation for branch path indices', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
          {
            pathId: '/parallel@0/path@1',
            astPath: '/steps@0/paths@1',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.edgeIds[0]).toBe('step-01.01.01')
      expect(view.edgeIds[1]).toBe('step-01.02.01')
    })

    it('should pad step indices correctly', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            steps: Array.from({ length: 12 }, (_, i) =>
              $step('customer -> cloud.frontend.dashboard')
            ),
            isAnonymous: true,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.edgeIds[0]).toBe('step-01.01.01')
      expect(view.edgeIds[9]).toBe('step-01.01.10')
      expect(view.edgeIds[11]).toBe('step-01.01.12')
    })
  })

  describe('path metadata', () => {
    it('should preserve path titles and descriptions', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'success',
            pathTitle: 'Happy Path',
            description: 'This is the success path',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      const path = view.branchCollections![0].paths[0]
      expect(path.pathTitle).toBe('Happy Path')
      expect(path.description).toBe('This is the success path')
    })

    it('should preserve path tags', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            pathName: 'tagged',
            tags: ['critical', 'production'] as any,
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: false,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      const path = view.branchCollections![0].paths[0]
      expect(path.tags).toEqual(['critical', 'production'])
    })
  })

  describe('branch collection metadata', () => {
    it('should preserve branch label', () => {
      const parallel: DynamicBranchCollection = {
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        parallelId: '/parallel@0',
        label: 'Choose path',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '/steps@0/paths@0',
            steps: [$step('customer -> cloud.frontend.dashboard')],
            isAnonymous: true,
          },
        ] as any,
      }

      const view = compute([parallel] as DynamicViewStep[])

      expect(view.branchCollections![0].label).toBe('Choose path')
    })
  })
})

describe('dynamic-view legacy parallel support', () => {
  afterEach(() => {
    disableDynamicBranchCollections()
  })

  it('should process legacy parallel when feature flag disabled', () => {
    disableDynamicBranchCollections()

    const legacyParallel: DynamicBranchCollection = {
      branchId: '/parallel@0',
      astPath: '/steps@0',
      kind: 'parallel',
      parallelId: '/parallel@0',
      paths: [
        {
          pathId: '/parallel@0/path@0',
          astPath: '/steps@0/paths@0',
          steps: [$step('customer -> cloud.frontend.dashboard')],
          isAnonymous: true,
        },
      ] as any,
      __parallel: [$step('customer -> cloud.frontend.dashboard')] as any,
    }

    const view = compute([legacyParallel] as DynamicViewStep[])

    expect(view.edgeIds).toHaveLength(1)
    expect(view.edgeIds[0]).toMatch(/^step-01\.01$/)
    expect(view.branchCollections).toBeUndefined()
  })

  it('should not include branchCollections when feature disabled', () => {
    disableDynamicBranchCollections()

    const step = $step('customer -> cloud.frontend.dashboard')
    const view = compute([step])

    expect(view.branchCollections).toBeUndefined()
  })
})