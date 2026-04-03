/**
 * Configurable LeanIX mapping: LikeC4 kinds/relations/tags → LeanIX fact sheet types and fields.
 * No universal taxonomy; safe defaults. Actor kind maps to 'Provider' unless overridden.
 */

/** Configurable mapping from LikeC4 kinds/relations/tags to LeanIX fact sheet and relation types. */
export interface LeanixMappingConfig {
  /** LikeC4 element kind → LeanIX fact sheet type */
  factSheetTypes?: Record<string, string>
  /** LikeC4 relationship kind → LeanIX relation type name */
  relationTypes?: Record<string, string>
  /** LikeC4 tags / metadata keys → LeanIX field names (optional) */
  metadataToFields?: Record<string, string>
}

/** Fallback when element kind is unknown (G25: named constant). */
export const FALLBACK_FACT_SHEET_TYPE = 'Application'

/** Fallback when relation kind is unknown (G25: named constant). */
export const FALLBACK_RELATION_TYPE = 'depends on'

const MAPPING_TOP_KEYS = new Set(['factSheetTypes', 'relationTypes', 'metadataToFields'])

/** True when `value` is a non-array object whose values are all strings. */
function isPlainObjectRecordOfStrings(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== 'string') {
      return false
    }
  }
  return true
}

/**
 * Parses and validates a partial LeanIX mapping from untrusted input (e.g. YAML/JSON).
 * Returns `null`/`undefined` unchanged. Throws with a clear message on invalid shape or unknown keys.
 */
export function parseLeanixMappingInput(input: unknown): LeanixMappingConfig | null | undefined {
  if (input === null || input === undefined) {
    return input
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('LeanIX mapping must be a plain object (not an array or primitive)')
  }
  const obj = input as Record<string, unknown>
  for (const key of Object.keys(obj)) {
    if (!MAPPING_TOP_KEYS.has(key)) {
      throw new Error(
        `LeanIX mapping has unknown key "${key}". Allowed: factSheetTypes, relationTypes, metadataToFields`,
      )
    }
  }
  if (obj['factSheetTypes'] !== undefined && !isPlainObjectRecordOfStrings(obj['factSheetTypes'])) {
    throw new Error(
      'LeanIX mapping "factSheetTypes" must be an object with string keys and string values',
    )
  }
  if (obj['relationTypes'] !== undefined && !isPlainObjectRecordOfStrings(obj['relationTypes'])) {
    throw new Error(
      'LeanIX mapping "relationTypes" must be an object with string keys and string values',
    )
  }
  if (obj['metadataToFields'] !== undefined && !isPlainObjectRecordOfStrings(obj['metadataToFields'])) {
    throw new Error(
      'LeanIX mapping "metadataToFields" must be an object with string keys and string values',
    )
  }
  return input as LeanixMappingConfig
}

/** Default mapping: actor → Provider; override factSheetTypes/relationTypes as needed */
export const DEFAULT_LEANIX_MAPPING: Required<LeanixMappingConfig> = {
  factSheetTypes: {
    system: 'Application',
    container: 'ITComponent',
    component: 'ITComponent',
    actor: 'Provider',
  },
  relationTypes: {
    default: FALLBACK_RELATION_TYPE,
  },
  metadataToFields: {
    title: 'name',
    description: 'description',
    technology: 'technology',
  },
}

/**
 * Merges partial mapping config with DEFAULT_LEANIX_MAPPING; returns a full Required<LeanixMappingConfig>.
 */
export function mergeWithDefault(partial?: LeanixMappingConfig | null): Required<LeanixMappingConfig> {
  const normalized = parseLeanixMappingInput(partial)
  const base = {
    factSheetTypes: { ...DEFAULT_LEANIX_MAPPING.factSheetTypes },
    relationTypes: { ...DEFAULT_LEANIX_MAPPING.relationTypes },
    metadataToFields: { ...DEFAULT_LEANIX_MAPPING.metadataToFields },
  }
  if (!normalized) {
    return base
  }
  return {
    factSheetTypes: { ...base.factSheetTypes, ...normalized.factSheetTypes },
    relationTypes: { ...base.relationTypes, ...normalized.relationTypes },
    metadataToFields: { ...base.metadataToFields, ...normalized.metadataToFields },
  }
}

/**
 * Returns LeanIX fact sheet type for a LikeC4 element kind.
 * Uses mapping.factSheetTypes[kind], then 'default', then FALLBACK_FACT_SHEET_TYPE.
 */
export function getFactSheetType(
  likec4Kind: string,
  mapping: Required<LeanixMappingConfig>,
): string {
  return (
    mapping.factSheetTypes[likec4Kind] ??
      mapping.factSheetTypes['default'] ??
      FALLBACK_FACT_SHEET_TYPE
  )
}

/**
 * Returns LeanIX relation type for a LikeC4 relationship kind.
 * Uses mapping.relationTypes[kind], then 'default', then FALLBACK_RELATION_TYPE.
 */
export function getRelationType(
  likec4Kind: string | null,
  mapping: Required<LeanixMappingConfig>,
): string {
  const kind = likec4Kind ?? 'default'
  return (
    mapping.relationTypes[kind] ??
      mapping.relationTypes['default'] ??
      FALLBACK_RELATION_TYPE
  )
}
