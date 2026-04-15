# @likec4/docs-astro

## 1.55.2

## 1.55.1

## 1.55.0

## 1.54.0

## 1.53.0

### Patch Changes

- [#2768](https://github.com/likec4/likec4/pull/2768) [`cf5acbc`](https://github.com/likec4/likec4/commit/cf5acbcb8410cd66342e39a490fcfd9d91619916) Thanks [@sraphaz](https://github.com/sraphaz)! - feat(leanix-bridge): Phase 2 & 3, CLI, tooling docs (Draw.io + CLI)

  **@likec4/leanix-bridge**

  - Phase 2: `fetchLeanixInventorySnapshot`, `reconcileInventoryWithManifest` (inbound)
  - Phase 3: `buildDriftReport`, `impactReportFromSyncPlan`, `generateAdrFromReconciliation`, `generateAdrFromDriftReport`, `runGovernanceChecks`
  - Refactors: sync-to-leanix, to-bridge-manifest, to-leanix-inventory-dry-run, report, leanix-api-client, drawio-leanix-roundtrip

  **likec4 (CLI)**

  - `gen leanix-inventory-snapshot`, `gen leanix-reconcile`; `sync leanix` (dry-run / apply)
  - Shared LeanIX API client for snapshot and sync

  **@likec4/docs-astro**

  - Draw.io: Export profiles (default / leanix), bridge-managed metadata
  - CLI: `--profile` option for Export to DrawIO

  **@likec4/generators**

  - Parse Draw.io: compatibility with bridge-managed metadata

## 1.52.0

## 1.51.0

## 1.50.0

### Patch Changes

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: extended round-trip (export options, waypoints, view notation)

  - **Export:** Optional `GenerateDrawioOptions`: `layoutOverride`, `strokeColorByNodeId`, `strokeWidthByNodeId`. Emit element/edge customData as mxUserObject; emit edge waypoints (viewmodel points) as mxGeometry Array.
  - **Import:** Emit `// likec4.view.notation viewId '...'` from root `likec4ViewNotation`; emit `// <likec4.edge.waypoints>` with `// src|tgt [ [x,y], … ]` for edges with mxGeometry points (single and multi-diagram).
  - **Docs:** drawio.mdx updated with options, waypoints, customData, and comment blocks for view notation and edge waypoints.

## 1.49.0
