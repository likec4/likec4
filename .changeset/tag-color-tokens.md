---
'@likec4/style-preset': patch
'@likec4/styles': patch
'@likec4/diagram': patch
'@likec4/core': patch
---

The style preset ships smaller CSS: it defines only the color tokens tags need, per default tag color: `likec4.tag.<color>.bg`, `likec4.tag.<color>.bg.hover`, `likec4.tag.<color>.border` and `likec4.tag.<color>.text`.

`@likec4/core/styles` exports `isDefaultTagColor`.
