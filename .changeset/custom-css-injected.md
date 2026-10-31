---
'@likec4/config': patch
'@likec4/vite-plugin': patch
'@likec4/core': patch
'@likec4/diagram': patch
'likec4': patch
---

The files listed in `styles.customCss` are now read and their CSS is applied to diagrams. Before, the option was validated but had no effect.
