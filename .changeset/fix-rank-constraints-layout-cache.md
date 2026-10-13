---
'@likec4/core': patch
---

Fix `rank` constraints having no effect when added, changed or removed in an existing view: the view is now re-laid out instead of reusing the cached layout. Fixes [#3211](https://github.com/likec4/likec4/issues/3211)
