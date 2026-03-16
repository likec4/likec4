/**
 * Type guards for bridge artifacts (e.g. parsed JSON).
 * Keeps validation next to the type definitions (SRP).
 */

import type { BridgeManifest } from './contracts'
import type { LeanixInventorySnapshot } from './leanix-inventory-snapshot'

/**
 * Returns true if the value is a valid BridgeManifest shape (manifestVersion, projectId, entities, relations, views).
 */
export function isBridgeManifest(obj: unknown): obj is BridgeManifest {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'manifestVersion' in obj &&
    'projectId' in obj &&
    'entities' in obj &&
    'relations' in obj &&
    'views' in obj &&
    Array.isArray((obj as BridgeManifest).relations)
  )
}

/**
 * Returns true if the value is a valid LeanixInventorySnapshot shape (factSheets and relations arrays).
 */
export function isLeanixInventorySnapshot(obj: unknown): obj is LeanixInventorySnapshot {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'factSheets' in obj &&
    'relations' in obj &&
    Array.isArray((obj as LeanixInventorySnapshot).factSheets) &&
    Array.isArray((obj as LeanixInventorySnapshot).relations)
  )
}
