---
'likec4': patch
'@likec4/language-services': patch
---

Improve `likec4 validate` CLI command:

- Fix exit code (now properly exits with 1 on validation failure)
- Add `--json` flag for structured JSON output
- Add `--file` flag to filter errors to specific files
- Add `--no-layout` flag to skip layout drift checks
- Add success/failure summary messages
- Add `--project` support for multi-project workspaces
