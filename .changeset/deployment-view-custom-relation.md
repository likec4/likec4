---
'@likec4/core': patch
---

Deployment views now apply `with { ... }` on relation predicates (title, color, line, technology and the rest), the same way element views do. A relation predicate with `with` also includes the relation on its own, instead of only working when another predicate had already included both ends.
