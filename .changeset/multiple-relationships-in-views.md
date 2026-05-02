---
'@likec4/core': minor
'@likec4/language-server': minor
---

Support expanding merged relationships into separate edges with the `multiple` flag. Set `multiple true` on a relationship kind in `specification`, or per-view via `with { multiple true }`, to show each relationship as its own edge with its own label instead of merging them into a single `[...]` edge. Resolves [#663](https://github.com/likec4/likec4/issues/663).
