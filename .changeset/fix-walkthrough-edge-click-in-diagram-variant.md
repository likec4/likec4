---
'@likec4/diagram': patch
---

Fix crash when clicking another step during a walkthrough in a `diagram`-variant dynamic view. The click handler asserted the ReactFlow edge type, which is `seq-step` only in the `sequence` variant, and now checks the step id instead. Fixes [#3201](https://github.com/likec4/likec4/issues/3201).
