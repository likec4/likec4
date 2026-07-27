---
"@likec4/language-server": patch
---

Avoid overlapping-area warnings when multiple projects intentionally include the same shared folder. Nested or partially overlapping include paths still warn because those can make file ownership ambiguous. Fixes [#2973](https://github.com/likec4/likec4/issues/2973).
