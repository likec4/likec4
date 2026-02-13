---
"@likec4/generators": patch
likec4: patch
"@likec4/devops": patch
"@likec4/language-server": patch
---

Draw.io export alignment; cross-platform postpack; language-server worker. No import code in this PR.

- **Draw.io export:** Generators and CLI export to Draw.io only (export-only; no parser/import or CLI `import drawio`; import planned in a follow-up PR).
- **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
- **Language-server:** Safe error stringification in browser worker for oxlint.
