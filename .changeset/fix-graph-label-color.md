---
'@likec4/diagram': patch
---

Fix Graph view element labels invisible in light mode. Labels were using `--likec4-palette-hiContrast`, which is the high-contrast color relative to an element's fill, so they appeared near-white on a light canvas. They now use the canvas-appropriate default text color.
