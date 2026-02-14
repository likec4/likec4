# Cobertura E2E (DrawIO e export)

## Design e clean code (DRY, SOLID, KISS, YAGNI)

- **drawio-playground.spec.ts:** Constantes no topo (TUTORIAL_PATH, TIMEOUT_*, CANVAS_SELECTOR, EDITOR_SELECTOR, MENU_SELECTOR, RIGHT_CLICK_CANVAS, EDITOR_CLICK_POSITION); helpers com responsabilidade única: `canvas(page)`, `editor(page)`, `openDrawioContextMenu(page)`, `triggerDrawioDownload(page, menuItemLabel, downloadTimeout)`; zero duplicação nos fluxos de download; asserção explícita do path do download (fail-fast, sem branch silencioso).
- **static-navigation.spec.ts:** Helper `canvas(page)` e URL alinhada ao bootstrap (`/project/{project}/export/{viewId}/?padding=22`); `gotoViewAndAssertDiagram` usa apenas `expect(canvas(page)).toBeVisible({ timeout })` (um único ponto de espera pelo diagrama).
- **docs-smoke.spec.ts:** Constantes `TIMEOUT_PAGE` e URLs (`DOCS_HOME`, `DOCS_TOOLING_DRAWIO`, `DOCS_TOOLING_CLI`) num único nível de abstração; testes curtos e independentes.
- **likec4-cli-export-drawio.spec.ts:** Predicado nomeado `isDrawioFile(entry)`; variável `firstDrawioContent`; ordem determinística dos ficheiros (sort por nome) antes de ler o primeiro; constantes `outDir` e `sourceDir`.
- **likec4-cli-build.spec.ts:** Constantes `sourceDir`, `outDir`, `outDirSingleFile` no topo, homogeneidade com export-drawio; comandos construídos a partir delas.

Homogeneidade: Playwright specs usam `test.describe` + `test()`/`test.beforeEach`; Vitest CLI specs usam `test.concurrent` e `$`; seletores e URLs partilhados com o bootstrap quando aplicável. Revisão “Uncle Bob” high-end: funções pequenas e com um único propósito, nomes que revelam intenção, sem magic numbers, asserções explícitas e testes determinísticos. Integridade (varredura global): CLI export drawio: ExportDrawioParams, isSourceFile, ROUNDTRIP_IGNORED_DIRS; Playground: OnDrawioExportError, CollectViewModelsOptions; CLI: applyLoggerConfig; E2E: type Page.

## Cenários implementados

- [x] Playground: menu DrawIO (Export to DrawIO, Export all).
- [x] Playground: workspace carrega e diagrama visível.
- [x] Playground: Export to DrawIO dispara download com conteúdo .drawio válido.
- [x] Playground: Export all dispara download .drawio.
- [x] Playground: menu do editor (Monaco) mostra Export to DrawIO.
- [x] CLI: `likec4 export drawio` produz ficheiro com `<mxfile` (Vitest em `e2e/src/likec4-cli-export-drawio.spec.ts`).

## Pendentes (opcional)

- [x] Static site: navegação entre views (`tests/static-navigation.spec.ts`; corre com o config principal, likec4 start 5173).
- [x] Docs: smoke de páginas principais (`tests/docs-smoke.spec.ts`; `pnpm test:docs` com `playwright.docs.config.ts`, porta 4321).

## Como rodar

- **Playwright (playground):** `cd e2e && pnpm test:playground` (requer `pnpm install` e, em CI, tarballs).
- **Playwright (static nav):** `cd e2e && pnpm test` (inclui `static-navigation.spec.ts` após bootstrap).
- **Playwright (docs smoke):** `cd e2e && pnpm test:docs`.
- **Vitest (incl. CLI export drawio):** `cd e2e && pnpm typecheck`.
