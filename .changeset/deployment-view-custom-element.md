---
'@likec4/core': patch
---

Deployment views now apply `with { ... }` on element predicates (title, color, description and the rest), the same way element views do. An element predicate with `with` also includes the matched node on its own, instead of silently dropping it when no other predicate had included it.
