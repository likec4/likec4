import { describe, expect, it } from 'vitest'
import type { NonEmptyReadonlyArray } from '../../../types/_common'
import type { DynamicBranchCollection, DynamicBranchPath, DynamicStep, DynamicStepsSeries, DynamicViewStep } from '../../../types/view-parsed.dynamic'
import { flattenSteps } from '../utils'

const makeStep = (source: string, target: string, astPath: string): DynamicStep => ({
  source,
  target,
  astPath,
}) as DynamicStep

const makeSeries = (...steps: DynamicStep[]): DynamicStepsSeries => ({
  __series: steps as NonEmptyReadonlyArray<DynamicStep>,
})

const makeLegacyParallel = (...steps: (DynamicStep | DynamicStepsSeries)[]): DynamicViewStep => ({
  branchId: '/parallel',
  astPath: '/parallel',
  kind: 'parallel',
  parallelId: '/parallel',
  paths: [] as any,
  __parallel: steps as NonEmptyReadonlyArray<DynamicStep | DynamicStepsSeries>,
  isLegacyParallel: true,
}) as any

const makeBranchCollection = (paths: DynamicBranchPath[]): DynamicBranchCollection => ({
  branchId: '/branch',
  astPath: '/branch',
  kind: 'parallel',
  paths: paths as NonEmptyReadonlyArray<DynamicBranchPath>,
}) as DynamicBranchCollection

describe('flattenSteps', () => {
  describe('single steps', () => {
    it('should return single step as array', () => {
      const step = makeStep('A', 'B', '/step')
      const result = flattenSteps(step)
      
      expect(result).toEqual([step])
      expect(result).toHaveLength(1)
    })

    it('should handle multiple single steps independently', () => {
      const step1 = makeStep('A', 'B', '/step1')
      const step2 = makeStep('B', 'C', '/step2')
      
      expect(flattenSteps(step1)).toEqual([step1])
      expect(flattenSteps(step2)).toEqual([step2])
    })
  })

  describe('series steps', () => {
    it('should flatten series of steps', () => {
      const step1 = makeStep('A', 'B', '/series/0')
      const step2 = makeStep('B', 'C', '/series/1')
      const step3 = makeStep('C', 'D', '/series/2')
      const series = makeSeries(step1, step2, step3)
      
      const result = flattenSteps(series)
      
      expect(result).toEqual([step1, step2, step3])
      expect(result).toHaveLength(3)
    })

    it('should handle single-step series', () => {
      const step = makeStep('A', 'B', '/series/0')
      const series = makeSeries(step)
      
      const result = flattenSteps(series)
      
      expect(result).toEqual([step])
      expect(result).toHaveLength(1)
    })
  })

  describe('legacy parallel steps', () => {
    it('should flatten legacy parallel with single steps', () => {
      const step1 = makeStep('A', 'B', '/parallel/0')
      const step2 = makeStep('A', 'C', '/parallel/1')
      const parallel = makeLegacyParallel(step1, step2)
      
      const result = flattenSteps(parallel)
      
      expect(result).toEqual([step1, step2])
      expect(result).toHaveLength(2)
    })

    it('should flatten legacy parallel with series', () => {
      const step1 = makeStep('A', 'B', '/parallel/0/0')
      const step2 = makeStep('B', 'C', '/parallel/0/1')
      const step3 = makeStep('A', 'D', '/parallel/1')
      
      const series = makeSeries(step1, step2)
      const parallel = makeLegacyParallel(series, step3)
      
      const result = flattenSteps(parallel)
      
      // Legacy parallel flattens by taking heads first, then tails
      expect(result).toEqual([step1, step3, step2])
      expect(result).toHaveLength(3)
    })

    it('should handle legacy parallel with multiple series', () => {
      const step1a = makeStep('A', 'B', '/p/0/0')
      const step1b = makeStep('B', 'C', '/p/0/1')
      const step2a = makeStep('A', 'D', '/p/1/0')
      const step2b = makeStep('D', 'E', '/p/1/1')
      
      const series1 = makeSeries(step1a, step1b)
      const series2 = makeSeries(step2a, step2b)
      const parallel = makeLegacyParallel(series1, series2)
      
      const result = flattenSteps(parallel)
      
      // Heads: step1a, step2a, then tails: step1b, step2b
      expect(result).toEqual([step1a, step2a, step1b, step2b])
      expect(result).toHaveLength(4)
    })

    it('should handle mixed series and steps in legacy parallel', () => {
      const step1 = makeStep('A', 'B', '/p/0')
      const step2a = makeStep('A', 'C', '/p/1/0')
      const step2b = makeStep('C', 'D', '/p/1/1')
      const step3 = makeStep('A', 'E', '/p/2')
      
      const series = makeSeries(step2a, step2b)
      const parallel = makeLegacyParallel(step1, series, step3)
      
      const result = flattenSteps(parallel)
      
      // Heads: step1, step2a, step3, then tails: step2b
      expect(result).toEqual([step1, step2a, step3, step2b])
      expect(result).toHaveLength(4)
    })
  })

  describe('branch collections', () => {
    it('should flatten branch collection with single path', () => {
      const step = makeStep('A', 'B', '/branch/path@0/step')
      const path: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/path@0',
        steps: [step],
      }
      const branch = makeBranchCollection([path])
      
      const result = flattenSteps(branch)
      
      expect(result).toEqual([step])
      expect(result).toHaveLength(1)
    })

    it('should flatten branch collection with multiple paths', () => {
      const step1 = makeStep('A', 'B', '/branch/path@0/step')
      const step2 = makeStep('A', 'C', '/branch/path@1/step')
      
      const path1: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/path@0',
        steps: [step1],
      }
      const path2: DynamicBranchPath = {
        pathId: '/branch/path@1',
        astPath: '/branch/path@1',
        steps: [step2],
      }
      const branch = makeBranchCollection([path1, path2])
      
      const result = flattenSteps(branch)
      
      expect(result).toEqual([step1, step2])
      expect(result).toHaveLength(2)
    })

    it('should flatten branch collection with multiple steps per path', () => {
      const step1a = makeStep('A', 'B', '/branch/path@0/step@0')
      const step1b = makeStep('B', 'C', '/branch/path@0/step@1')
      const step2 = makeStep('A', 'D', '/branch/path@1/step')
      
      const path1: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/path@0',
        steps: [step1a, step1b],
      }
      const path2: DynamicBranchPath = {
        pathId: '/branch/path@1',
        astPath: '/branch/path@1',
        steps: [step2],
      }
      const branch = makeBranchCollection([path1, path2])
      
      const result = flattenSteps(branch)
      
      expect(result).toEqual([step1a, step1b, step2])
      expect(result).toHaveLength(3)
    })

    it('should handle nested branch collections', () => {
      const innerStep = makeStep('B', 'C', '/branch/path@0/inner/step')
      const innerPath: DynamicBranchPath = {
        pathId: '/branch/path@0/inner/path@0',
        astPath: '/branch/path@0/inner/path@0',
        steps: [innerStep],
      }
      const innerBranch = makeBranchCollection([innerPath])
      
      const outerPath: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/path@0',
        steps: [innerBranch as any],
      }
      const outerBranch = makeBranchCollection([outerPath])
      
      const result = flattenSteps(outerBranch)
      
      expect(result).toEqual([innerStep])
      expect(result).toHaveLength(1)
    })

    it('should handle series within branch paths', () => {
      const step1 = makeStep('A', 'B', '/branch/path@0/step@0')
      const step2 = makeStep('B', 'C', '/branch/path@0/step@1')
      const series = makeSeries(step1, step2)
      
      const path: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/path@0',
        steps: [series as any],
      }
      const branch = makeBranchCollection([path])
      
      const result = flattenSteps(branch)
      
      expect(result).toEqual([step1, step2])
      expect(result).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('should handle empty legacy parallel gracefully', () => {
      const parallel = makeLegacyParallel()
      const result = flattenSteps(parallel)
      
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should return empty array for invalid input', () => {
      const invalid = { foo: 'bar' } as any
      const result = flattenSteps(invalid)
      
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should preserve step order in complex scenarios', () => {
      const stepA = makeStep('A', 'B', '/a')
      const stepB = makeStep('B', 'C', '/b')
      const stepC = makeStep('C', 'D', '/c')
      
      const series = makeSeries(stepA, stepB, stepC)
      const result = flattenSteps(series)
      
      expect(result[0]).toBe(stepA)
      expect(result[1]).toBe(stepB)
      expect(result[2]).toBe(stepC)
    })
  })

  describe('real-world scenarios', () => {
    it('should flatten complex mixed structure', () => {
      // Parallel with:
      // - Path 1: single step
      // - Path 2: series of steps
      // - Path 3: nested branch with steps
      
      const step1 = makeStep('A', 'B', '/p1')
      const step2a = makeStep('A', 'C', '/p2/0')
      const step2b = makeStep('C', 'D', '/p2/1')
      const step3 = makeStep('A', 'E', '/p3/inner')
      
      const series = makeSeries(step2a, step2b)
      
      const innerPath: DynamicBranchPath = {
        pathId: '/p3/inner/path@0',
        astPath: '/p3/inner/path@0',
        steps: [step3],
      }
      const innerBranch = makeBranchCollection([innerPath])
      
      const path1: DynamicBranchPath = {
        pathId: '/branch/path@0',
        astPath: '/branch/path@0',
        steps: [step1],
      }
      const path2: DynamicBranchPath = {
        pathId: '/branch/path@1',
        astPath: '/branch/path@1',
        steps: [series as any],
      }
      const path3: DynamicBranchPath = {
        pathId: '/branch/path@2',
        astPath: '/branch/path@2',
        steps: [innerBranch as any],
      }
      
      const branch = makeBranchCollection([path1, path2, path3])
      const result = flattenSteps(branch)
      
      expect(result).toEqual([step1, step2a, step2b, step3])
      expect(result).toHaveLength(4)
    })
  })
})