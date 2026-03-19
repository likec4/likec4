import { describe, expect, it } from 'vitest'
import { impactReportFromSyncPlan } from './impact-report'
import type { SyncPlan } from './sync-to-leanix'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

function createMinimalPlan(overrides: Partial<SyncPlan> = {}): SyncPlan {
  return {
    generatedAt: FIXED_DATE,
    projectId: 'test-project',
    mappingProfile: 'default',
    summary: {
      factSheetsToCreate: 3,
      factSheetsToUpdate: 1,
      relationsToCreate: 2,
    },
    factSheetPlans: [],
    relationPlans: [],
    errors: [],
    ...overrides,
  }
}

describe('impactReportFromSyncPlan', () => {
  it('produces impact summary with create/update counts', () => {
    const plan = createMinimalPlan()
    const report = impactReportFromSyncPlan(plan)

    expect(report.generatedAt).toBe(FIXED_DATE)
    expect(report.projectId).toBe('test-project')
    expect(report.summary.factSheetsToCreate).toBe(3)
    expect(report.summary.factSheetsToUpdate).toBe(1)
    expect(report.impactSummary).toContain('3 fact sheet(s) to create')
    expect(report.impactSummary).toContain('1 fact sheet(s) to update')
    expect(report.impactSummary).toContain('2 relation(s) to create')
    expect(report.hasErrors).toBe(false)
  })

  it('reports no changes when summary is zero', () => {
    const plan = createMinimalPlan({
      summary: {
        factSheetsToCreate: 0,
        factSheetsToUpdate: 0,
        relationsToCreate: 0,
      },
    })
    const report = impactReportFromSyncPlan(plan)

    expect(report.impactSummary).toBe('No changes')
  })

  it('sets hasErrors and appends to summary when plan has errors', () => {
    const plan = createMinimalPlan({ errors: ['Auth failed'] })
    const report = impactReportFromSyncPlan(plan)

    expect(report.hasErrors).toBe(true)
    expect(report.impactSummary).toContain('1 plan error(s)')
  })
})
