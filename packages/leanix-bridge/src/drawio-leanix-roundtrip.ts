/**
 * Draw.io ↔ LeanIX round-trip: mapping between bridge manifest (with LeanIX external IDs)
 * and diagram identity (likec4Id, likec4RelationId).
 * Use after syncToLeanix to get a mapping for re-export or for annotating diagrams.
 */

import type { BridgeManifest, CanonicalId } from './contracts'

const LEANIX_PROVIDER = 'leanix' as const

/** Mapping from LikeC4 canonical id to LeanIX fact sheet id (for Draw.io cells or export). */
export interface DrawioLeanixMapping {
  likec4IdToLeanixFactSheetId: Record<CanonicalId, string>
  /** Composite key (sourceFqn|targetFqn|relationId) -> LeanIX relation id. */
  relationKeyToLeanixRelationId: Record<string, string>
}

/**
 * Builds a mapping from manifest (after sync) for use in Draw.io bridge-managed export
 * or when re-importing from LeanIX. Elements can store leanixFactSheetId in style for round-trip.
 */
export function manifestToDrawioLeanixMapping(manifest: BridgeManifest): DrawioLeanixMapping {
  const likec4IdToLeanixFactSheetId: Record<CanonicalId, string> = {}
  const relationKeyToLeanixRelationId: Record<string, string> = {}

  for (const [canonicalId, entity] of Object.entries(manifest.entities)) {
    const leanixId = entity.external?.[LEANIX_PROVIDER]?.factSheetId ?? entity.external?.[LEANIX_PROVIDER]?.externalId
    if (leanixId) likec4IdToLeanixFactSheetId[canonicalId] = leanixId
  }

  for (const rel of manifest.relations) {
    const leanixRelId = rel.external?.[LEANIX_PROVIDER]?.relationId
    if (leanixRelId) relationKeyToLeanixRelationId[rel.compositeKey] = leanixRelId
  }

  return { likec4IdToLeanixFactSheetId, relationKeyToLeanixRelationId }
}
