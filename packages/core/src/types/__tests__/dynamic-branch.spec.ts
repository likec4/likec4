import { describe, expect, it } from 'vitest'
import type { NonEmptyReadonlyArray } from '../_common'
import {
  type DynamicBranchCollection,
  type DynamicBranchPath,
  type DynamicStep,
  type DynamicStepsParallel,
  isDynamicBranchCollection,
  isDynamicBranchPath,
  isDynamicStep,
  isDynamicStepsParallel,
  toLegacyParallel,
} from '../view-parsed.dynamic'

const makeStep = (source: string, target: string, astPath: string): DynamicStep =>
  ({
    source,
    target,
    astPath,
  }) as DynamicStep

const makeBranch = (head: DynamicStep, ...tail: DynamicStep[]): DynamicBranchCollection =>
  ({
    branchId: '/branch',
    astPath: '/branch',
    kind: 'parallel',
    parallelId: '/branch',
    paths: [
      {
        pathId: '/branch/path@0',
        astPath: '/branch/steps@0',
        steps: [head, ...tail],
        isAnonymous: true,
      },
    ] as unknown as NonEmptyReadonlyArray<DynamicBranchPath>,
    __parallel: [head, ...tail] as NonEmptyReadonlyArray<DynamicStep>,
  }) as DynamicBranchCollection

describe('Dynamic branch helpers', () => {
  it('detects branch collections and legacy parallel', () => {
    const step = makeStep('A', 'B', '/branch/steps@0')
    const branch = makeBranch(step)

    expect(isDynamicBranchCollection(branch)).toBe(true)
    expect(isDynamicStepsParallel(branch)).toBe(true)
    expect(isDynamicBranchPath(branch.paths[0]!)).toBe(true)
    expect(isDynamicStep(step)).toBe(true)

    const legacy = toLegacyParallel(branch)
    expect(legacy).not.toBeNull()
    expect(legacy?.__parallel?.[0]).toEqual(step)
  })

  it('returns null for non-legacy parallel collections', () => {
    const step = makeStep('A', 'B', '/branch/steps@0')
    const branch = makeBranch(step) as DynamicStepsParallel<any> & { __parallel?: NonEmptyReadonlyArray<DynamicStep> }
    delete branch.__parallel

    expect(isDynamicBranchCollection(branch)).toBe(true)
    expect(isDynamicStepsParallel(branch)).toBe(false)
    expect(toLegacyParallel(branch)).toBeNull()
  })

  it('ignores regular steps', () => {
    const step = makeStep('A', 'B', '/s')
    expect(isDynamicBranchCollection(step as unknown as DynamicBranchCollection)).toBe(false)
    expect(isDynamicBranchPath(step as unknown as DynamicBranchPath)).toBe(false)
    expect(toLegacyParallel(step)).toBeNull()
  })
})

describe('Dynamic branch collection structure', () => {
  describe('DynamicBranchPath', () => {
    it('should have required fields', () => {
      const step = makeStep('A', 'B', '/branch/steps@0')
      const path: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/steps@0',
        steps: [step],
        isAnonymous: true,
      }

      expect(isDynamicBranchPath(path)).toBe(true)
      expect(path.pathId).toBe('/branch/path@0')
      expect(path.astPath).toBe('/branch/steps@0')
      expect(path.steps).toHaveLength(1)
      expect(path.isAnonymous).toBe(true)
    })

    it('should support optional fields', () => {
      const step = makeStep('A', 'B', '/branch/steps@0')
      const path: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/steps@0',
        pathName: 'success',
        pathTitle: 'Success Path',
        description: 'Handles success case',
        tags: ['success'],
        steps: [step],
      }

      expect(isDynamicBranchPath(path)).toBe(true)
      expect(path.pathName).toBe('success')
      expect(path.pathTitle).toBe('Success Path')
      expect(path.description).toBe('Handles success case')
      expect(path.tags).toEqual(['success'])
    })

    it('should support multiple steps', () => {
      const step1 = makeStep('A', 'B', '/branch/steps@0')
      const step2 = makeStep('B', 'C', '/branch/steps@1')
      const path: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/steps@0',
        steps: [step1, step2],
      }

      expect(isDynamicBranchPath(path)).toBe(true)
      expect(path.steps).toHaveLength(2)
    })
  })

  describe('DynamicParallelBranch', () => {
    it('should create parallel branch with paths', () => {
      const step1 = makeStep('A', 'B', '/branch/path@0/steps@0')
      const step2 = makeStep('A', 'C', '/branch/path@1/steps@0')
      
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        paths: [
          {
            pathId: '/branch/path@0',
            astPath: '/branch/path@0/steps@0',
            steps: [step1],
          },
          {
            pathId: '/branch/path@1',
            astPath: '/branch/path@1/steps@0',
            steps: [step2],
          },
        ] as NonEmptyReadonlyArray<DynamicBranchPath>,
      }

      expect(isDynamicBranchCollection(branch)).toBe(true)
      expect(branch.kind).toBe('parallel')
      expect(branch.paths).toHaveLength(2)
    })

    it('should support default path', () => {
      const step = makeStep('A', 'B', '/branch/path@0/steps@0')
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        defaultPathId: '/branch/path@0',
        paths: [
          {
            pathId: '/branch/path@0',
            astPath: '/branch/path@0/steps@0',
            steps: [step],
          },
        ] as NonEmptyReadonlyArray<DynamicBranchPath>,
      }

      expect(isDynamicBranchCollection(branch)).toBe(true)
      expect(branch.defaultPathId).toBe('/branch/path@0')
    })

    it('should support label', () => {
      const step = makeStep('A', 'B', '/branch/path@0/steps@0')
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'parallel',
        parallelId: '/branch',
        label: 'Process in parallel',
        paths: [
          {
            pathId: '/branch/path@0',
            astPath: '/branch/path@0/steps@0',
            steps: [step],
          },
        ] as NonEmptyReadonlyArray<DynamicBranchPath>,
      }

      expect(isDynamicBranchCollection(branch)).toBe(true)
      expect(branch.label).toBe('Process in parallel')
    })
  })

  describe('DynamicAlternateBranch', () => {
    it('should create alternate branch with paths', () => {
      const step1 = makeStep('A', 'B', '/branch/path@0/steps@0')
      const step2 = makeStep('A', 'C', '/branch/path@1/steps@0')
      
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'alternate',
        paths: [
          {
            pathId: '/branch/path@0',
            astPath: '/branch/path@0/steps@0',
            pathName: 'success',
            steps: [step1],
          },
          {
            pathId: '/branch/path@1',
            astPath: '/branch/path@1/steps@0',
            pathName: 'error',
            steps: [step2],
          },
        ] as NonEmptyReadonlyArray<DynamicBranchPath>,
      }

      expect(isDynamicBranchCollection(branch)).toBe(true)
      expect(branch.kind).toBe('alternate')
      expect(branch.paths).toHaveLength(2)
      expect(branch.paths[0]?.pathName).toBe('success')
      expect(branch.paths[1]?.pathName).toBe('error')
    })

    it('should not have parallelId or __parallel', () => {
      const step = makeStep('A', 'B', '/branch/path@0/steps@0')
      const branch: DynamicBranchCollection = {
        branchId: '/branch',
        astPath: '/branch',
        kind: 'alternate',
        paths: [
          {
            pathId: '/branch/path@0',
            astPath: '/branch/path@0/steps@0',
            steps: [step],
          },
        ] as NonEmptyReadonlyArray<DynamicBranchPath>,
      }

      expect(isDynamicBranchCollection(branch)).toBe(true)
      expect('parallelId' in branch).toBe(false)
      expect('__parallel' in branch).toBe(false)
    })
  })
})

describe('Type guard functions', () => {
  it('should distinguish between step types', () => {
    const step = makeStep('A', 'B', '/step')
    const branch = makeBranch(step)

    expect(isDynamicStep(step)).toBe(true)
    expect(isDynamicStep(branch)).toBe(false)
    expect(isDynamicBranchCollection(step)).toBe(false)
    expect(isDynamicBranchCollection(branch)).toBe(true)
  })

  it('should handle undefined gracefully', () => {
    expect(isDynamicStep(undefined)).toBe(false)
    expect(isDynamicBranchCollection(undefined)).toBe(false)
    expect(isDynamicBranchPath(undefined)).toBe(false)
    expect(isDynamicStepsParallel(undefined)).toBe(false)
  })

  it('should handle null gracefully', () => {
    expect(isDynamicStep(null as any)).toBe(false)
    expect(isDynamicBranchCollection(null as any)).toBe(false)
    expect(isDynamicBranchPath(null as any)).toBe(false)
  })

  it('should handle invalid objects', () => {
    const invalid = { foo: 'bar' }
    expect(isDynamicStep(invalid as any)).toBe(false)
    expect(isDynamicBranchCollection(invalid as any)).toBe(false)
    expect(isDynamicBranchPath(invalid as any)).toBe(false)
  })
})

describe('toLegacyParallel advanced cases', () => {
  it('should return null for alternate branches', () => {
    const step = makeStep('A', 'B', '/branch/path@0/steps@0')
    const branch: DynamicBranchCollection = {
      branchId: '/branch',
      astPath: '/branch',
      kind: 'alternate',
      paths: [
        {
          pathId: '/branch/path@0',
          astPath: '/branch/path@0/steps@0',
          steps: [step],
        },
      ] as NonEmptyReadonlyArray<DynamicBranchPath>,
    }

    expect(toLegacyParallel(branch)).toBeNull()
  })

  it('should return null for parallel without __parallel array', () => {
    const step = makeStep('A', 'B', '/branch/path@0/steps@0')
    const branch: DynamicBranchCollection = {
      branchId: '/branch',
      astPath: '/branch',
      kind: 'parallel',
      parallelId: '/branch',
      paths: [
        {
          pathId: '/branch/path@0',
          astPath: '/branch/path@0/steps@0',
          steps: [step],
        },
      ] as NonEmptyReadonlyArray<DynamicBranchPath>,
    }

    expect(toLegacyParallel(branch)).toBeNull()
  })

  it('should return legacy format for parallel with empty __parallel', () => {
    const step = makeStep('A', 'B', '/branch/path@0/steps@0')
    const branch: DynamicStepsParallel = {
      branchId: '/branch',
      astPath: '/branch',
      kind: 'parallel',
      parallelId: '/branch',
      paths: [
        {
          pathId: '/branch/path@0',
          astPath: '/branch/path@0/steps@0',
          steps: [step],
        },
      ] as NonEmptyReadonlyArray<DynamicBranchPath>,
      __parallel: [],
    }

    expect(toLegacyParallel(branch)).toBeNull()
  })

  it('should handle complex nested structures', () => {
    const step1 = makeStep('A', 'B', '/step1')
    const step2 = makeStep('B', 'C', '/step2')
    const step3 = makeStep('C', 'D', '/step3')

    const branch = makeBranch(step1, step2, step3)

    const legacy = toLegacyParallel(branch)
    expect(legacy).not.toBeNull()
    expect(legacy?.__parallel).toHaveLength(3)
    expect(legacy?.__parallel?.[0]).toEqual(step1)
    expect(legacy?.__parallel?.[1]).toEqual(step2)
    expect(legacy?.__parallel?.[2]).toEqual(step3)
  })
})

describe('Nested branch structures', () => {
  it('should support nested parallel branches', () => {
    const innerStep = makeStep('B', 'C', '/outer/inner/step')
    const innerBranch = makeBranch(innerStep)
    
    const outerBranch: DynamicBranchCollection = {
      branchId: '/outer',
      astPath: '/outer',
      kind: 'parallel',
      parallelId: '/outer',
      paths: [
        {
          pathId: '/outer/path@0',
          astPath: '/outer/path@0',
          steps: [innerBranch as any],
        },
      ] as NonEmptyReadonlyArray<DynamicBranchPath>,
    }

    expect(isDynamicBranchCollection(outerBranch)).toBe(true)
    expect(isDynamicBranchCollection(outerBranch.paths[0]?.steps[0] as any)).toBe(true)
  })

  it('should support alternate inside parallel', () => {
    const step1 = makeStep('A', 'B', '/step1')
    const step2 = makeStep('A', 'C', '/step2')
    
    const alternate: DynamicBranchCollection = {
      branchId: '/alternate',
      astPath: '/alternate',
      kind: 'alternate',
      paths: [
        {
          pathId: '/alternate/path@0',
          astPath: '/alternate/path@0',
          steps: [step1],
        },
        {
          pathId: '/alternate/path@1',
          astPath: '/alternate/path@1',
          steps: [step2],
        },
      ] as NonEmptyReadonlyArray<DynamicBranchPath>,
    }

    const parallel: DynamicBranchCollection = {
      branchId: '/parallel',
      astPath: '/parallel',
      kind: 'parallel',
      parallelId: '/parallel',
      paths: [
        {
          pathId: '/parallel/path@0',
          astPath: '/parallel/path@0',
          steps: [alternate as any],
        },
      ] as NonEmptyReadonlyArray<DynamicBranchPath>,
    }

    expect(isDynamicBranchCollection(parallel)).toBe(true)
    expect(parallel.paths[0]?.steps[0]).toEqual(alternate)
  })
})