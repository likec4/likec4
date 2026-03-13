/**
 * @likec4/leanix-bridge
 *
 * Bridge from LikeC4 semantic model to LeanIX-shaped inventory artifacts.
 * Supports dry-run artifacts, optional LeanIX API sync (LeanixApiClient, syncToLeanix),
 * and Draw.io round-trip helpers (manifestToDrawioLeanixMapping). LikeC4 remains canonical.
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

export { LeanixApiClient } from './leanix-api-client'
export type { LeanixApiClientConfig, GraphQLResponse } from './leanix-api-client'
export { LeanixApiError } from './leanix-api-client'

export { planSyncToLeanix, syncToLeanix } from './sync-to-leanix'
export type {
  PlanSyncToLeanixOptions,
  SyncPlan,
  SyncPlanFactSheetEntry,
  SyncPlanRelationEntry,
  SyncPlanSummary,
  SyncToLeanixOptions,
  SyncToLeanixResult,
} from './sync-to-leanix'

export { manifestToDrawioLeanixMapping } from './drawio-leanix-roundtrip'
export type { DrawioLeanixMapping } from './drawio-leanix-roundtrip'
