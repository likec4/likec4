---
'@likec4/language-server': patch
---

`locate` now honours `property` for elements and deployment nodes: it returns the range of that property (for example `technology` or `description`, in the body or inline after the name) instead of the element name, and falls back to the name when the property is not declared.
