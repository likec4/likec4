---
'@likec4/language-server': patch
'likec4': patch
---

Accept `.c4` files saved with a UTF-8 byte order mark (BOM). Such files, which some Windows editors write by default, failed to parse with `unexpected character` at offset 0.
