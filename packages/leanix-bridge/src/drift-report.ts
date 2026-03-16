/**
 * Phase 3: Drift detection from reconciliation result.
 * Produces a structured drift report (in sync, LikeC4 ahead, LeanIX ahead, or diverged).
 */

import type { ReconciliationResult } from './reconcile'

export type DriftStatus = 'in_sync' | 'likec4_ahead' | 'leanix_ahead' | 'diverged'

export interface DriftReport {
  generatedAt: string
  manifestProjectId: string
  snapshotGeneratedAt: string
  status: DriftStatus
  summary: ReconciliationResult['summary']
  /** Short human-readable drift description. */
  description: string
}

/**
 * Builds a drift report from a reconciliation result.
 * In_sync: all matched, no unmatched, no ambiguous. Likec4_ahead: only unmatched in LikeC4. Leanix_ahead: only unmatched in LeanIX. Diverged: mixed or ambiguous.
 */
export function buildDriftReport(reconciliation: ReconciliationResult): DriftReport {
  const { summary } = reconciliation
  const hasUnmatchedLikec4 = summary.unmatchedInLikec4 > 0
  const hasUnmatchedLeanix = summary.unmatchedInLeanix > 0
  const hasAmbiguous = summary.ambiguous > 0

  let status: DriftStatus
  let description: string
  switch (true) {
    case hasAmbiguous || (hasUnmatchedLikec4 && hasUnmatchedLeanix):
      status = 'diverged'
      description =
        `${summary.ambiguous} ambiguous; ${summary.unmatchedInLikec4} only in LikeC4, ${summary.unmatchedInLeanix} only in LeanIX`
      break
    case hasUnmatchedLikec4 && !hasUnmatchedLeanix:
      status = 'likec4_ahead'
      description = `${summary.unmatchedInLikec4} element(s) in LikeC4 not yet in LeanIX`
      break
    case hasUnmatchedLeanix && !hasUnmatchedLikec4:
      status = 'leanix_ahead'
      description = `${summary.unmatchedInLeanix} fact sheet(s) in LeanIX not in LikeC4`
      break
    default:
      status = 'in_sync'
      description = `${summary.matched} matched; no drift`
  }

  return {
    generatedAt: reconciliation.generatedAt,
    manifestProjectId: reconciliation.manifestProjectId,
    snapshotGeneratedAt: reconciliation.snapshotGeneratedAt,
    status,
    summary: reconciliation.summary,
    description,
  }
}
