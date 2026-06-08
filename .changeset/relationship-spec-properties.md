---
'@likec4/core': minor
'@likec4/language-server': minor
---

Allow defining `title`, `description` and links on relationship kinds in the `specification`, the same way as for element kinds. These properties are inherited by every relationship of that kind and can be overridden per relationship.

```likec4
specification {
  relationship async {
    title 'Asynchronous'
    description 'Communication over a message broker'
    link https://example.com/async
  }
}
```

Closes [#2260](https://github.com/likec4/likec4/issues/2260)
