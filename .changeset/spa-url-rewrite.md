---
'likec4': patch
---

Single-project site URLs stay unchanged (no `/project/` in the address bar).

On multi-project sites, `/view`, `/embed`, and `/export` without `/project/:id` no longer open the first project (they are not found). The multi-project embed share link is `/project/:id/embed/...`.
