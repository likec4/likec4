---
'@likec4/language-server': patch
---

Elements and deployment nodes added with `extend` in a project that includes another one are now found by name inside another `extend` body, inside a `view of` view and through a deployed instance. Before, completion there could miss them, depending on which project was processed last.
