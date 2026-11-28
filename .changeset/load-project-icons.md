---
'@likec4/vite-plugin': patch
'likec4': patch
---

Icons of the project are loaded together with its model, before the diagram is shown. Nodes no longer appear without icons first, and `likec4 export png` and `export jpg` no longer take screenshots before the icons are drawn.

The `likec4:icons` virtual module exports `loadProjectIcons(projectId)`, which loads the icon renderer of the project and returns it, ready to render without `Suspense`.
