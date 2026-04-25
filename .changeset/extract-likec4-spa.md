---
'likec4': patch
'@likec4/vite-plugin': patch
---

Extract web app into a separate `@likec4/spa` package, decoupling it from the CLI for better modularity, faster builds and smaller bundles — resolves [#2689](https://github.com/likec4/likec4/issues/2689)

The new package also improves DX by eliminating the dependency "magic" that existed in the CLI package
