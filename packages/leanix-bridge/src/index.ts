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
  BridgeVersion,
  CanonicalId,
  ExternalId,
  GeneratedAt,
  ManifestEntity,
  ManifestRelation,
  ManifestVersion,
  ManifestView,
  MappingProfile,
  Provider,
  ProviderExternalIds,
  RelationId as BridgeRelationId,
  ViewId as BridgeViewId,
} from './contracts'

export {
  DEFAULT_LEANIX_MAPPING,
  getFactSheetType,
  getRelationType,
  mergeWithDefault,
} from './mapping'
export type { LeanixMappingConfig } from './mapping'

export type { BridgeElementLike, BridgeModelInput, BridgeRelationLike, BridgeViewLike } from './model-input'

export { toBridgeManifest } from './to-bridge-manifest'
export type { ToBridgeManifestOptions } from './to-bridge-manifest'

export { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'
export type {
  LeanixFactSheetDryRun,
  LeanixInventoryDryRun,
  LeanixRelationDryRun,
  ToLeanixInventoryDryRunOptions,
} from './to-leanix-inventory-dry-run'

export { toReport } from './report'
export type { BridgeReport } from './report'

export { LeanixApiClient } from './leanix-api-client'
export type { GraphQLResponse, LeanixApiClientConfig } from './leanix-api-client'
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
