---
'@likec4/mcp': patch
---

`batch-read-elements` now returns `links` and `sourceLocation` for each element, matching `read-element`. Reading those for many elements no longer needs one call per element.
