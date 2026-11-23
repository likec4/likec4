---
'@likec4/core': patch
---

`isOrthoSpline` is now a type guard that also rejects input that is not a Graphviz spline of `1 + 3n` points, and `splineToPolyline` throws on such input and returns a non-empty polyline.
