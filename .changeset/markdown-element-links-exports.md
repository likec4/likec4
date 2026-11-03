---
'@likec4/core': patch
'@likec4/generators': patch
'@likec4/mcp': patch
'likec4': patch
---

Links to elements and views in Markdown (`[[cloud.api]]`, `[[view:index]]`) show the element or view title (or your label) in PlantUML, Draw.io and Markdown exports and in MCP tool results, instead of the raw `[[…]]`. Broken links show their target. The LikeC4 DSL export keeps the links as written.

In the model API, `description`, `summary` and `notes` resolve links to titles in `.text` and `.html` (`.md` stays as written), and `LikeC4Model.resolveMarkdownRef` and `resolveMarkdownRefs` from `@likec4/core/utils` resolve links for your own outputs.
