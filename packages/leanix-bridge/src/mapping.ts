/**
 * Configurable LeanIX mapping: LikeC4 kinds/relations/tags → LeanIX fact sheet types and fields.
 * No universal taxonomy; safe defaults, actor mapping conservative (skip or explicit).
 */

export interface LeanixMappingConfig {
  /** LikeC4 element kind → LeanIX fact sheet type */
  factSheetTypes?: Record<string, string>
  /** LikeC4 relationship kind → LeanIX relation type name */
  relationTypes?: Record<string, string>
  /** LikeC4 tags / metadata keys → LeanIX field names (optional) */
  metadataToFields?: Record<string, string>
}

/** Default mapping: conservative, skip actor unless explicitly set */
export const DEFAULT_LEANIX_MAPPING: Required<LeanixMappingConfig> = {
  factSheetTypes: {
    system: 'Application',
    container: 'ITComponent',
    component: 'ITComponent',
    actor: 'Provider',
  },
  relationTypes: {
    default: 'depends on',
  },
  metadataToFields: {
    title: 'name',
    description: 'description',
    technology: 'technology',
  },
}

export function mergeWithDefault(partial?: LeanixMappingConfig | null): Required<LeanixMappingConfig> {
  if (!partial) {
    return { ...DEFAULT_LEANIX_MAPPING }
  }
  return {
    factSheetTypes: { ...DEFAULT_LEANIX_MAPPING.factSheetTypes, ...partial.factSheetTypes },
    relationTypes: { ...DEFAULT_LEANIX_MAPPING.relationTypes, ...partial.relationTypes },
    metadataToFields: { ...DEFAULT_LEANIX_MAPPING.metadataToFields, ...partial.metadataToFields },
  }
}

export function getFactSheetType(
  likec4Kind: string,
  mapping: Required<LeanixMappingConfig>,
): string {
  return mapping.factSheetTypes[likec4Kind] ?? mapping.factSheetTypes['default'] ?? 'Application'
}

export function getRelationType(
  likec4Kind: string | null,
  mapping: Required<LeanixMappingConfig>,
): string {
  const kind = likec4Kind ?? 'default'
  return mapping.relationTypes[kind] ?? mapping.relationTypes['default'] ?? 'depends on'
}
