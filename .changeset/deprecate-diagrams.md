---
'likec4': patch
'@likec4/language-services': patch
'@likec4/language-server': patch
---

`diagrams()` is deprecated, use `layoutedModel()` instead. Manual layouts are applied by the views of the layouted model: `model.view(id).$layouted` returns the view with manual layout applied, `$view` returns the latest auto layout.
