---
'@likec4/language-server': patch
---

Faster model updates while editing: parsed and computed models are cached and rebuilt only for affected projects.

- Elements, views and styles with validation errors are now excluded from the model (previously they could leak into diagrams). Duplicated global styles and views are reported and excluded, as the order of documents is not deterministic.
- Fix project importing elements from another project not picking up changes in the imported project.
