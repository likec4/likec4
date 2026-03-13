---
'@likec4/config': patch
'@likec4/vite-plugin': patch
'likec4': patch
---

Add `landingPage` configuration option to control the landing page behavior:

- `redirect: true` to skip the landing page and go directly to the index view
- `include` / `exclude` selectors to filter which views appear in the landing page grid