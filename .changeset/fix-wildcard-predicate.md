---
"@likec4/core": patch
---

Fix predicate evaluation for wildcard expressions with `where`.
Previously, `include * where` was applying filter to the root elements (or children inside scoped view).
Now it applies the filter to all elements, to match the wildcard semantics.

Fixes [#2837](https://github.com/likec4/likec4/issues/2837)
