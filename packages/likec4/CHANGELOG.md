# likec4

## 1.53.1

### Patch Changes

- [#2832](https://github.com/likec4/likec4/pull/2832) [`302f020`](https://github.com/likec4/likec4/commit/302f020e4e892d94159255a876da0119f9c8d9c9) Thanks [@davydkov](https://github.com/davydkov)! - Add `list-icons` CLI command to list all available built-in icons with `--format text|json` and `--group` filter options

- [#2782](https://github.com/likec4/likec4/pull/2782) [`d0f38c7`](https://github.com/likec4/likec4/commit/d0f38c7422a4b46879ab744e514ea4d70f546e05) Thanks [@davydkov](https://github.com/davydkov)! - Add LikeC4 DSL Agent Skill enabling AI agents to write correct LikeC4 code without hallucinating syntax, resolves [#2636](https://github.com/likec4/likec4/issues/2636)

  To install LikeC4 skills into any project:

  ```bash
  npx skills add https://likec4.dev/
  ```

- [#2831](https://github.com/likec4/likec4/pull/2831) [`b442a71`](https://github.com/likec4/likec4/commit/b442a71cb4ae9614eecd472f36c43faabc793099) Thanks [@sraphaz](https://github.com/sraphaz)! - Harden `likec4:icons` virtual module literals for CodeQL (embedded dynamic `import`). Raise floors for transitive dependencies via root `pnpm.overrides` (lodash, path-to-regexp, picomatch, brace-expansion, bn.js, yaml, smol-toml, ajv, crypto-browserify chain, etc.).

- Updated dependencies []:
  - @likec4/core@1.53.1

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

- [#2785](https://github.com/likec4/likec4/pull/2785) [`eddfe46`](https://github.com/likec4/likec4/commit/eddfe462b49d8dd598db443259bc2ba0820b76f1) Thanks [@davydkov](https://github.com/davydkov)! - Fix logger initialization defaults and environment detection

- [#2790](https://github.com/likec4/likec4/pull/2790) [`9a3fa0b`](https://github.com/likec4/likec4/commit/9a3fa0bfd78dfbbd0fa9b26f2f872445c5b9ddcf) Thanks [@davydkov](https://github.com/davydkov)! - Improve `likec4 validate` CLI command:

  - Fix exit code (now properly exits with 1 on validation failure)
  - Add `--json` flag for structured JSON output
  - Add `--file` flag to filter errors to specific files
  - Add `--no-layout` flag to skip layout drift checks
  - Add success/failure summary messages
  - Add `--project` support for multi-project workspaces

- [#2733](https://github.com/likec4/likec4/pull/2733) [`22cde07`](https://github.com/likec4/likec4/commit/22cde07331a7d375d30c1220a1603576e8438735) Thanks [@purple52](https://github.com/purple52)! - Add `landingPage` configuration option to control the landing page behavior:

  - `redirect: true` to skip the landing page and go directly to the index view
  - `include` / `exclude` selectors to filter which views appear in the landing page grid

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

- Updated dependencies [[`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/core@1.53.0

## 1.52.0

### Minor Changes

- [#2667](https://github.com/likec4/likec4/pull/2667) [`2c6a43d`](https://github.com/likec4/likec4/commit/2c6a43da4552dbd40473effba65c7b04e165a7f3) Thanks [@m9810223](https://github.com/m9810223)! - Add `likec4 format` (alias `fmt`) CLI command for formatting `.c4` source files

  - `@likec4/language-server` — add `format()` method to `LikeC4LanguageServices` with `projectIds`/`documentUris` filtering and LSP formatting options
  - `@likec4/language-services` — add `format()` method to `LikeC4` facade, translating project name strings to `ProjectId`
  - `likec4` — add `format` CLI command with `--check` mode for CI, `--project` and `--files` filtering

### Patch Changes

- [#2705](https://github.com/likec4/likec4/pull/2705) [`4d579d6`](https://github.com/likec4/likec4/commit/4d579d6990bd3f59fb8420d2adb0e246fd9dfdcc) Thanks [@davydkov](https://github.com/davydkov)! - Disable implicit views by default. Auto-generated scoped views for elements without explicit views are no longer created unless `"implicitViews": true` is set in the project config. To restore the previous behavior, add `"implicitViews": true` to your `likec4.json` configuration.

- [#2731](https://github.com/likec4/likec4/pull/2731) [`7e0ac9b`](https://github.com/likec4/likec4/commit/7e0ac9bf1b61831287d444643230bb6196498a92) Thanks [@davydkov](https://github.com/davydkov)! - Add `--output` alias to all `likec4 gen` subcommands for consistency with `build` and `export` commands. Fixes [#2706](https://github.com/likec4/likec4/issues/2706)

- [#2665](https://github.com/likec4/likec4/pull/2665) [`6257147`](https://github.com/likec4/likec4/commit/6257147265d69972b4b4f2dc472d0b58a03bc607) Thanks [@ckeller42](https://github.com/ckeller42)! - Add search bar, navigation drawer, and theme toggle to overview page

  - Search for elements and views directly from the overview page via visible search bar or ⌘K
  - Browse all diagrams through sidebar navigation drawer with file/folder/list grouping
  - Toggle dark/light mode from the overview header
  - Navigate from search results to a diagram view with element focus

  Fixes [#1679](https://github.com/likec4/likec4/issues/1679)

- Updated dependencies [[`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/core@1.52.0

## 1.51.0

### Minor Changes

- [#2645](https://github.com/likec4/likec4/pull/2645) [`225d1a7`](https://github.com/likec4/likec4/commit/225d1a7163c6b6d8e50b0168be34679d4b52c537) Thanks [@m9810223](https://github.com/m9810223)! - Use MantineProvider's `forceColorScheme` for the `?theme=` URL parameter instead of `setColorScheme`.

  Theme preferences specified via the URL are no longer persisted to localStorage — the forced
  color scheme applies only while the `?theme=` parameter is present in the URL.

  The `theme` search param default changed from `'auto'` to `undefined`; the parameter is now
  optional and omitted from URLs when not explicitly set.

### Patch Changes

- [#2681](https://github.com/likec4/likec4/pull/2681) [`70e0f7d`](https://github.com/likec4/likec4/commit/70e0f7db20c0945d37a6b2f77ad9722abf4706ce) Thanks [@davydkov](https://github.com/davydkov)! - Add `likec4 lsp` CLI command to start the LikeC4 language server

- Updated dependencies []:
  - @likec4/core@1.51.0

## 1.50.0

### Patch Changes

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: CLI --roundtrip, Playground E2E, DrawioContextMenu getSourceContent

  - **CLI:** `likec4 export drawio --roundtrip` reads all `.c4`/`.likec4` files in the workspace, parses round-trip comment blocks (layout, stroke colors/widths, edge waypoints), and applies them when generating each view's `.drawio` file.
  - **Docs:** CLI reference updated with `--roundtrip` and `--all-in-one` options.
  - **Playground:** `DrawioContextMenu` component accepts optional `getSourceContent` for round-trip export when used outside the provider.
  - **E2E:** New Playwright config and test for Draw.io context menu in the Playground (`pnpm test:playground` from e2e/).

- [#2639](https://github.com/likec4/likec4/pull/2639) [`871f134`](https://github.com/likec4/likec4/commit/871f134911d3a1313c62fb002f2834e94dc305d0) Thanks [@davydkov](https://github.com/davydkov)! - Enable "Export to Draw.io" in the app's export menu — opens app.diagrams.net with the current diagram pre-loaded

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io export alignment; cross-platform postpack; language-server worker.

  - **Draw.io export:** Generators and CLI export views to Draw.io (.drawio); round-trip comment blocks (layout, stroke, waypoints) and postpack behavior only. No import/parser in this PR.
  - **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
  - **Language-server:** Safe error stringification in browser worker for oxlint.

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0

## 1.49.0

### Patch Changes

- [#2616](https://github.com/likec4/likec4/pull/2616) [`4a7c01c`](https://github.com/likec4/likec4/commit/4a7c01c9ee1e2d006f9002b0fed79cb5fdda9a6f) Thanks [@davydkov](https://github.com/davydkov)! - Add new `component` element shape

- [#2620](https://github.com/likec4/likec4/pull/2620) [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45) Thanks [@davydkov](https://github.com/davydkov)! - Internal restructuring for better maintainability:

  - `@likec4/language-services` - for cross-platform language services initialization
  - `@likec4/react` - bundled version of `@likec4/diagram`
  - `@likec4/vite-plugin` - to separate concerns

- [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300) Thanks [@davydkov](https://github.com/davydkov)! - Add review drifts feature to the compare panel, highlight drifts in the diagram and add drifts summary panel.

- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0

## 1.48.0

### Minor Changes

- [`cd71c00`](https://github.com/likec4/likec4/commit/cd71c00a36cfe3a065a578befe87f6b1d2d26a6d) Thanks [@ckeller42](https://github.com/ckeller42)! - Direct links to Relationship Views, thanks to @ckeller42 in [#2547](https://github.com/ckeller/likec4/pull/2547)

### Patch Changes

- [`ee4cdc2`](https://github.com/likec4/likec4/commit/ee4cdc29db81fddc54b401a8af954a352fdbb142) Thanks [@davydkov](https://github.com/davydkov)! - Enable D2/DOT/MMD/PUML pages when viewing multiple projects.
  Improve export page behavior.

- [`ec06c45`](https://github.com/likec4/likec4/commit/ec06c4530ef92bf466a54764d21dccad7c50cb59) Thanks [@davydkov](https://github.com/davydkov)! - Fix export to PNG of sequence diagrams, closes [#2532](https://github.com/likec4/likec4/issues/2532)

- [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546) Thanks [@davydkov](https://github.com/davydkov)! - Improved font loading performance by migrating to variable fonts and enhanced diagram bounds calculation with better edge handling

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0

## 1.47.0

### Patch Changes

- [`be5326a`](https://github.com/likec4/likec4/commit/be5326a029c4f295cdd2bcf34dfa4a928dd9b948) Thanks [@davydkov](https://github.com/davydkov)! - Updated MCP SDK

- [#2520](https://github.com/likec4/likec4/pull/2520) [`37f2777`](https://github.com/likec4/likec4/commit/37f27773e68cd28484930cd07f0e02ca36ac4532) Thanks [@davydkov](https://github.com/davydkov)! - Export to json format supports multiple projects, plus:

  - Added `--pretty` option for exporting indented JSON
  - Added `--skip-layout` option to skip layouts and return only computed models

- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0

## 1.46.4

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.4

## 1.46.3

### Patch Changes

- [#2495](https://github.com/likec4/likec4/pull/2495) [`faa3b86`](https://github.com/likec4/likec4/commit/faa3b86ac9a44d179e637ef65474410bd5f23524) Thanks [@davydkov](https://github.com/davydkov)! - Fallback to the first project in vite plugin, if `projectId` is not found, instead of erroring out. Closes [#2472](https://github.com/like-c4/likec4/issues/2472)

- Updated dependencies []:
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
