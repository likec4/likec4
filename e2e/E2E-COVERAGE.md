# Cobertura E2E (DrawIO e export)

## Cenários implementados

- [x] Playground: menu DrawIO (Export to DrawIO, Export all).
- [x] Playground: workspace carrega e diagrama visível.
- [x] Playground: Export to DrawIO dispara download com conteúdo .drawio válido.
- [x] Playground: Export all dispara download .drawio.
- [x] Playground: menu do editor (Monaco) mostra Export to DrawIO.
- [x] CLI: `likec4 export drawio` produz ficheiro com `<mxfile` (Vitest em `e2e/src/likec4-cli-export-drawio.spec.ts`).

## Pendentes (opcional)

- [ ] Static site: navegação entre views.
- [ ] Docs: smoke de páginas principais.

## Como rodar

- **Playwright (playground):** `cd e2e && pnpm test:playground` (requer `pnpm install` e, em CI, tarballs).
- **Vitest (incl. CLI export drawio):** `cd e2e && pnpm typecheck`.
