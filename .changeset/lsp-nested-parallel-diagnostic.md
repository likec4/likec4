---
'@likec4/language-server': patch
---

Nested `parallel` blocks in dynamic views now produce a clear validation error (`Nested parallel blocks are not allowed`) instead of a cryptic parser error. The grammar is loosened to accept the nested form so the validator can attach a diagnostic to the inner block. Resolves #988.
