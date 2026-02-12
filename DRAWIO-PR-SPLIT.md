# DrawIO feature split: Export (PR1) and Import (PR2)

This document describes how the DrawIO bidirectional feature is split into two pull requests so that **export** (stable) can be merged first and **import** (experimental, needs more testing) follows in a separate, focused PR.

## PR1 – Export only (`feat/drawio-export`)

**Scope:** Export LikeC4 views to Draw.io (`.drawio`) via CLI and Playground. No import.

- **Included:** `@likec4/generators` drawio (generate + parse for roundtrip), CLI `likec4 export drawio`, Playground DrawIO menu with **Export view** and **Export all** only, docs (export sections only), export-only tests (import tests skipped), e2e asserting Export to DrawIO in menu.
- **Not included:** CLI `import drawio`, Playground Import item, import-only documentation.

## PR2 – Import only (`feat/drawio-import`)

**Scope:** Import Draw.io files into LikeC4 source (`.c4`) via CLI and Playground. Depends on PR1 (generators/export already on `main`).

- **Included:** CLI `likec4 import drawio <input>`, Playground Import menu item and Monaco action, import documentation, import/round-trip tests (unskipped), e2e for Import in menu if desired.
- **Not included:** No new generator code; `parse-drawio` is already present from PR1.

## Branch strategy

- **PR1:** Branch `feat/drawio-export` contains only export-related code; open PR against `main`.
- **PR2:** After PR1 is merged, branch `feat/drawio-import` from `main` and add only import-related code; open PR against `main`.

PR description files (English, aligned with repo guidelines):

- **PR1:** `.pr-description-export.md` — use as body for the Export-only PR.
- **PR2:** `.pr-description-import.md` — use as body for the Import-only PR.
