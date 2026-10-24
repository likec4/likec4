---
'@likec4/core': patch
'@likec4/language-server': patch
'likec4': patch
---

Model diffs, see [discussion #1192](https://github.com/likec4/likec4/discussions/1192): new `diff` block, a named change set of the model (`remove` elements and relationships, `add` model elements, `extend` existing elements). The model stays as is: diffs are validated against it, and views can reference elements that a diff adds.
