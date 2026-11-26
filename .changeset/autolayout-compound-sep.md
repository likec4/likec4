---
'likec4': patch
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/layouts': patch
'@likec4/generators': patch
'likec4-vscode': patch
---

Add an optional third number to `autoLayout` that sets the space between top-level compounds, `autoLayout TopBottom 120 110 150`. A compound is an element shown with its children, a deployment node with its children, or a group. The space applies next to other compounds and elements on the same level, in element, dynamic and deployment views; compounds nested in another compound keep their spacing. Views without it keep their layout. Changing the layout direction or spacing in the diagram keeps a compound distance written in the source.
