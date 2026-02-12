---
"@likec4/generators": patch
likec4: patch
"@likec4/devops": patch
"@likec4/language-server": patch
---

Draw.io import alignment with export; cross-platform postpack; language-server worker

- **Draw.io import:** Parser aligned with export (container title merge, container=1 → system, fillOpacity/likec4Opacity, view title/description/notation from root cell). CLI `import drawio` described as experimental.
- **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
- **Language-server:** Safe error stringification in browser worker for oxlint.
