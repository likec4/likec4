/**
 * Type guards for bridge artifacts (e.g. parsed JSON).
 * Keeps validation next to the type definitions (SRP).
 */

import type { BridgeManifest } from './contracts'
import type { LeanixInventorySnapshot } from './leanix-inventory-snapshot'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Returns true if the value is a valid BridgeManifest shape (manifestVersion, generatedAt, bridgeVersion, mappingProfile, projectId, entities, relations, views).
 */
export function isBridgeManifest(obj: unknown): obj is BridgeManifest {
  if (!isRecord(obj)) return false
  return (
    typeof obj.manifestVersion === 'string' &&
    typeof obj.generatedAt === 'string' &&
    typeof obj.bridgeVersion === 'string' &&
    typeof obj.mappingProfile === 'string' &&
    typeof obj.projectId === 'string' &&
    typeof obj.entities === 'object' &&
    obj.entities !== null &&
    !Array.isArray(obj.entities) &&
    typeof obj.views === 'object' &&
    obj.views !== null &&
    !Array.isArray(obj.views) &&
    Array.isArray(obj.relations)
  )
}

/**
 * Returns true if the value is a valid LeanixInventorySnapshot shape (generatedAt, factSheets and relations arrays).
 */
export function isLeanixInventorySnapshot(obj: unknown): obj is LeanixInventorySnapshot {
  if (!isRecord(obj)) return false
  return (
    typeof obj.generatedAt === 'string' &&
    (obj.workspaceId === undefined || typeof obj.workspaceId === 'string') &&
    Array.isArray(obj.factSheets) &&
    Array.isArray(obj.relations)
  )
}
