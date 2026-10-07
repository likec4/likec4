---
'@likec4/mcp': patch
---

`search-element` returns each result's `description`. Plain-text searches also match descriptions, treat spaces, dashes, underscores and dots as equal, and match a link's repo name exactly, so a search can return more hits than before.
