# Language Services Instructions

- Public API surface lives in `src/common/LikeC4.ts` — the `LikeC4` class. Add new public methods here, not in subclasses.
- Node-only helpers (anything that imports `node:fs`, `node:path`, etc.) go in `src/node/index.ts`, NOT `src/common/`. The common module is also bundled for the browser.
- The class wraps `LikeC4Langium` services. Access points:
  - `modelBuilder.parseModel(projectId)` → `LikeC4Model.Parsed`
  - `modelBuilder.computeModel(projectId)` → `LikeC4Model.Computed`
  - `languageServices.layoutedModel(projectId)` → `LikeC4Model.Layouted`
- Do NOT import `@likec4/language-server` directly from consumers — go through this package's exports.
