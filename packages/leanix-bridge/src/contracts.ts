/**
 * Canonical bridge contracts for LikeC4 ↔ LeanIX interoperability.
 * LikeC4 remains the semantic source of truth; external IDs are provider-scoped.
 * Uses readFileSync (not require) so when bundled into likec4 CLI the bundler
 * does not emit require('../package.json') which fails in the tarball layout.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dir = dirname(fileURLToPath(import.meta.url))
function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(_dir, '..', 'package.json'), 'utf8')) as { version?: string }
    return pkg.version ?? '0.1.0'
  } catch {
    const pkg = JSON.parse(readFileSync(join(_dir, '..', '..', 'package.json'), 'utf8')) as { version?: string }
    return pkg.version ?? '0.1.0'
  }
}
/** Single source of truth: must match package.json version. */
export const BRIDGE_VERSION: string = readVersion()

/** Semantic anchor: LikeC4 FQN (e.g. cloud.backend.api) */
export type CanonicalId = string

/** Provider-scoped external identifier (e.g. LeanIX factSheetId) */
export type ExternalId = string

/** LikeC4 view id (e.g. index, saas, landscape.overview) */
export type ViewId = string

/** LikeC4 relation id; for composite key use sourceFqn|targetFqn|relationId */
export type RelationId = string

/** Version of the manifest schema */
export type ManifestVersion = string

/** ISO timestamp when the artifact was generated */
export type GeneratedAt = string

/** Version of the bridge that produced the artifact */
export type BridgeVersion = string

/** Name or id of the mapping profile used */
export type MappingProfile = string

/** Provider name (e.g. leanix, drawio) */
export type Provider = string

/** External IDs for a single provider */
export interface ProviderExternalIds {
  factSheetId?: string
  externalId?: string
  [key: string]: string | undefined
}

/** Entity entry in the manifest: canonical id + optional external IDs per provider */
export interface ManifestEntity {
  canonicalId: CanonicalId
  external?: Partial<Record<Provider, ProviderExternalIds>>
}

/** View entry in the manifest */
export interface ManifestView {
  viewId: ViewId
  external?: Partial<Record<Provider, Record<string, string>>>
}

/** Relation entry: composite key and optional external relation id */
export interface ManifestRelation {
  relationId: RelationId
  sourceFqn: CanonicalId
  targetFqn: CanonicalId
  compositeKey: string
  external?: Partial<Record<Provider, { relationId?: string; [key: string]: string | undefined }>>
}

/** Identity manifest: canonical IDs and provider-scoped external IDs */
export interface BridgeManifest {
  manifestVersion: ManifestVersion
  generatedAt: GeneratedAt
  bridgeVersion: BridgeVersion
  mappingProfile: MappingProfile
  projectId: string
  entities: Record<CanonicalId, ManifestEntity>
  views: Record<ViewId, ManifestView>
  relations: ManifestRelation[]
}

export const BRIDGE_MANIFEST_VERSION = '1.0'

/** Provider identifier for LeanIX (single source of truth for external.leanix). */
export const LEANIX_PROVIDER = 'leanix' as const
