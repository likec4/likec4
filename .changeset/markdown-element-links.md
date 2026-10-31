---
'@likec4/core': patch
'@likec4/language-server': patch
'likec4-vscode': patch
---

Link to elements and views from Markdown values: `[[cloud.api]]`, `[[cloud.api|label]]` and `[[view:index]]`. In the editor, typing `[[` suggests elements and views of the project, links are highlighted, broken links and unknown prefixes get a warning, and go to definition (Ctrl+click, F12) jumps to the element or view. Inside tables, write the label separator as `\\|`; a literal `[[` is written as `\\[[`.

In diagrams, links are shown as plain text for now.

Implements [#2804](https://github.com/likec4/likec4/issues/2804).
