---
'@likec4/language-server': patch
'@likec4/config': patch
'likec4': patch
---

Disable implicit views by default. Auto-generated scoped views for elements without explicit views are no longer created unless `"implicitViews": true` is set in the project config. To restore the previous behavior, add `"implicitViews": true` to your `likec4.json` configuration.
