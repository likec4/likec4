---
"@likec4/generators": minor
"@likec4/docs-astro": patch
---

Draw.io: extended round-trip (export options, waypoints, view notation)

- **Export:** Optional `GenerateDrawioOptions`: `layoutOverride`, `strokeColorByNodeId`, `strokeWidthByNodeId`. Emit element/edge customData as mxUserObject; emit edge waypoints (viewmodel points) as mxGeometry Array.
- **Import:** Emit `// likec4.view.notation viewId '...'` from root `likec4ViewNotation`; emit `// <likec4.edge.waypoints>` with `// src|tgt [ [x,y], … ]` for edges with mxGeometry points (single and multi-diagram).
- **Docs:** drawio.mdx updated with options, waypoints, customData, and comment blocks for view notation and edge waypoints.
