---
'@likec4/language-services': patch
'likec4': patch
---

The dev server (`likec4 start --project`, the Vite plugin with `includeProjects` or a `LikeC4` instance) ignores validation errors in projects it does not serve: such errors no longer block hot reload of the included projects and are not shown in the error overlay.

`getErrors`, `getWarnings` and `hasErrors` of `LikeC4` accept `{ scope: 'included' }` to check only documents of the included projects.
