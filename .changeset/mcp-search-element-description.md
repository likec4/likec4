---
'@likec4/mcp': patch
---

`search-element` returns each result's `description` and is now fuzzy and ranked by relevance. Plain words match name, title, id, description and link path segments (except the first) and tolerate typos. Words and `kind:`, `shape:`, `meta:` and `#tag` conditions can be combined and must all match, for example `kind:container #public checkout`.
