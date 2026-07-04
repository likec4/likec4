---
"@likec4/language-server": patch
---

Fix `EMFILE: too many open files, watch` crash in `likec4 serve`/`dev` on large repositories.

The file watcher now honors the project's `exclude` patterns from `likec4.config.json`, consistent with how the source scan already filters files. Previously the watcher descended into every directory regardless of `exclude` (it only skipped `node_modules`/`.git` and non-`.c4` files), so on repositories where `.c4` files are a small fraction of a large tree it could exhaust the OS file-watch limit and crash on startup.
