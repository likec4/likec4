---
'@likec4/core': patch
'@likec4/diagram': patch
'likec4': patch
---

The projects overview page in a multi-project workspace is redesigned. Projects now open as cards by default, each showing element, relationship and view counts and which projects it depends on or is used by. The page also has a table view, sorting and workspace totals; the previous diagram is still available as the Map view.

The projects page can now search inside every project: press `⌘K` or `/` to find elements and views across the whole workspace, grouped by project. Type `@name` to limit the search to one project; `kind:` and `#tag` work as in the diagram search.

`Overlay` from `@likec4/diagram/custom` accepts `motionPreset="lift"`: a short fade with an 8px drop instead of the scale-in, for full-screen palettes.
