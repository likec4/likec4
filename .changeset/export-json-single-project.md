---
'likec4': patch
---

`likec4 export json` writes a workspace with a single named project once, as one model, instead of twice. Sources outside that project are skipped with a warning, as they were never exported. See [#3572](https://github.com/likec4/likec4/issues/3572).
