---
'@likec4/language-server': patch
'likec4': patch
---

Export the syntax tree types as `ast` (type-only) from `likec4` and `@likec4/language-server`, so tools built on the language services can type the nodes they read, for example `import type { ast } from 'likec4'` and `ast.Relation`.
