---
'@likec4/language-server': patch
---

Hex colors made of digits only and starting with zero, like `#000000` or `#012345`, are now accepted in custom colors and tag colors. Before, they were reported as invalid and the color was dropped.
