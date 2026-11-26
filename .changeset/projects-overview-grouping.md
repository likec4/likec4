---
'likec4': patch
---

The projects overview can hide projects by a metadata value, group projects by metadata, rank the groups with an `order` list, tint the frames with `groupBy.colors`, color a project from a metadata value, and draw orthogonal edges. Set `projectsOverview` in a project config. A project without the grouping key stays in its parent frame, or on the canvas.

The projects overview side panel can show or hide frames and edge bundles, show only one frame, search projects, highlight a project with its neighbors, and show edge counts between frames and per project. It also shows a color legend. The overview exports to the same formats as other views: PNG, JPG, DOT, D2, Mermaid, PlantUML and Draw.io. `webapp.exportFormats` controls the formats, and the overview offers a format only when every project enables it.

A large projects overview now uses reduced graphics, so zooming does not drop frames.
