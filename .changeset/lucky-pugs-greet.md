---
'@likec4/diagram': patch
---

Redesigned the sequence walkthrough outline. The current step is lifted onto its own card with a larger label, the participants it connects, and its notes rendered inline instead of as a collapsing block. Nested fragments now read as depth: the `loop` / `par` / `alt` / `try` you are standing inside is framed and tinted in the same colour the canvas draws that frame with, levels above it step back in contrast, saturation and surface tone, and levels below it show as an indent and a hairline in their own colour. The recession flattens again as the walkthrough leaves a branch. A breadcrumb above the list names the fragments the current step is nested in, and the header shows the step position with a progress meter.
