---
'@likec4/language-server': patch
---

Fix references to elements and deployment nodes added with `extend` in a project that includes another one. In a workspace with several projects they failed to resolve, depending on file names for nested targets and always for top-level ones.
