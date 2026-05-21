---
'likec4': minor
---

Add `--public` option (alias `--public-dir`) to `likec4 build` and `likec4 start` for specifying a directory that Vite serves and copies as-is into the output (Vite's `publicDir`). Files in this directory are preserved in the build output, including when `--output-single-file` is used. Resolves #1941.
