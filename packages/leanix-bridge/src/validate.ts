/**
 * Type guards for bridge artifacts (e.g. parsed JSON).
 * Keeps validation next to the type definitions (SRP).
 */

import type { BridgeManifest } from './contracts'
import type { LeanixInventorySnapshot } from './leanix-inventory-snapshot'

/**
 * Returns true if the value is a valid BridgeManifest shape (manifestVersion, generatedAt, bridgeVersion, mappingProfile, projectId, entities, relations, views).
 */
export function isBridgeManifest(obj: unknown): obj is BridgeManifest {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as BridgeManifest
  return (
    'manifestVersion' in obj &&
    'generatedAt' in obj &&
    'bridgeVersion' in obj &&
    'mappingProfile' in obj &&
    'projectId' in obj &&
    'entities' in obj &&
    'relations' in obj &&
    'views' in obj &&
    Array.isArray(o.relations)
  )
}

/**
 * Returns true if the value is a valid LeanixInventorySnapshot shape (generatedAt, factSheets and relations arrays).
 */
export function isLeanixInventorySnapshot(obj: unknown): obj is LeanixInventorySnapshot {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as LeanixInventorySnapshot
  return (
    'generatedAt' in obj &&
    typeof o.generatedAt === 'string' &&
    'factSheets' in obj &&
    'relations' in obj &&
    Array.isArray(o.factSheets) &&
    Array.isArray(o.relations)
  )
}
