---
'@likec4/core': patch
'@likec4/language-server': patch
---

Add notes to the elements and relationships using `with`. Example:

```
view {
  include
    some.element with {
      notes '''
        This is a note for some.element.
        It can contain multiple lines and **markdown** formatting.
      '''
    }
}
```

Relates to [#2567](https://github.com/likec4/likec4/issues/2567)
