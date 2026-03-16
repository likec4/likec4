/**
 * Phase 3: Generate an Architecture Decision Record (ADR) from reconciliation and/or impact.
 * Output is markdown; no DSL generation.
 */

import type { DriftReport } from './drift-report'
import type { ImpactReport } from './impact-report'
import type { ReconciliationResult } from './reconcile'

/** Returns date part YYYY-MM-DD from ISO timestamp (G25, G5). Handles short strings defensively. */
function formatIsoDateString(iso: string): string {
  if (typeof iso !== 'string' || iso.length < 10) return iso
  return iso.slice(0, 10)
}

export interface AdrGenerationOptions {
  title?: string
  /** ADR status line. Default: "Proposed". */
  status?: string
  /** Optional impact report to include. */
  impact?: ImpactReport
}

/**
 * Generates a short ADR-style markdown document from a reconciliation result (and optional impact).
 * Use for governance or audit trail; does not modify any data.
 */
export function generateAdrFromReconciliation(
  reconciliation: ReconciliationResult,
  options: AdrGenerationOptions = {},
): string {
  const title = options.title ?? 'LeanIX inventory reconciliation'
  const status = options.status ?? 'Proposed'
  const impact = options.impact
  const lines: string[] = [
    `# ${title}`,
    '',
    `- Status: ${status}`,
    `- Date: ${formatIsoDateString(reconciliation.generatedAt)}`,
    '',
    '## Context',
    '',
    `Reconciliation of LikeC4 manifest (project: ${reconciliation.manifestProjectId}) with LeanIX inventory snapshot (${
      formatIsoDateString(reconciliation.snapshotGeneratedAt)
    }).`,
    '',
    '## Result',
    '',
    `- Matched: ${reconciliation.summary.matched}`,
    `- Unmatched in LikeC4: ${reconciliation.summary.unmatchedInLikec4}`,
    `- Unmatched in LeanIX: ${reconciliation.summary.unmatchedInLeanix}`,
    `- Ambiguous: ${reconciliation.summary.ambiguous}`,
    '',
  ]
  if (impact) {
    lines.push('## Impact (if sync applied)', '', impact.impactSummary, '', '')
  }
  lines.push(
    '## Decision',
    '',
    'LikeC4 remains the single source of truth; LeanIX is an adapter. No DSL is auto-generated from LeanIX.',
    '',
  )
  return lines.join('\n')
}

/**
 * Generates a short ADR-style markdown from a drift report.
 */
export function generateAdrFromDriftReport(
  drift: DriftReport,
  options: { title?: string; status?: string } = {},
): string {
  const title = options.title ?? 'LeanIX drift report'
  const status = options.status ?? 'Proposed'
  return [
    `# ${title}`,
    '',
    `- Status: ${status}`,
    `- Date: ${formatIsoDateString(drift.generatedAt)}`,
    '',
    '## Drift status',
    '',
    drift.description,
    '',
    '## Summary',
    '',
    `- Matched: ${drift.summary.matched}`,
    `- Unmatched in LikeC4: ${drift.summary.unmatchedInLikec4}`,
    `- Unmatched in LeanIX: ${drift.summary.unmatchedInLeanix}`,
    `- Ambiguous: ${drift.summary.ambiguous}`,
    '',
    '## Decision',
    '',
    'Review drift findings and determine whether synchronization or manual remediation is required.',
    '',
  ].join('\n')
}
