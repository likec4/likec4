---
'@likec4/language-server': patch
---

fix: `layoutedModel()` now applies manual layouts

`layoutedModel()` used `layoutAllViews()`, which returns fresh auto-layouts and ignores manual layouts. As a result, consumers such as the `codegen react` CLI command produced views without the manual layout applied. It now uses `diagrams()`, which merges manual layouts via `withLayoutType()`.
