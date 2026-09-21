---
'@likec4/language-server': patch
---

Keep visual style edits inside the selected view when it has no style rules, including dynamic views and empty views that extend another view. This prevents duplicate shared styles and unintended changes to other views.

Fixes [#3265](https://github.com/likec4/likec4/issues/3265).
