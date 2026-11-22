---
'@likec4/core': patch
'@likec4/generators': patch
---

The Markdown export writes the project and view titles as one-line headings and escapes Markdown characters in them, so a title such as `Release #`, `Q&A <draft>` or one with a line break is shown as written. `escapeInlineMarkdown` is now exported from `@likec4/core/utils`.
