---
'@likec4/style-preset': patch
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/layouts': patch
'@likec4/diagram': patch
'@likec4/generators': patch
'likec4': patch
'likec4-vscode': patch
---

Add `sizing` style property for elements. With `sizing fixed`, all elements of the same `size` are drawn with exactly the same width and height, regardless of title, description, icon or shape. Long titles and icons shrink to fit the element instead of making it grow. The default `sizing auto` keeps the current behavior, where `size` is the minimum size.

```likec4
specification {
  element service {
    style {
      size small
      sizing fixed
    }
  }
}
```
