---
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/layouts': patch
'@likec4/generators': patch
'likec4': patch
---

Deployment views support `rank` blocks, like element views. `rank same` can align nodes in different zones, for example a database and its replica: `rank same { prod.eu.db, prod.us.dbReplica }`. An instance listed in a `rank` block is no longer aligned with the other instances of its element. Writing a model back to DSL also prints `rank` rules of element views now, instead of failing.
