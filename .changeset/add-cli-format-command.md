---
'@likec4/language-server': minor
'@likec4/language-services': minor
'likec4': minor
---

Add `likec4 format` (alias `fmt`) CLI command for formatting `.c4` source files

- `@likec4/language-server` — add `format()` method to `LikeC4LanguageServices` with `projectIds`/`documentUris` filtering and LSP formatting options
- `@likec4/language-services` — add `format()` method to `LikeC4` facade, translating project name strings to `ProjectId`
- `likec4` — add `format` CLI command with `--check` mode for CI, `--project` and `--files` filtering
