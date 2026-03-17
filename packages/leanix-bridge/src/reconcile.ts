/**
 * Reconciliation of LeanIX inventory snapshot with LikeC4 manifest.
 * Produces matched, unmatched (in LikeC4 only / in LeanIX only), and ambiguous pairs.
 * No DSL generation; read-only comparison.
 */

import type { BridgeManifest, CanonicalId, ManifestEntity } from './contracts'
import type {
  LeanixFactSheetSnapshotItem,
  LeanixInventorySnapshot,
} from './leanix-inventory-snapshot'
import type { LeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

export interface MatchedPair {
  canonicalId: CanonicalId
  factSheetId: string
  name: string
  type: string
}

export interface UnmatchedInLikec4 {
  canonicalId: CanonicalId
  name?: string | undefined
  type?: string | undefined
}

export interface UnmatchedInLeanix {
  factSheetId: string
  name: string
  type: string
  likec4Id?: string | undefined
}

export interface AmbiguousMatch {
  canonicalId: CanonicalId
  name?: string | undefined
  type?: string | undefined
  /** Multiple LeanIX fact sheets could match (e.g. same name+type). */
  candidateFactSheetIds: string[]
}

export interface ReconciliationResult {
  generatedAt: string
  manifestProjectId: string
  snapshotGeneratedAt: string
  matched: MatchedPair[]
  unmatchedInLikec4: UnmatchedInLikec4[]
  unmatchedInLeanix: UnmatchedInLeanix[]
  ambiguous: AmbiguousMatch[]
  summary: {
    matched: number
    unmatchedInLikec4: number
    unmatchedInLeanix: number
    ambiguous: number
  }
}

const LEANIX_PROVIDER = 'leanix' as const
/** Separator for name+type composite key (G25: avoid magic character). */
const NAME_TYPE_SEP = '\0'

/** Tries to match by manifest entity's external.leanix.factSheetId; returns match or null. */
function tryMatchByManifestFactSheetId(
  entity: ManifestEntity,
  canonicalId: CanonicalId,
  snapshotById: Map<string, LeanixFactSheetSnapshotItem>,
  usedFactSheetIds: Set<string>,
): MatchedPair | null {
  const leanixExternal = entity.external?.[LEANIX_PROVIDER]
  const manifestFactSheetId = leanixExternal?.factSheetId ?? leanixExternal?.externalId
  if (manifestFactSheetId == null) return null
  const fs = snapshotById.get(manifestFactSheetId)
  if (!fs) return null
  usedFactSheetIds.add(fs.id)
  return { canonicalId, factSheetId: fs.id, name: fs.name, type: fs.type }
}

/** Tries to match by snapshot fact sheet's likec4Id === canonicalId; returns match or null. */
function tryMatchByLikec4Id(
  canonicalId: CanonicalId,
  snapshotByLikec4Id: Map<string, LeanixFactSheetSnapshotItem>,
  usedFactSheetIds: Set<string>,
): MatchedPair | null {
  const byLikec4 = snapshotByLikec4Id.get(canonicalId)
  if (!byLikec4 || usedFactSheetIds.has(byLikec4.id)) return null
  usedFactSheetIds.add(byLikec4.id)
  return { canonicalId, factSheetId: byLikec4.id, name: byLikec4.name, type: byLikec4.type }
}

/** Resolves match by name+type (or pushes to unmatchedInLikec4 / ambiguous). */
function resolveByNameAndType(
  canonicalId: CanonicalId,
  entityName: string | undefined,
  entityType: string | undefined,
  snapshotByNameAndType: Map<string, LeanixFactSheetSnapshotItem[]>,
  usedFactSheetIds: Set<string>,
  matched: MatchedPair[],
  unmatchedInLikec4: UnmatchedInLikec4[],
  ambiguous: AmbiguousMatch[],
): void {
  const nameTypeKey = `${entityName ?? canonicalId}${NAME_TYPE_SEP}${entityType ?? ''}`
  const candidates = snapshotByNameAndType.get(nameTypeKey)?.filter(f => !usedFactSheetIds.has(f.id)) ?? []
  if (candidates.length === 0) {
    unmatchedInLikec4.push({
      canonicalId,
      ...(entityName !== undefined ? { name: entityName } : {}),
      ...(entityType !== undefined ? { type: entityType } : {}),
    })
  } else if (candidates.length === 1) {
    const candidate = candidates[0]
    if (candidate) {
      matched.push({
        canonicalId,
        factSheetId: candidate.id,
        name: candidate.name,
        type: candidate.type,
      })
      usedFactSheetIds.add(candidate.id)
    }
  } else {
    ambiguous.push({
      canonicalId,
      ...(entityName !== undefined ? { name: entityName } : {}),
      ...(entityType !== undefined ? { type: entityType } : {}),
      candidateFactSheetIds: candidates.map(c => c.id),
    })
  }
}

export interface ReconcileOptions {
  generatedAt?: string
  /** When provided, name+type matching and ambiguous detection use dry-run fact sheet names/types. */
  dryRun?: LeanixInventoryDryRun
}

/**
 * Reconciles a LeanIX inventory snapshot with the bridge manifest.
 * Matching order: 1) manifest entity has external.leanix.factSheetId; 2) snapshot fact sheet has likec4Id === canonicalId; 3) if dryRun provided, name+type (can be ambiguous).
 * Does not modify any data; no DSL generation.
 */
export function reconcileInventoryWithManifest(
  snapshot: LeanixInventorySnapshot,
  manifest: BridgeManifest,
  options: ReconcileOptions = {},
): ReconciliationResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const dryRun = options.dryRun
  const matched: MatchedPair[] = []
  const unmatchedInLikec4: UnmatchedInLikec4[] = []
  const ambiguous: AmbiguousMatch[] = []

  const snapshotById = new Map(snapshot.factSheets.map(f => [f.id, f]))
  const snapshotByLikec4Id = new Map<string, LeanixFactSheetSnapshotItem>()
  const snapshotByNameAndType = new Map<string, LeanixFactSheetSnapshotItem[]>()
  for (const fs of snapshot.factSheets) {
    if (fs.likec4Id) snapshotByLikec4Id.set(fs.likec4Id, fs)
    const key = `${fs.name}${NAME_TYPE_SEP}${fs.type}`
    if (!snapshotByNameAndType.has(key)) snapshotByNameAndType.set(key, [])
    snapshotByNameAndType.get(key)!.push(fs)
  }

  const dryRunByCanonicalId = dryRun
    ? new Map(dryRun.factSheets.map(f => [f.likec4Id, f]))
    : null

  const usedFactSheetIds = new Set<string>()

  for (const [canonicalId, entity] of Object.entries(manifest.entities)) {
    const byManifest = tryMatchByManifestFactSheetId(
      entity,
      canonicalId,
      snapshotById,
      usedFactSheetIds,
    )
    if (byManifest) {
      matched.push(byManifest)
      continue
    }
    const byLikec4 = tryMatchByLikec4Id(canonicalId, snapshotByLikec4Id, usedFactSheetIds)
    if (byLikec4) {
      matched.push(byLikec4)
      continue
    }
    const dryRunFs = dryRunByCanonicalId?.get(canonicalId)
    const entityName = dryRunFs?.name ?? undefined
    const entityType = dryRunFs?.type ?? undefined
    resolveByNameAndType(
      canonicalId,
      entityName,
      entityType,
      snapshotByNameAndType,
      usedFactSheetIds,
      matched,
      unmatchedInLikec4,
      ambiguous,
    )
  }

  const unmatchedInLeanix: UnmatchedInLeanix[] = snapshot.factSheets
    .filter(f => !usedFactSheetIds.has(f.id))
    .map(f => ({
      factSheetId: f.id,
      name: f.name,
      type: f.type,
      ...(f.likec4Id ? { likec4Id: f.likec4Id } : {}),
    }))

  return {
    generatedAt,
    manifestProjectId: manifest.projectId,
    snapshotGeneratedAt: snapshot.generatedAt,
    matched,
    unmatchedInLikec4,
    unmatchedInLeanix,
    ambiguous,
    summary: {
      matched: matched.length,
      unmatchedInLikec4: unmatchedInLikec4.length,
      unmatchedInLeanix: unmatchedInLeanix.length,
      ambiguous: ambiguous.length,
    },
  }
}
