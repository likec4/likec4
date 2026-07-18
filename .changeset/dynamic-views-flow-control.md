---
'@likec4/language-server': patch
'@likec4/core': patch
'@likec4/diagram': patch
'@likec4/layouts': patch
'@likec4/generators': patch
---

Flow control in dynamic views. Besides `parallel`, steps can now be grouped into flow blocks (each with an optional title):

- `opt`, `loop` and `break` blocks
- `alt` with `when` / `else` branches
- `try` / `catch` / `finally` blocks

```likec4
dynamic view example {
  customer -> app 'opens app'
  alt {
    when 'authorized' {
      app -> api 'requests data'
    }
    else 'not authorized' {
      app -> customer 'shows login'
    }
  }
}
```

Sequence diagrams render these blocks as nested frames, and actors stay visible when zoomed in.

> [!NOTE]
> Flow control blocks are experimental — syntax and rendering may change. We are looking for your feedback in [discussions](https://github.com/likec4/likec4/discussions)!
