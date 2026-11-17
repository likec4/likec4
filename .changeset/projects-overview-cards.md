---
'@likec4/core': patch
'@likec4/diagram': patch
'@likec4/vite-plugin': patch
'likec4': patch
---

The projects overview page in a multi-project workspace is redesigned. Projects now open as cards by default, each showing the project's contact person, its folder in the workspace, and which projects it depends on or is used by; element, relationship and view counts appear when you hover a card. The page also has a table view, sorting and workspace totals; the previous diagram is still available as the Map view.

A single-project workspace gets the same look: the project's views as cards with diagram previews or as a table, with the project totals, sorting by name, folder or type, and the same search.

The projects page can now search inside every project: press `⌘K` or `/` to find elements and views across the whole workspace, grouped by project. Type `@name` to limit the search to one project; `kind:` and `#tag` work as in the diagram search.

`Overlay` from `@likec4/diagram/custom` accepts `motionPreset="lift"`: a short fade with an 8px drop instead of the scale-in, for full-screen palettes.

`likec4:projects` now includes each project's `contactPerson` from its config.

In dev mode, clicking a project's folder on its card opens the project config in your editor, and "go to source" in a diagram opens the element, relationship or view at its exact position.

Project cards flag views whose manual layout has drifted; hover the warning to see which views and jump to them.
