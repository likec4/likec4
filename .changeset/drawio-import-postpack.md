---
"@likec4/generators": patch
likec4: patch
"@likec4/devops": patch
"@likec4/language-server": patch
---

Draw.io export alignment; cross-platform postpack; language-server worker

- **Draw.io export:** Generators and CLI export to Draw.io (this PR is export-only; import will be proposed in a separate PR).
- **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
- **Language-server:** Safe error stringification in browser worker for oxlint.
