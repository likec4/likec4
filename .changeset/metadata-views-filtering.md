---
'@likec4/core': minor
'@likec4/language-server': minor
---

Support `metadata` filtering in view predicates

- Filter elements and relations by metadata key existence (`where metadata.key`) or value (`where metadata.key = 'value'`)
- Works with `!=` for negation and supports `source.metadata` / `target.metadata` for relation participants
