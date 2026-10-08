---
'@likec4/diagram': patch
---

Fix long metadata values in the element details dialog not being truncated with an ellipsis, and show the full value in a tooltip on hover without the tooltip being hidden behind the backdrop or clipped by the dialog. This also keeps long descriptions from being clipped at the edge of the dialog when the element has a long metadata value. Fixes [#3279](https://github.com/likec4/likec4/issues/3279)
