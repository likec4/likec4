---
'@likec4/core': patch
---

Fix `include * -> X where …` and `include X -> * where …` dropping relationships that start or end at an element nested inside `X`. They now show up connected to `X`, like they do without `where`.
