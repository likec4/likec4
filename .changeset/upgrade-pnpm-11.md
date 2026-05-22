---
'likec4': patch
---

Chore (contributors): upgrade to pnpm 11.

`packageManager` is now `pnpm@11.2.2` and `.tool-versions` was bumped accordingly. Workspace overrides, `allowBuilds`, and `patchedDependencies` were moved from the root `package.json` into `pnpm-workspace.yaml` (pnpm 11 layout).
