---
'@likec4/core': patch
---

Elements whose markdown description has a list (or several paragraphs) no longer get extra width. List items and paragraphs used to be glued together into one long line when sizing the element, so items without spaces, like `first-item`, could not wrap.
