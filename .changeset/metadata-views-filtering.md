---
'@likec4/core': patch
'@likec4/language-server': patch
---

Support `metadata` filtering in view predicates

- Filter elements and relations by metadata key existence (`where metadata.key`) or value (`where metadata.key = 'value'`)
- Works with `!=` for negation and supports `source.metadata` / `target.metadata` for relation participants
