---
'likec4': patch
'@likec4/language-services': patch
---

`likec4 validate --file` now counts every file matched by the filter in `filteredFiles`, including files with no diagnostics. It previously counted only files that carried errors, so a clean matched file reported `filteredFiles: 0`.
