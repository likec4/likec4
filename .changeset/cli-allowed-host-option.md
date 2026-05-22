---
'likec4': patch
---

Add `--allowed-host` option to `likec4 start` (`serve` / `dev`) for scoping which hostnames are allowed to access the dev server (Vite's `server.allowedHosts`). Can be repeated. When omitted, all hosts are allowed (current behaviour). Resolves #1650.
