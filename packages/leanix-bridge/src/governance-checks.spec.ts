import { describe, expect, it } from 'vitest'
import { runGovernanceChecks } from './governance-checks'
import type { ReconciliationResult } from './reconcile'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

function createReconciliation(summary: ReconciliationResult['summary']): ReconciliationResult {
  return {
    generatedAt: FIXED_DATE,
    manifestProjectId: 'test',
    snapshotGeneratedAt: FIXED_DATE,
    matched: [],
    unmatchedInLikec4: [],
    unmatchedInLeanix: [],
    ambiguous: [],
    summary,
  }
}

describe('runGovernanceChecks', () => {
  it('passes when no ambiguous (default check)', () => {
    const rec = createReconciliation({
      matched: 3,
      unmatchedInLikec4: 0,
      unmatchedInLeanix: 0,
      ambiguous: 0,
    })
    const report = runGovernanceChecks(rec)

    expect(report.passed).toBe(true)
    expect(report.checks).toHaveLength(1)
    expect(report.checks[0]!.id).toBe('noAmbiguous')
    expect(report.checks[0]!.passed).toBe(true)
  })

  it('fails noAmbiguous when ambiguous > 0', () => {
    const rec = createReconciliation({
      matched: 0,
      unmatchedInLikec4: 0,
      unmatchedInLeanix: 0,
      ambiguous: 1,
    })
    const report = runGovernanceChecks(rec)

    expect(report.passed).toBe(false)
    expect(report.checks[0]!.passed).toBe(false)
    expect(report.checks[0]!.message).toContain('1 ambiguous')
  })

  it('allLikec4Matched check fails when unmatchedInLikec4 > 0', () => {
    const rec = createReconciliation({
      matched: 2,
      unmatchedInLikec4: 1,
      unmatchedInLeanix: 0,
      ambiguous: 0,
    })
    const report = runGovernanceChecks(rec, { allLikec4Matched: true })

    const check = report.checks.find(c => c.id === 'allLikec4Matched')
    expect(check).toBeDefined()
    expect(check!.passed).toBe(false)
  })

  it('noOrphanInLeanix check fails when unmatchedInLeanix > 0', () => {
    const rec = createReconciliation({
      matched: 2,
      unmatchedInLikec4: 0,
      unmatchedInLeanix: 1,
      ambiguous: 0,
    })
    const report = runGovernanceChecks(rec, { noOrphanInLeanix: true })

    const check = report.checks.find(c => c.id === 'noOrphanInLeanix')
    expect(check).toBeDefined()
    expect(check!.passed).toBe(false)
  })

  it('overall passed only when all enabled checks pass', () => {
    const rec = createReconciliation({
      matched: 3,
      unmatchedInLikec4: 0,
      unmatchedInLeanix: 0,
      ambiguous: 0,
    })
    const report = runGovernanceChecks(rec, {
      noAmbiguous: true,
      allLikec4Matched: true,
      noOrphanInLeanix: true,
    })

    expect(report.passed).toBe(true)
    expect(report.checks).toHaveLength(3)
  })
})
