---
'@likec4/generators': patch
---

`toDSL()` and `writeDSL()` now escape backslashes in generated strings, so values such as `C:\tools\` or `regex \d+` are read back unchanged instead of corrupting the output.
