---
"@likec4/language-server": patch
---

Remove workspace locks in ProjectsManager, as they lead to race conditions during extension activation. Fixes [#2466](https://github.com/likec4/likec4/issues/2466)
