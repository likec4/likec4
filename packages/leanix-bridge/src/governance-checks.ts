/**
 * Phase 3: Governance checks on reconciliation result.
 * Configurable rules (no ambiguous, all LikeC4 matched, no orphans in LeanIX); returns pass/fail per check.
 */

import type { ReconciliationResult } from './reconcile'

export interface GovernanceCheckResult {
  id: string
  name: string
  passed: boolean
  message?: string
}

export interface GovernanceReport {
  passed: boolean
  generatedAt: string
  checks: GovernanceCheckResult[]
}

export interface GovernanceCheckOptions {
  /** Fail if any ambiguous matches. Default: true. */
  noAmbiguous?: boolean
  /** Fail if any LikeC4 entity has no match in LeanIX. Default: false. */
  allLikec4Matched?: boolean
  /** Fail if any LeanIX fact sheet has no match in LikeC4. Default: false. */
  noOrphanInLeanix?: boolean
}

const DEFAULT_OPTIONS: Required<GovernanceCheckOptions> = {
  noAmbiguous: true,
  allLikec4Matched: false,
  noOrphanInLeanix: false,
}

/** Builds a single check result (G5: reduce duplication). */
function buildCheck(
  id: string,
  name: string,
  passed: boolean,
  failedMessage?: string,
): GovernanceCheckResult {
  const result: GovernanceCheckResult = { id, name, passed }
  if (!passed && failedMessage !== undefined) {
    result.message = failedMessage
  }
  return result
}

/**
 * Runs governance checks on a reconciliation result.
 * Returns a report with one entry per check; overall passed iff all checks pass.
 */
export function runGovernanceChecks(
  reconciliation: ReconciliationResult,
  options: GovernanceCheckOptions = {},
): GovernanceReport {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const checks: GovernanceCheckResult[] = []
  const { summary } = reconciliation

  if (opts.noAmbiguous) {
    checks.push(
      buildCheck(
        'noAmbiguous',
        'No ambiguous matches',
        summary.ambiguous === 0,
        `${summary.ambiguous} ambiguous match(es)`,
      ),
    )
  }

  if (opts.allLikec4Matched) {
    checks.push(
      buildCheck(
        'allLikec4Matched',
        'All LikeC4 elements matched in LeanIX',
        summary.unmatchedInLikec4 === 0,
        `${summary.unmatchedInLikec4} unmatched in LikeC4`,
      ),
    )
  }

  if (opts.noOrphanInLeanix) {
    checks.push(
      buildCheck(
        'noOrphanInLeanix',
        'No LeanIX fact sheets without LikeC4 match',
        summary.unmatchedInLeanix === 0,
        `${summary.unmatchedInLeanix} unmatched in LeanIX`,
      ),
    )
  }

  const passed = checks.every(c => c.passed)
  return {
    passed,
    generatedAt: new Date().toISOString(),
    checks,
  }
}
