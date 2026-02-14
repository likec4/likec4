# feat(cli,playground,docs,generators): Export LikeC4 views to Draw.io

## Summary

This PR adds **export** of LikeC4 views to [Draw.io](https://draw.io) (`.drawio`) format. Users can export from the **CLI** (`likec4 export drawio`) and from the **Playground** (right-click on diagram → DrawIO → Export view / Export all). This allows editing diagrams in Draw.io and reusing them in tools that support the format.

**This PR does not include import.** Import from Draw.io will be proposed in a separate PR after this one is merged.

---

## What's in this PR

### 1. Generators (`@likec4/generators`)

- **`packages/generators/src/drawio/generate-drawio.ts`** — Exports a single view or multiple views to Draw.io XML. Maps LikeC4 elements (title, description, shape, color, relationships, etc.) to mxCell vertices/edges. Supports optional `layoutOverride`, `strokeColorByNodeId`, `strokeWidthByNodeId`, `edgeWaypoints`, and `compressed`.
- **`packages/generators/src/drawio/parse-drawio.ts`** — Used only for **round-trip comment parsing** (`parseDrawioRoundtripComments`): when re-exporting after a future import, layout and waypoints from comment blocks in `.c4` source can be applied. No import UI or CLI in this PR.
- **`packages/generators/src/drawio/index.ts`** — Public API: `generateDrawio`, `generateDrawioMulti`, `GenerateDrawioOptions`, plus `getAllDiagrams`, `parseDrawioRoundtripComments`, `parseDrawioToLikeC4`, `parseDrawioToLikeC4Multi` (for roundtrip and for the future import PR).
- **Tests:** `generate-drawio.spec.ts`, `parse-drawio.spec.ts`; snapshots in `__snapshots__/`.

### 2. CLI (`@likec4/likec4`)

- **`packages/likec4/src/cli/export/drawio/handler.ts`** — `likec4 export drawio [path]` with options: `--outdir, -o`, `--all-in-one`, `--roundtrip`, `--uncompressed`, `--project`, `--use-dot`.
- **`packages/likec4/src/cli/export/index.ts`** — Registers the drawio export command.

### 3. Playground

- DrawIO context menu **export only**: DrawioContextMenuProvider, DrawioContextMenuDropdown (Export view…, Export all…), useDrawioContextMenuActions (handleExport, handleExportAllViews; uses generateDrawio/generateDrawioMulti and parseDrawioRoundtripComments). DrawioContextMenu, drawio-events (DRAWIO_EXPORT_EVENT). **No Import item or file input in this PR.**
- Monaco: only **Export to DrawIO** action in editor context menu (no Import action). Integration in LanguageClientSync and routes as needed for export.

Playground exports are **uncompressed** by default so files open reliably in Draw.io desktop.

### 4. Documentation

- **`apps/docs/src/content/docs/tooling/drawio.mdx`** — Export only: mapping (LikeC4 → Draw.io), options, not preserved, multi-diagram, troubleshooting, re-export using comment blocks. No import sections.
- **`apps/docs/src/content/docs/tooling/cli.mdx`** — Export to DrawIO section only; no Import from DrawIO section. Intro mentions Export to DrawIO only.

### 5. Tests

- **`packages/likec4/src/drawio-demo-export-import.spec.ts`** — Export tests only; import/vice-versa test **skipped** in this PR.
- **`packages/likec4/src/drawio-tutorial-export-import.spec.ts`** — Export tests only; import and round-trip tests **skipped** in this PR.
- **`e2e/tests/drawio-playground.spec.ts`** — Asserts DrawIO menu shows **Export to DrawIO** (and Export all). No Import assertion. Run with `playwright.playground.config.ts` (playground on 5174); main e2e config ignores this test.

---

## What's not in this PR

- No `likec4 import drawio` command (no `packages/likec4/src/cli/import/`).
- No Playground "Import from DrawIO" menu item, file input, or Monaco Import action.
- No docs for importing from Draw.io.
- Import/round-trip tests in likec4 specs are **skipped**; enabled in the import PR.

---

## Post-review fixes (CodeRabbit)

Addresses CodeRabbit AI review (actionable + nitpicks):

### Actionable

- **parse-drawio.ts**: `stripHtml` now uses shared `decodeXmlEntities()` (covers `&apos;` and all five XML entities). UserObject `id` in constructed mxCell tag is escaped with `escapeXml(userObjId)`. `collectRoundtripForState` consolidated to a single pass over `idToFqn` where possible.
- **drawio handler**: Explicit guard when `--all-in-one` and zero views: warn and throw `ERR_NO_VIEWS_EXPORTED`. `ensureSingleProject()` only called when no `--project` is provided, so multi-project workspaces can use `--project`.
- **json handler**: `languageServices` created with `await using` so it is disposed on exit (file watchers/RPC cleaned up).
- **png handler**: `startTakeScreenshot` moved inside the per-project loop so timing reported is per-project, not cumulative.

### Nitpicks / cleanup

- **useWorkspaceId.ts**: Removed commented-out code and unused `extensionContext` import.
- **documentation-provider.ts**: Added exhaustiveness check (`const _exhaustive: never = node`) so new node types require a handler.
- **log**: `configureLogtape` now uses explicit generics instead of `any`; typo fix `gerErrorFromLogRecord` → `getErrorFromLogRecord`.
- **DrawioContextMenuProvider**: Typed `EMPTY_DRAWIO_SNAPSHOT`; stable `getSourceContent` via ref to avoid churn on every snapshot.
- **useDrawioContextMenuActions**: Download uses detached anchor (no appendChild/removeChild); dev-only `console.warn` when a view is skipped in `fillFromModelView`.
- **generate-drawio.ts**: Optional `modified?: string` in `GenerateDrawioOptions` and `wrapInMxFile` for deterministic output (tests/caching).

### Second batch (CodeRabbit follow-up)

- **parse-drawio.ts**: `getDecodedStyle` and `decodeRootStyleField` wrap `decodeURIComponent` in try/catch so malformed percent-encoding (e.g. `%ZZ`) does not abort parsing; on error return raw string (or undefined/empty). Ternary `titlePart` clarified with parentheses: `(desc || tech) ? ...`.
- **log (index.ts)**: Destructure config to exclude `sinks`/`loggers` from spread (`...restConfig`) so overrides are not misleading.
- **log (formatters.ts)**: Typo `errorMessge` → `errorMessage` in `appendErrorToMessage`; removed commented-out line.
- **DrawioContextMenuProvider**: `filesRef.current = files` moved into `useEffect([files])` for concurrent-safety.
- **drawio handler**: `exportParams` explicitly typed as `ExportDrawioParams`; single zero-views guard for both all-in-one and per-view modes.
- **png handler**: Logger prefix aligned with json: `createLikeC4Logger('c4:export')`.
- **generate-drawio.ts**: Helper `buildOptionsFromRoundtrip(viewId, roundtrip, overrides)` extracted; `buildDrawioExportOptionsForViews` parses source once and distributes options (parse-once optimization for many views).

---

## Checklist (contribution guidelines)

- [ ] I have read the latest [contribution guidelines](https://github.com/likec4/likec4/blob/main/CONTRIBUTING.md).
- [ ] I have rebased my branch onto `main` **before** creating this PR.
- [ ] My commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `docs:`).
- [ ] I have added/updated tests for export; import tests are skipped in this branch.
- [ ] I have run `pnpm test` and `pnpm typecheck` (and `pnpm test:e2e` for e2e); all pass.
- [ ] Documentation updated (drawio.mdx and cli.mdx for **export** only).
- [ ] A changeset has been added for user-facing packages if applicable.

---

## Notes for reviewers

- Export: one `.drawio` file per view by default; `--all-in-one` for all views as tabs; `--roundtrip` applies layout/waypoints from comment blocks; `--uncompressed` for Draw.io desktop compatibility.
- Playground exposes only Export actions in the DrawIO menu.
- Generators: parse-drawio is present for round-trip comments and for the upcoming import PR; no import entrypoints used here.
- E2E: drawio-playground test is excluded from main config (runs only with playground config on port 5174); screenshot diff tolerance and timeouts tuned for CI.

---

## Review context

The original DrawIO bidirectional work (branch `feat/drawio-bidirectional-playground`) was reviewed upstream in [likec4/likec4 PR #2593](https://github.com/likec4/likec4/pull/2593) — *Fix DrawIO CLI docs, refactor context menu, correct XML generation*. Review was done by @sraphaz at the request of @davydkov. This export-only PR is a split from that work; feedback from that review has been incorporated where applicable (e.g. CLI docs, context menu structure, XML generation). CodeRabbit AI review comments have been addressed in the “Post-review fixes” section above.
