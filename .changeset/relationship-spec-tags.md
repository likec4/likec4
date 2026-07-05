---
'@likec4/core': minor
'@likec4/language-server': minor
---

Allow defining tags on relationship kinds in the `specification`, the same way as for element kinds. Tags are inherited by every relationship of that kind (merged with the relationship's own tags), so they can be used in view predicates like `where tag is #tcp`.

```likec4
specification {
  relationship https {
    #tcp
    head diamond
  }
  tag tcp
}
```

Closes [#2533](https://github.com/likec4/likec4/issues/2533)
