---
'@likec4/config': patch
'@likec4/language-server': patch
'likec4': patch
'@likec4/lsp': patch
'@likec4/mcp': patch
'likec4-vscode': patch
---

TypeScript and JavaScript project configs (`likec4.config.ts`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.js`) are no longer experimental. They are now loaded with [jiti](https://github.com/unjs/jiti) instead of esbuild: loading no longer writes temporary `*.bundled_*.mjs` files next to your config, the VSCode extension loads configs faster and is smaller, and `esbuild` is no longer installed with `likec4`, `@likec4/lsp` and `@likec4/mcp`. If you use `@likec4/config` or `@likec4/language-server` directly, install `jiti` instead of `bundle-require` and `esbuild` to load non-JSON configs.

Fixed: changes to a project config (for example, title or styles) were not applied to the model until the project files were edited.
