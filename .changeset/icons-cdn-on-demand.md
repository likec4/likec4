---
'@likec4/vite-plugin': patch
'likec4': patch
'@likec4/log': patch
'@likec4/vscode-preview': patch
---

Load icons on demand from CDN instead of bundling all icon components, reducing bundle size. Icons are resolved from local cache, then `@likec4/icons` package, then fetched from `icons.like-c4.dev`.
