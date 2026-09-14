---
'likec4': patch
'@likec4/core': patch
'@likec4/config': patch
'@likec4/diagram': patch
'@likec4/language-server': patch
'@likec4/layouts': patch
'@likec4/generators': patch
'likec4-vscode': patch
---

Add orthogonal edge routing: set `routing ortho` on a view, append it to `autoLayout`, or set `styles.defaults.view.routing` in the project config to draw relationships with horizontal and vertical segments and right-angle bends. Views without the option keep their curved edges, and saved manual layouts stay valid when routing changes.

In orthogonal views every edge label sits beside the middle of the longest straight run of its route and stays off the node boxes, whether the edge was laid out automatically, edited, or moved with a node; labels moved by hand keep their offset. Edited edges that run along the same line are drawn on their own tracks, 12 units apart, and edges that leave the same side of a node start from different points on that side. When an edge is edited under the default routing, its label now stays centred on the edge instead of jumping by half its size.
