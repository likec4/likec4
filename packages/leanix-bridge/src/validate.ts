/**
 * Type guards for bridge artifacts (e.g. parsed JSON).
 * Keeps validation next to the type definitions (SRP).
 * Nested shapes are validated to avoid false positives (G2, G3).
 */

import type { BridgeManifest, ManifestEntity, ManifestRelation, ManifestView } from './contracts'
import type {
  LeanixFactSheetSnapshotItem,
  LeanixInventorySnapshot,
  LeanixRelationSnapshotItem,
} from './leanix-inventory-snapshot'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isManifestEntity(value: unknown): value is ManifestEntity {
  if (!isRecord(value)) return false
  return typeof value['canonicalId'] === 'string'
}

function isManifestView(value: unknown): value is ManifestView {
  if (!isRecord(value)) return false
  return typeof value['viewId'] === 'string'
}

function isManifestRelation(value: unknown): value is ManifestRelation {
  if (!isRecord(value)) return false
  return (
    typeof value['relationId'] === 'string' &&
    typeof value['sourceFqn'] === 'string' &&
    typeof value['targetFqn'] === 'string' &&
    typeof value['compositeKey'] === 'string'
  )
}

function isLeanixFactSheetSnapshotItem(value: unknown): value is LeanixFactSheetSnapshotItem {
  if (!isRecord(value)) return false
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['type'] === 'string'
  )
}

function isLeanixRelationSnapshotItem(value: unknown): value is LeanixRelationSnapshotItem {
  if (!isRecord(value)) return false
  return (
    typeof value['sourceFactSheetId'] === 'string' &&
    typeof value['targetFactSheetId'] === 'string' &&
    typeof value['type'] === 'string'
  )
}

/**
 * Returns true if the value is a valid BridgeManifest shape (manifestVersion, generatedAt, bridgeVersion, mappingProfile, projectId, entities, relations, views)
 * and nested entities/views/relations match expected shapes.
 */
export function isBridgeManifest(obj: unknown): obj is BridgeManifest {
  if (!isRecord(obj)) return false
  if (
    typeof obj['manifestVersion'] !== 'string' ||
    typeof obj['generatedAt'] !== 'string' ||
    typeof obj['bridgeVersion'] !== 'string' ||
    typeof obj['mappingProfile'] !== 'string' ||
    typeof obj['projectId'] !== 'string'
  ) {
    return false
  }
  const entities = obj['entities']
  if (typeof entities !== 'object' || entities === null || Array.isArray(entities)) return false
  for (const v of Object.values(entities)) {
    if (!isManifestEntity(v)) return false
  }
  const views = obj['views']
  if (typeof views !== 'object' || views === null || Array.isArray(views)) return false
  for (const v of Object.values(views)) {
    if (!isManifestView(v)) return false
  }
  const relations = obj['relations']
  if (!Array.isArray(relations)) return false
  for (const r of relations) {
    if (!isManifestRelation(r)) return false
  }
  return true
}

/**
 * Returns true if the value is a valid LeanixInventorySnapshot shape (generatedAt, factSheets and relations arrays)
 * and each fact sheet/relation item has required fields.
 */
export function isLeanixInventorySnapshot(obj: unknown): obj is LeanixInventorySnapshot {
  if (!isRecord(obj)) return false
  if (typeof obj['generatedAt'] !== 'string') return false
  if (obj['workspaceId'] !== undefined && typeof obj['workspaceId'] !== 'string') return false
  if (!Array.isArray(obj['factSheets'])) return false
  for (const fs of obj['factSheets']) {
    if (!isLeanixFactSheetSnapshotItem(fs)) return false
  }
  if (!Array.isArray(obj['relations'])) return false
  for (const rel of obj['relations']) {
    if (!isLeanixRelationSnapshotItem(rel)) return false
  }
  return true
}
