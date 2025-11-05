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

describe('Dynamic branch collection type guards', () => {
  const makeStep = (source: string, target: string, astPath: string): DynamicStep =>
    ({
      source,
      target,
      astPath,
    }) as DynamicStep

  const makePath = (steps: DynamicBranchEntry[], pathId: string): DynamicBranchPath => ({
    pathId,
    astPath: pathId,
    steps: steps as NonEmptyReadonlyArray<DynamicBranchEntry>,
    isAnonymous: false,
  })

  const makeParallelBranch = (paths: DynamicBranchPath[]): DynamicParallelBranch => ({
    branchId: '/branch',
    astPath: '/branch',
    kind: 'parallel',
    parallelId: '/branch',
    paths: paths as NonEmptyReadonlyArray<DynamicBranchPath>,
  })

  const makeAlternateBranch = (paths: DynamicBranchPath[]): DynamicAlternateBranch => ({
    branchId: '/branch',
    astPath: '/branch',
    kind: 'alternate',
    paths: paths as NonEmptyReadonlyArray<DynamicBranchPath>,
  })

  describe('isDynamicBranchCollection', () => {
    it('should identify parallel branch collections', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeParallelBranch([path])

      expect(isDynamicBranchCollection(branch)).toBe(true)
    })

    it('should identify alternate branch collections', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeAlternateBranch([path])

      expect(isDynamicBranchCollection(branch)).toBe(true)
    })

    it('should return false for regular steps', () => {
      const step = makeStep('A', 'B', '/step')
      expect(isDynamicBranchCollection(step as unknown as DynamicBranchCollection)).toBe(false)
    })

    it('should return false for series', () => {
      const step1 = makeStep('A', 'B', '/step1')
      const step2 = makeStep('B', 'C', '/step2')
      const series = {
        seriesId: '/series',
        __series: [step1, step2] as NonEmptyReadonlyArray<DynamicStep>,
      }
      expect(isDynamicBranchCollection(series as unknown as DynamicBranchCollection)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isDynamicBranchCollection(undefined)).toBe(false)
    })
  })

  describe('isDynamicBranchPath', () => {
    it('should identify branch paths', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')

      expect(isDynamicBranchPath(path)).toBe(true)
    })

    it('should return false for regular steps', () => {
      const step = makeStep('A', 'B', '/step')
      expect(isDynamicBranchPath(step as unknown as DynamicBranchPath)).toBe(false)
    })

    it('should return false for branch collections', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeParallelBranch([path])

      expect(isDynamicBranchPath(branch as unknown as DynamicBranchPath)).toBe(false)
    })
  })

  describe('toLegacyParallel', () => {
    it('should extract legacy parallel format when __parallel is present', () => {
      const step1 = makeStep('A', 'B', '/step1')
      const step2 = makeStep('C', 'D', '/step2')
      const path = makePath([step1], '/path')
      const branch: DynamicParallelBranch = {
        ...makeParallelBranch([path]),
        __parallel: [step1, step2] as NonEmptyReadonlyArray<DynamicStep>,
      }

      const result = toLegacyParallel(branch)
      expect(result).not.toBeNull()
      expect(result?.__parallel).toHaveLength(2)
      expect(result?.__parallel?.[0]).toEqual(step1)
      expect(result?.__parallel?.[1]).toEqual(step2)
    })

    it('should return null for parallel branch without __parallel', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeParallelBranch([path])

      const result = toLegacyParallel(branch)
      expect(result).toBeNull()
    })

    it('should return null for alternate branches', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeAlternateBranch([path])

      const result = toLegacyParallel(branch)
      expect(result).toBeNull()
    })

    it('should return null for regular steps', () => {
      const step = makeStep('A', 'B', '/step')
      const result = toLegacyParallel(step as unknown as DynamicViewStep)
      expect(result).toBeNull()
    })

    it('should return null for series', () => {
      const step1 = makeStep('A', 'B', '/step1')
      const step2 = makeStep('B', 'C', '/step2')
      const series = {
        seriesId: '/series',
        __series: [step1, step2] as NonEmptyReadonlyArray<DynamicStep>,
      }
      const result = toLegacyParallel(series as unknown as DynamicViewStep)
      expect(result).toBeNull()
    })

    it('should return null for parallel with empty __parallel array', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch: DynamicParallelBranch = {
        ...makeParallelBranch([path]),
        __parallel: [] as unknown as NonEmptyReadonlyArray<DynamicStep>,
      }

      const result = toLegacyParallel(branch)
      expect(result).toBeNull()
    })
  })

  describe('isDynamicStep with new branch types', () => {
    it('should return false for branch collections', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeParallelBranch([path])

      expect(isDynamicStep(branch)).toBe(false)
    })

    it('should still identify regular steps', () => {
      const step = makeStep('A', 'B', '/step')
      expect(isDynamicStep(step)).toBe(true)
    })
  })

  describe('isDynamicStepsParallel with new definition', () => {
    it('should identify legacy parallel with __parallel array', () => {
      const step1 = makeStep('A', 'B', '/step1')
      const step2 = makeStep('C', 'D', '/step2')
      const path = makePath([step1], '/path')
      const branch: DynamicParallelBranch = {
        ...makeParallelBranch([path]),
        __parallel: [step1, step2] as NonEmptyReadonlyArray<DynamicStep>,
      }

      expect(isDynamicStepsParallel(branch)).toBe(true)
    })

    it('should return false for parallel branch without __parallel', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeParallelBranch([path])

      expect(isDynamicStepsParallel(branch)).toBe(false)
    })

    it('should return false for alternate branches', () => {
      const step = makeStep('A', 'B', '/step')
      const path = makePath([step], '/path')
      const branch = makeAlternateBranch([path])

      expect(isDynamicStepsParallel(branch)).toBe(false)
    })

    it('should return false for regular steps', () => {
      const step = makeStep('A', 'B', '/step')
      expect(isDynamicStepsParallel(step as unknown as DynamicStepsParallel)).toBe(false)
    })
  })
})

describe('Branch collection structures', () => {
  const makeStep = (source: string, target: string, astPath: string): DynamicStep =>
    ({
      source,
      target,
      astPath,
    }) as DynamicStep

  const makePath = (steps: DynamicBranchEntry[], pathId: string): DynamicBranchPath =>
    ({
      pathId,
      astPath: pathId,
      steps: steps as NonEmptyReadonlyArray<DynamicBranchEntry>,
      isAnonymous: false,
    })

  const makeParallelBranch = (paths: DynamicBranchPath[]): DynamicParallelBranch =>
    ({
      branchId: '/branch',
      astPath: '/branch',
      kind: 'parallel',
      parallelId: '/branch',
      paths: paths as NonEmptyReadonlyArray<DynamicBranchPath>,
    })

  const makeAlternateBranch = (paths: DynamicBranchPath[]): DynamicAlternateBranch =>
    ({
      branchId: '/branch',
      astPath: '/branch',
      kind: 'alternate',
      paths: paths as NonEmptyReadonlyArray<DynamicBranchPath>,
    })

  it('should support nested branch collections', () => {
    const step = makeStep('A', 'B', '/step')
    const innerPath = makePath([step], '/inner/path')
    const innerBranch = makeParallelBranch([innerPath])
    const outerPath = makePath([innerBranch as unknown as DynamicBranchEntry], '/outer/path')
    const outerBranch = makeParallelBranch([outerPath])

    expect(isDynamicBranchCollection(outerBranch)).toBe(true)
    expect(outerBranch.paths[0]?.steps[0]).toBe(innerBranch)
  })

  it('should support mixed step types in paths', () => {
    const step = makeStep('A', 'B', '/step')
    const series = {
      seriesId: '/series',
      __series: [makeStep('B', 'C', '/s1'), makeStep('C', 'D', '/s2')] as NonEmptyReadonlyArray<DynamicStep>,
    }
    const path = makePath([step, series as unknown as DynamicBranchEntry], '/path')

    expect(path.steps).toHaveLength(2)
    expect(isDynamicStep(path.steps[0] as unknown as DynamicStep)).toBe(true)
    expect(isDynamicStepsSeries(path.steps[1] as unknown as DynamicStepsSeries)).toBe(true)
  })
})