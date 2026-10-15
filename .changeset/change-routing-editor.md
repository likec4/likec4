---
'likec4': patch
'@likec4/core': patch
'@likec4/diagram': patch
'@likec4/language-server': patch
'likec4-vscode': patch
---

Switch edge routing between `spline` and `ortho` from the diagram editor's layout panel. The choice is written to the view source as the `routing` property or as the `autoLayout` routing parameter, and stays available for views with a manual layout. Changing the auto-layout direction no longer drops a routing parameter set on the `autoLayout` rule.
