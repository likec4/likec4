# @likec4/leanix-bridge

## 1.53.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.53.1

## 1.53.0

### Minor Changes

- [#2746](https://github.com/likec4/likec4/pull/2746) [`bb95d5a`](https://github.com/likec4/likec4/commit/bb95d5a601f630b0d8deb73ac4e83191b00a33c1) Thanks [@sraphaz](https://github.com/sraphaz)! - LeanIX bridge (dry-run) and Draw.io bridge-managed export profile

  **@likec4/leanix-bridge (new package)**

  - Identity manifest and LeanIX-shaped dry-run artifacts (no live sync)
  - Pure functions: `toBridgeManifest`, `toLeanixInventoryDryRun`, `toReport`
  - Configurable mapping (kinds → fact sheet types, relation kinds → relation types)
  - Outputs: manifest.json, leanix-dry-run.json, report.json
  - Use via custom generator; see package README

  **@likec4/generators**

  - Draw.io export profile `leanix`: adds bridge-managed metadata (bridgeManaged, likec4Id, likec4Kind, likec4ViewId, likec4ProjectId, likec4RelationId, optional leanixFactSheetType) for round-trip and LeanIX interoperability
  - New options: `profile`, `projectId`, `leanixFactSheetTypeByKind`
  - Export type `DrawioExportProfile`

  **likec4**

  - CLI: `likec4 export drawio --profile leanix` to emit bridge-managed .drawio files

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

- [#2746](https://github.com/likec4/likec4/pull/2746) [`7eb94fe`](https://github.com/likec4/likec4/commit/7eb94fe274068c0ab8724b691779d99a06c57a12) Thanks [@sraphaz](https://github.com/sraphaz)! - LeanIX API sync, Draw.io–LeanIX round-trip, E2E export drawio re-enabled

  **@likec4/leanix-bridge**

  - **Sync with LeanIX API**: `LeanixApiClient` (Bearer auth, rate limiting), `syncToLeanix(manifest, dryRun, client, options?)` to create/update fact sheets and relations; idempotent by name+type or optional custom attribute for likec4Id.
  - **Draw.io ↔ LeanIX**: `manifestToDrawioLeanixMapping(manifest)` for round-trip mapping (likec4Id → LeanIX fact sheet id, relation keys → LeanIX relation id) after sync.

  **E2E**

  - Re-enabled `likec4 export drawio` and `likec4 export drawio --profile leanix` tests: run CLI with `cwd` set to project root so workspace resolution finds likec4.config and .c4 sources in CI and locally.

### Patch Changes

- Updated dependencies [[`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/core@1.53.0
