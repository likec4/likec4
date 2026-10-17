---
'@likec4/mcp': patch
---

`search-element` returns each result's `description`. Plain-text searches are now fuzzy and ranked by relevance: they match id, title, description and link path segments (except the first), tolerate typos, treat spaces, dashes and dots as word breaks, and require every word to match. `kind:`, `shape:`, `meta:` and `#tag` searches are unchanged.
