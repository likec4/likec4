import { describe, expect, it } from 'vitest'
import { generateAdrFromDriftReport, generateAdrFromReconciliation } from './adr-generation'
import type { DriftReport } from './drift-report'
import type { ReconciliationResult } from './reconcile'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

function createMinimalReconciliation(): ReconciliationResult {
  return {
    generatedAt: FIXED_DATE,
    manifestProjectId: 'my-project',
    snapshotGeneratedAt: FIXED_DATE,
    matched: [],
    unmatchedInLikec4: [],
    unmatchedInLeanix: [],
    ambiguous: [],
    summary: { matched: 5, unmatchedInLikec4: 1, unmatchedInLeanix: 0, ambiguous: 0 },
  }
}

describe('generateAdrFromReconciliation', () => {
  it('produces markdown with title, status, context, result, decision', () => {
    const rec = createMinimalReconciliation()
    const adr = generateAdrFromReconciliation(rec)

    expect(adr).toContain('# ')
    expect(adr).toContain('Status:')
    expect(adr).toContain('Context')
    expect(adr).toContain('Result')
    expect(adr).toContain('Matched: 5')
    expect(adr).toContain('Unmatched in LikeC4: 1')
    expect(adr).toContain('Decision')
    expect(adr).toContain('single source of truth')
  })

  it('includes impact section when impact option provided', () => {
    const rec = createMinimalReconciliation()
    const adr = generateAdrFromReconciliation(rec, {
      impact: {
        generatedAt: FIXED_DATE,
        projectId: 'my-project',
        mappingProfile: 'default',
        summary: { factSheetsToCreate: 2, factSheetsToUpdate: 0, relationsToCreate: 1 },
        impactSummary: '2 fact sheet(s) to create; 1 relation(s) to create',
        hasErrors: false,
      },
    })

    expect(adr).toContain('Impact')
    expect(adr).toContain('2 fact sheet(s) to create')
  })
})

describe('generateAdrFromDriftReport', () => {
  it('produces markdown with drift status and summary', () => {
    const drift: DriftReport = {
      generatedAt: FIXED_DATE,
      manifestProjectId: 'my-project',
      snapshotGeneratedAt: FIXED_DATE,
      status: 'likec4_ahead',
      summary: { matched: 3, unmatchedInLikec4: 2, unmatchedInLeanix: 0, ambiguous: 0 },
      description: '2 element(s) in LikeC4 not yet in LeanIX',
    }
    const adr = generateAdrFromDriftReport(drift)

    expect(adr).toContain('Drift status')
    expect(adr).toContain('2 element(s) in LikeC4')
    expect(adr).toContain('Matched: 3')
  })
})
