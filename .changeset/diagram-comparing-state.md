---
'@likec4/diagram': patch
'likec4': patch
---

Comparing the manual layout with the latest auto layout is now a dedicated diagram mode. Closing the comparison, navigating to another view or printing always returns to the manual layout. This also fixes the VS Code preview, which kept showing the next view in auto layout after you navigated away while comparing. The comparison is no longer restored after a page reload.

`DiagramApi` gets `startCompare()` and `endCompare()`, and `toggleFeature()` now accepts only `'ReadOnly'`. Replace `toggleFeature('CompareWithLatest')` with these methods.
