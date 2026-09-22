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

Add orthogonal edge routing to draw relationships with horizontal and vertical segments. Set `routing ortho` in a view, append `ortho` to `autoLayout`, or set `styles.defaults.view.routing` in the project configuration. The default remains `spline`. Changing routing preserves saved node positions and connection control points.

Place automatic labels beside long straight segments, avoiding nodes, other labels, and relationship lines where space permits. Labels update after layout and node moves. Manually positioned labels retain their position or offset during editing.

Separate shared segments of edited orthogonal edges into tracks with a target spacing of 12 diagram units. Track shifts also separate connection points along node borders, subject to the space available at each endpoint.

Keep edited edge labels centered under spline routing, preventing the initial jump by half the label's size.
