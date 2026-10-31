---
'@likec4/layouts': patch
'@likec4/diagram': patch
'@likec4/style-preset': patch
'likec4': patch
---

Relationship labels are measured with the diagram font (IBM Plex Sans) during layout, so the space reserved for a label matches the rendered label exactly and labels no longer overlap or leave extra gaps. Long labels wrap by width into balanced lines instead of by character count.

In the relationships browser and relationship details, labels are laid out together with elements: they no longer overlap each other, and every relationship goes through its label.

Elements are measured the same way: an element keeps the width of its size and grows in height only when its title, technology and description do not fit. Technology is always shown on a single line.

The style preset exports `EdgeLabelMetrics`, `ElementNodeMetrics` and `DefaultFontFamily` from `@likec4/style-preset/defaults`, the metrics used by both the label styles and the layouts.
