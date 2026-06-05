---
'likec4': patch
---

Fix `export png`/`export jpg` failing in the Docker image with `browserType.launch: Executable doesn't exist`. The bundled Playwright and the installed Chromium browsers are now kept in sync. Fixes [#2961](https://github.com/likec4/likec4/issues/2961)
