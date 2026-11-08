---
'@likec4/generators': patch
---

Mermaid export (`likec4 gen mermaid`) keeps the diagram's colors and line styles: each element gets the fill, border and text color of its LikeC4 color through `classDef`/`class`, and each relationship gets its line color and pattern through `linkStyle` (solid lines are drawn solid, dashed ones dashed, dotted ones dotted). Previously every node used Mermaid's default style and every edge was dotted.
