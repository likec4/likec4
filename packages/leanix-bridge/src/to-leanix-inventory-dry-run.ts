import { mergeWithDefault, getFactSheetType, getRelationType } from './mapping'
import type { LeanixMappingConfig } from './mapping'
import type { BridgeModelInput } from './model-input'

/** Single LeanIX fact sheet in dry-run shape (no IDs from live API) */
export interface LeanixFactSheetDryRun {
  type: string
  likec4Id: string
  name: string
  description?: string
  technology?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

/** Single LeanIX relation in dry-run shape */
export interface LeanixRelationDryRun {
  type: string
  likec4RelationId: string
  sourceLikec4Id: string
  targetLikec4Id: string
  title?: string
}

/** Dry-run inventory: fact sheets and relations as would be sent to LeanIX, without live IDs */
export interface LeanixInventoryDryRun {
  generatedAt: string
  projectId: string
  mappingProfile: string
  factSheets: LeanixFactSheetDryRun[]
  relations: LeanixRelationDryRun[]
}

export interface ToLeanixInventoryDryRunOptions {
  mapping?: LeanixMappingConfig | null
  mappingProfile?: string
  generatedAt?: string
}

/**
 * Produces LeanIX-shaped inventory artifacts (fact sheets + relations) from a LikeC4 model.
 * Pure function; no live API. Use for dry-run and planning.
 */
export function toLeanixInventoryDryRun(
  model: BridgeModelInput,
  options: ToLeanixInventoryDryRunOptions = {},
): LeanixInventoryDryRun {
  const mapping = mergeWithDefault(options.mapping)
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const mappingProfile = options.mappingProfile ?? 'default'

  const factSheets: LeanixFactSheetDryRun[] = []
  for (const el of model.elements()) {
    const fsType = getFactSheetType(el.kind, mapping)
    const meta = el.getMetadata()
    factSheets.push({
      type: fsType,
      likec4Id: el.id,
      name: el.title,
      description: typeof meta.description === 'string' ? meta.description : undefined,
      technology: el.technology ?? (meta.technology as string) ?? undefined,
      tags: el.tags.length > 0 ? [...el.tags] : undefined,
      metadata: Object.keys(meta).length > 0 ? { ...meta } : undefined,
    })
  }

  const relations: LeanixRelationDryRun[] = []
  for (const rel of model.relationships()) {
    const relType = getRelationType(rel.kind, mapping)
    relations.push({
      type: relType,
      likec4RelationId: rel.id,
      sourceLikec4Id: rel.source.id,
      targetLikec4Id: rel.target.id,
      title: rel.title ?? rel.kind ?? undefined,
    })
  }

  return {
    generatedAt,
    projectId: model.projectId,
    mappingProfile,
    factSheets,
    relations,
  }
}
