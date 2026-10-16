---
'@likec4/config': patch
---

Fix project config with `styles.customCss` being rejected with `Invalid input at styles.customCss`, which made the whole config (name, theme, defaults) be ignored. Fixes [#3285](https://github.com/likec4/likec4/issues/3285)
