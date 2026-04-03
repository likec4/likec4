# @likec4/generators

## 1.53.1

### Patch Changes

- [#2825](https://github.com/likec4/likec4/pull/2825) [`b6f6a35`](https://github.com/likec4/likec4/commit/b6f6a35aff00e141c8f0a04686579b08773c2d7b) Thanks [@kavishkartha05](https://github.com/kavishkartha05)! - Fix LikeC4 generator not emitting element name in DSL output
  Fixes [#2815](https://github.com/likec4/likec4/issues/2815)
- Updated dependencies []:
  - @likec4/config@1.53.1
  - @likec4/core@1.53.1
  - @likec4/log@1.53.1

## 1.53.0

### Minor Changes

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

### Patch Changes

- [#2685](https://github.com/likec4/likec4/pull/2685) [`d4aa31a`](https://github.com/likec4/likec4/commit/d4aa31ac1c1f14381a35f59d00880e75c7a4332e) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: infer shape person on re-import for round-trip fidelity

  - **Import:** `inferKind()` now treats `shape=actor` as actor (alongside `umlactor` and `shape=person`). `inferShape()` returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get `actor 'title'` and an explicit `style { shape person }` in the emitted .c4 source. Round-trip: export may emit person as `shape=actor` or `shape=umlActor`; import recognizes both via `inferKind()` and `inferShape()` so cells become actor with shape person.

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

- Updated dependencies [[`22cde07`](https://github.com/likec4/likec4/commit/22cde07331a7d375d30c1220a1603576e8438735), [`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/config@1.53.0
  - @likec4/core@1.53.0
  - @likec4/log@1.53.0

## 1.52.0

### Patch Changes

- [#2685](https://github.com/likec4/likec4/pull/2685) [`a80d2e8`](https://github.com/likec4/likec4/commit/a80d2e85c8c508236262156d4ef45e28750c295c) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: infer shape person on re-import for round-trip fidelity

  - **Import:** `inferKind()` now treats `shape=actor` as actor (alongside `umlactor` and `shape=person`). `inferShape()` returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get `actor 'title'` and an explicit `style { shape person }` in the emitted .c4 source. Round-trip: export may emit person as `shape=actor` or `shape=umlActor`; import recognizes both via `inferKind()` and `inferShape()` so cells become actor with shape person.

- [#2682](https://github.com/likec4/likec4/pull/2682) [`aab9343`](https://github.com/likec4/likec4/commit/aab9343f0e149d978915a13429ff367dc284937b) Thanks [@davydkov](https://github.com/davydkov)! - Fix Draw.io export rendering elements with `shape person` as ellipses instead of person/actor shapes. Fixes [#2679](https://github.com/likec4/likec4/issues/2679).

- Updated dependencies [[`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/core@1.52.0
  - @likec4/log@1.52.0

## 1.51.0

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.51.0
  - @likec4/log@1.51.0

## 1.50.0

### Minor Changes

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: extended round-trip (export options, waypoints, view notation)

  - **Export:** Optional `GenerateDrawioOptions`: `layoutOverride`, `strokeColorByNodeId`, `strokeWidthByNodeId`. Emit element/edge customData as mxUserObject; emit edge waypoints (viewmodel points) as mxGeometry Array.
  - **Import:** Emit `// likec4.view.notation viewId '...'` from root `likec4ViewNotation`; emit `// <likec4.edge.waypoints>` with `// src|tgt [ [x,y], … ]` for edges with mxGeometry points (single and multi-diagram).
  - **Docs:** drawio.mdx updated with options, waypoints, customData, and comment blocks for view notation and edge waypoints.

### Patch Changes

- [#2639](https://github.com/likec4/likec4/pull/2639) [`871f134`](https://github.com/likec4/likec4/commit/871f134911d3a1313c62fb002f2834e94dc305d0) Thanks [@davydkov](https://github.com/davydkov)! - Enable "Export to Draw.io" in the app's export menu — opens app.diagrams.net with the current diagram pre-loaded

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io export alignment; cross-platform postpack; language-server worker.

  - **Draw.io export:** Generators and CLI export views to Draw.io (.drawio); round-trip comment blocks (layout, stroke, waypoints) and postpack behavior only. No import/parser in this PR.
  - **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
  - **Language-server:** Safe error stringification in browser worker for oxlint.

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0
  - @likec4/log@1.50.0

## 1.49.0

### Patch Changes

- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0
  - @likec4/log@1.49.0

## 1.48.0

### Patch Changes

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0
  - @likec4/log@1.48.0

## 1.47.0

### Patch Changes

- [#2521](https://github.com/likec4/likec4/pull/2521) [`7e89693`](https://github.com/likec4/likec4/commit/7e896936c27bf9cb3e5409d6c1c36dc6d73c2870) Thanks [@davydkov](https://github.com/davydkov)! - - Generate Mermaid with expanded Node Shapes (v11.3.0+)
  - Improve labels in PlantUML
  - Support new shapes: `bucket` and `document`
- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0

## 1.46.4

### Patch Changes

- [#2509](https://github.com/likec4/likec4/pull/2509) [`9b93f25`](https://github.com/likec4/likec4/commit/9b93f25a568f4adba9bce414c0a776ed447c6676) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix generated PlantUML diagrams for unsupported names, [#2307](https://github.com/likec4/likec4/issues/2307)

- Updated dependencies []:
  - @likec4/core@1.46.4

## 1.46.3

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
