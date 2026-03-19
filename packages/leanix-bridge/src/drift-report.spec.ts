import { describe, expect, it } from 'vitest'
import { buildDriftReport } from './drift-report'
import type { ReconciliationResult } from './reconcile'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

function createReconciliation(overrides: Partial<ReconciliationResult> = {}): ReconciliationResult {
  return {
    generatedAt: FIXED_DATE,
    manifestProjectId: 'test-project',
    snapshotGeneratedAt: FIXED_DATE,
    matched: [],
    unmatchedInLikec4: [],
    unmatchedInLeanix: [],
    ambiguous: [],
    summary: {
      matched: 0,
      unmatchedInLikec4: 0,
      unmatchedInLeanix: 0,
      ambiguous: 0,
    },
    ...overrides,
  }
}

describe('buildDriftReport', () => {
  it('reports in_sync when all matched and no unmatched/ambiguous', () => {
    const rec = createReconciliation({
      summary: { matched: 5, unmatchedInLikec4: 0, unmatchedInLeanix: 0, ambiguous: 0 },
    })
    const report = buildDriftReport(rec)

    expect(report.status).toBe('in_sync')
    expect(report.description).toContain('5 matched')
  })

  it('reports likec4_ahead when only unmatched in LikeC4', () => {
    const rec = createReconciliation({
      summary: { matched: 2, unmatchedInLikec4: 3, unmatchedInLeanix: 0, ambiguous: 0 },
    })
    const report = buildDriftReport(rec)

    expect(report.status).toBe('likec4_ahead')
    expect(report.description).toContain('3')
    expect(report.description).toContain('LikeC4')
  })

  it('reports leanix_ahead when only unmatched in LeanIX', () => {
    const rec = createReconciliation({
      summary: { matched: 1, unmatchedInLikec4: 0, unmatchedInLeanix: 4, ambiguous: 0 },
    })
    const report = buildDriftReport(rec)

    expect(report.status).toBe('leanix_ahead')
    expect(report.description).toContain('4')
    expect(report.description).toContain('LeanIX')
  })

  it('reports diverged when ambiguous or both unmatched', () => {
    const recAmbiguous = createReconciliation({
      summary: { matched: 0, unmatchedInLikec4: 0, unmatchedInLeanix: 0, ambiguous: 2 },
    })
    expect(buildDriftReport(recAmbiguous).status).toBe('diverged')

    const recBoth = createReconciliation({
      summary: { matched: 1, unmatchedInLikec4: 1, unmatchedInLeanix: 1, ambiguous: 0 },
    })
    expect(buildDriftReport(recBoth).status).toBe('diverged')
  })
})
