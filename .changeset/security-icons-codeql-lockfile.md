---
'likec4': patch
---

Harden `likec4:icons` virtual module literals for CodeQL (embedded dynamic `import`). Raise floors for transitive dependencies via root `pnpm.overrides` (lodash, path-to-regexp, picomatch, brace-expansion, bn.js, yaml, smol-toml, ajv, crypto-browserify chain, etc.).
