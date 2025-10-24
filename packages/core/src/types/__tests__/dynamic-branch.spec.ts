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
