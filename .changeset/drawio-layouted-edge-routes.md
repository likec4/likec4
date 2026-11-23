---
'@likec4/generators': patch
---

Draw.io export follows the layouted edge routes: each edge gets waypoints along its path (with `curved=1`, or `edgeStyle=orthogonalEdgeStyle` for `routing ortho`) and anchors where the path meets its nodes, so parallel edges and their labels no longer sit on top of each other.
