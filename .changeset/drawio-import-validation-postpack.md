---
"@likec4/generators": patch
likec4: patch
"@likec4/devops": patch
---

Draw.io import alignment, CI validate pipeline, cross-platform postpack

- **Draw.io import:** Parser aligned with export: container title cells merged into container (no extra element); `container=1` → system, children → component; `fillOpacity`/`likec4Opacity`; view title/description/notation from root cell; multi-diagram uses same logic and merged `containerIdToTitle`/`byId`.
- **CLI:** `likec4 import drawio` described as experimental (import path not yet fully validated).
- **CI:** PR checks run single `pnpm validate` job (generate → typecheck → core type tests → lint → build → lint:package → test); quality gate and e2e depend on it.
- **DevOps:** New `likec4ops postpack` copies packed tgz to `package.tgz` (cross-platform); all packages use it instead of `cp ... || true` so `pnpm validate` works on Windows.
- **Repo:** `pnpm validate` script and pre-push hook (when pushing to main); AGENTS.md documents validate.
