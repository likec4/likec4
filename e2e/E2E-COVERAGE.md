# E2E coverage (DrawIO and export)

## Design and clean code (DRY, SOLID, KISS, YAGNI)

- **drawio-playground.spec.ts:** Constants at the top (TUTORIAL_PATH, TIMEOUT_*, CANVAS_SELECTOR, EDITOR_SELECTOR, MENU_SELECTOR, RIGHT_CLICK_CANVAS, EDITOR_CLICK_POSITION); helpers with single responsibility: `canvas(page)`, `editor(page)`, `openDrawioContextMenu(page)`, `triggerDrawioDownload(page, menuItemLabel, downloadTimeout)`; no duplication in download flows; explicit assertion of download path (fail-fast, no silent branch).
- **static-navigation.spec.ts:** Helper `canvas(page)` and URL aligned with bootstrap (`/project/{project}/export/{viewId}/?padding=22`); `gotoViewAndAssertDiagram` uses only `expect(canvas(page)).toBeVisible({ timeout })` (single wait point for the diagram).
- **docs-smoke.spec.ts:** Constants `TIMEOUT_PAGE` and URLs (`DOCS_HOME`, `DOCS_TOOLING_DRAWIO`, `DOCS_TOOLING_CLI`) at a single abstraction level; short, independent tests.
- **likec4-cli-export-drawio.spec.ts:** Named predicate `isDrawioFile(entry)`; variable `firstDrawioContent`; deterministic file order (sort by name) before reading the first; constants `outDir` and `sourceDir`.
- **likec4-cli-build.spec.ts:** Constants `sourceDir`, `outDir`, `outDirSingleFile` at the top, homogeneity with export-drawio; commands built from them.

Homogeneity: Playwright specs use `test.describe` + `test()`/`test.beforeEach`; Vitest CLI specs use `test.concurrent` and `$`; selectors and URLs shared with bootstrap when applicable. High-end “Uncle Bob” review: small functions with a single purpose, names that reveal intent, no magic numbers, explicit assertions and deterministic tests. Integrity (global sweep): CLI export drawio: ExportDrawioParams, isSourceFile, ROUNDTRIP_IGNORED_DIRS; Playground: OnDrawioExportError, CollectViewModelsOptions; CLI: applyLoggerConfig; E2E: type Page.

## Implemented scenarios

- [x] Playground: DrawIO menu (Export to DrawIO, Export all).
- [x] Playground: workspace loads and diagram is visible.
- [x] Playground: Export to DrawIO triggers download with valid .drawio content.
- [x] Playground: Export all triggers .drawio download.
- [x] Playground: editor (Monaco) menu shows Export to DrawIO.
- [x] CLI: `likec4 export drawio` produces file with `<mxfile` (Vitest in `e2e/src/likec4-cli-export-drawio.spec.ts`).

## Pending (optional)

- [x] Static site: navigation between views (`tests/static-navigation.spec.ts`; runs with main config, likec4 start 5173).
- [x] Docs: smoke test for main pages (`tests/docs-smoke.spec.ts`; `pnpm test:docs` with `playwright.docs.config.ts`, port 4321).

## How to run

- **Playwright (playground):** `cd e2e && pnpm test:playground` (requires `pnpm install` and, in CI, tarballs).
- **Playwright (static nav):** `cd e2e && pnpm test` (includes `static-navigation.spec.ts` after bootstrap).
- **Playwright (docs smoke):** `cd e2e && pnpm test:docs`.
- **Vitest (incl. CLI export drawio):** `cd e2e && pnpm typecheck`.
