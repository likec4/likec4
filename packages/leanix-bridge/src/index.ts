/**
 * @likec4/leanix-bridge
 *
 * Bridge from LikeC4 semantic model to LeanIX-shaped inventory artifacts.
 * Dry-run only; no live LeanIX sync. LikeC4 remains canonical.
 */

export {
  BRIDGE_MANIFEST_VERSION,
  BRIDGE_VERSION,
} from './contracts'
export type {
  BridgeManifest,
  CanonicalId,
  ExternalId,
  ViewId as BridgeViewId,
  RelationId as BridgeRelationId,
  ManifestVersion,
  GeneratedAt,
  BridgeVersion,
  MappingProfile,
  Provider,
  ProviderExternalIds,
  ManifestEntity,
  ManifestView,
  ManifestRelation,
} from './contracts'

export {
  DEFAULT_LEANIX_MAPPING,
  mergeWithDefault,
  getFactSheetType,
  getRelationType,
} from './mapping'
export type { LeanixMappingConfig } from './mapping'

export type { BridgeModelInput, BridgeElementLike, BridgeRelationLike, BridgeViewLike } from './model-input'

export { toBridgeManifest } from './to-bridge-manifest'
export type { ToBridgeManifestOptions } from './to-bridge-manifest'

export { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'
export type {
  LeanixFactSheetDryRun,
  LeanixRelationDryRun,
  LeanixInventoryDryRun,
  ToLeanixInventoryDryRunOptions,
} from './to-leanix-inventory-dry-run'

export { toReport } from './report'
export type { BridgeReport } from './report'
