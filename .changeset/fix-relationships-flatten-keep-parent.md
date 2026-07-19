---
'@likec4/core': patch
---

Relationships browser: keep the direct parent of leaf elements when flattening hierarchy. Previously a single-child chain was collapsed to "root + leaf", so a nested component was rendered as a direct child of a distant ancestor and its owner was not visible.
