---
'likec4-vscode': patch
---

Fix VSCode extension packaging to include all runtime dependencies (bundle-require, esbuild, load-tsconfig). The language server failed to start with "Cannot find package" errors because `pnpm ls -P` didn't list deps that were hoisted through devDependencies.
