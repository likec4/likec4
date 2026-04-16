---
'@likec4/generators': patch
'likec4': patch
---

Isolate Draw.io export dependencies into a lazy-loaded bundle chunk, reducing initial JS load by ~134 KB. The drawio code now only loads when the user clicks "Export to Draw.io". Fixes [#2689](https://github.com/likec4/likec4/issues/2689)
