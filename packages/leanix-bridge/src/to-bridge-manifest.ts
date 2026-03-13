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

  const entities: Record<CanonicalId, ManifestEntity> = {}
  for (const el of model.elements()) {
    entities[el.id] = {
      canonicalId: el.id,
      external: {},
    }
  }

  const views: Record<ViewId, ManifestView> = {}
  for (const v of model.views()) {
    views[v.id] = {
      viewId: v.id,
      external: {},
    }
  }

  const relations: ManifestRelation[] = []
  for (const rel of model.relationships()) {
    const compositeKey = `${rel.source.id}|${rel.target.id}|${rel.id}`
    relations.push({
      relationId: rel.id,
      sourceFqn: rel.source.id,
      targetFqn: rel.target.id,
      compositeKey,
      external: {},
    })
  }

  return {
    manifestVersion: opts.manifestVersion,
    generatedAt: opts.generatedAt,
    bridgeVersion: opts.bridgeVersion,
    mappingProfile: opts.mappingProfile,
    projectId: model.projectId,
    entities,
    views,
    relations,
  }
}
