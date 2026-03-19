/**
 * Phase 3: Impact analysis from a sync plan.
 * Produces a structured report of what would change if the plan were applied (no writes).
 */

import type { SyncPlan, SyncPlanSummary } from './sync-to-leanix'

/** Impact report from a sync plan (summary counts and human-readable impact summary). */
export interface ImpactReport {
  generatedAt: string
  projectId: string
  mappingProfile: string
  summary: SyncPlanSummary
  /** Human-readable one-line impact summary. */
  impactSummary: string
  hasErrors: boolean
}

/**
 * Builds an impact report from a sync plan (read-only).
 * Use before applying sync to understand what would be created/updated.
 */
export function impactReportFromSyncPlan(plan: SyncPlan): ImpactReport {
  const { summary, errors } = plan
  const parts: string[] = []
  if (summary.factSheetsToCreate > 0) parts.push(`${summary.factSheetsToCreate} fact sheet(s) to create`)
  if (summary.factSheetsToUpdate > 0) parts.push(`${summary.factSheetsToUpdate} fact sheet(s) to update`)
  if (summary.relationsToCreate > 0) parts.push(`${summary.relationsToCreate} relation(s) to create`)
  const impactSummary = parts.length > 0 ? parts.join('; ') : 'No changes'
  return {
    generatedAt: plan.generatedAt,
    projectId: plan.projectId,
    mappingProfile: plan.mappingProfile,
    summary,
    impactSummary: errors.length > 0 ? `${impactSummary} (${errors.length} plan error(s))` : impactSummary,
    hasErrors: errors.length > 0,
  }
}
