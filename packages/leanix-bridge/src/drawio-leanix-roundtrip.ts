/**
 * Draw.io ↔ LeanIX round-trip: mapping between bridge manifest (with LeanIX external IDs)
 * and diagram identity (likec4Id, likec4RelationId).
 * Use after syncToLeanix to get a mapping for re-export or for annotating diagrams.
 */

import type { BridgeManifest, CanonicalId } from './contracts'

const LEANIX_PROVIDER = 'leanix' as const

/** Mapping from LikeC4 canonical id to LeanIX identity (fact sheet id or externalId for Draw.io cells or export). */
export interface DrawioLeanixMapping {
  likec4IdToLeanixId: Record<CanonicalId, string>
  /** Composite key (sourceFqn|targetFqn|relationId) -> LeanIX relation id. */
  relationKeyToLeanixRelationId: Record<string, string>
}

/**
 * Collects likec4Id → LeanIX identity (factSheetId or externalId) from manifest entities that have LeanIX external.
 * Single responsibility: one level of abstraction for entity extraction.
 */
function collectLikec4IdToLeanixId(manifest: BridgeManifest): Record<CanonicalId, string> {
  const out: Record<CanonicalId, string> = {}
  for (const [canonicalId, entity] of Object.entries(manifest.entities)) {
    const leanixId = entity.external?.[LEANIX_PROVIDER]?.factSheetId ?? entity.external?.[LEANIX_PROVIDER]?.externalId
    if (leanixId) out[canonicalId] = leanixId
  }
  return out
}

/**
 * Collects compositeKey → LeanIX relationId from manifest relations that have LeanIX external.
 * Single responsibility: one level of abstraction for relation extraction.
 */
function collectRelationKeyToLeanixRelationId(manifest: BridgeManifest): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rel of manifest.relations) {
    const leanixRelId = rel.external?.[LEANIX_PROVIDER]?.relationId
    if (leanixRelId) out[rel.compositeKey] = leanixRelId
  }
  return out
}

/**
 * Builds a mapping from manifest (after sync) for use in Draw.io bridge-managed export
 * or when re-importing from LeanIX. Elements can store leanixFactSheetId in style for round-trip.
 */
export function manifestToDrawioLeanixMapping(manifest: BridgeManifest): DrawioLeanixMapping {
  return {
    likec4IdToLeanixId: collectLikec4IdToLeanixId(manifest),
    relationKeyToLeanixRelationId: collectRelationKeyToLeanixRelationId(manifest),
  }
}
