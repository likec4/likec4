import type {
  BridgeManifest,
  CanonicalId,
  ManifestEntity,
  ManifestRelation,
  ManifestView,
  ViewId,
} from './contracts'
import {
  BRIDGE_MANIFEST_VERSION,
  BRIDGE_VERSION,
} from './contracts'
import type { BridgeModelInput } from './model-input'

/** Optional overrides when building a bridge manifest (versions, timestamp, mapping profile). */
export interface ToBridgeManifestOptions {
  manifestVersion?: string
  generatedAt?: string
  bridgeVersion?: string
  mappingProfile?: string
}

const defaultOptions: Omit<Required<ToBridgeManifestOptions>, 'generatedAt'> = {
  manifestVersion: BRIDGE_MANIFEST_VERSION,
  bridgeVersion: BRIDGE_VERSION,
  mappingProfile: 'default',
}

/** Builds manifest entities map from model elements (canonicalId + empty external). */
function buildManifestEntities(model: BridgeModelInput): Record<CanonicalId, ManifestEntity> {
  const entities: Record<CanonicalId, ManifestEntity> = {}
  for (const el of model.elements()) {
    entities[el.id] = { canonicalId: el.id, external: {} }
  }
  return entities
}

/** Builds manifest views map from model views (viewId + empty external). */
function buildManifestViews(model: BridgeModelInput): Record<ViewId, ManifestView> {
  const views: Record<ViewId, ManifestView> = {}
  for (const v of model.views()) {
    views[v.id] = { viewId: v.id, external: {} }
  }
  return views
}

/** Builds manifest relations array from model relationships (compositeKey + empty external). */
function buildManifestRelations(model: BridgeModelInput): ManifestRelation[] {
  const relations: ManifestRelation[] = []
  for (const rel of model.relationships()) {
    relations.push({
      relationId: rel.id,
      sourceFqn: rel.source.id,
      targetFqn: rel.target.id,
      compositeKey: `${rel.source.id}|${rel.target.id}|${rel.id}`,
      external: {},
    })
  }
  return relations
}

/**
 * Produces the identity manifest from a LikeC4 model (canonical IDs + placeholders for external IDs).
 * Pure function; no live API calls.
 */
export function toBridgeManifest(
  model: BridgeModelInput,
  options: ToBridgeManifestOptions = {},
): BridgeManifest {
  const opts: Required<ToBridgeManifestOptions> = {
    ...defaultOptions,
    ...options,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  }

  return {
    manifestVersion: opts.manifestVersion,
    generatedAt: opts.generatedAt,
    bridgeVersion: opts.bridgeVersion,
    mappingProfile: opts.mappingProfile,
    projectId: model.projectId,
    entities: buildManifestEntities(model),
    views: buildManifestViews(model),
    relations: buildManifestRelations(model),
  }
}
