# @likec4/lsp

## 1.60.1

### Patch Changes

- [#3496](https://github.com/likec4/likec4/pull/3496) [`615a6d1`](https://github.com/likec4/likec4/commit/615a6d194299331fe361ae52087e638b590389a7) Thanks [@davydkov](https://github.com/davydkov)! - TypeScript and JavaScript project configs (`likec4.config.ts`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.js`) are no longer experimental. They are now loaded with [jiti](https://github.com/unjs/jiti) instead of esbuild: loading no longer writes temporary `*.bundled_*.mjs` files next to your config, the VSCode extension loads configs faster and is smaller, and `esbuild` is no longer installed with `likec4`, `@likec4/lsp` and `@likec4/mcp`. If you use `@likec4/config` or `@likec4/language-server` directly, install `jiti` instead of `bundle-require` and `esbuild` to load non-JSON configs.
  
  Fixed: changes to a project config (for example, title or styles) were not applied to the model until the project files were edited.

## 1.60.0

No changes in this release.

## 1.59.4

No changes in this release.

## 1.59.3

## 1.59.2

## 1.59.1

## 1.59.0

## 1.57.1

## 1.57.0

## 1.56.0

## 1.55.1

### Patch Changes

- [#2896](https://github.com/likec4/likec4/pull/2896) [`d628461`](https://github.com/likec4/likec4/commit/d6284616ba5fefbd510fdbf6460238f9be94ab79) Thanks [@davydkov](https://github.com/davydkov)! - Fix programmatic config (`likec4.config.ts`) not being loaded in VSCode extension and standalone LSP

## 1.55.0

## 1.54.0

### Minor Changes

- [#2843](https://github.com/likec4/likec4/pull/2843) [`47c4363`](https://github.com/likec4/likec4/commit/47c436316e45ef7c2575e7eaaa5e0889615df202) Thanks [@davydkov](https://github.com/davydkov)! - Add standalone `@likec4/lsp` package for third-party editor integrations (Neovim, Zed, etc.)

  - Self-contained, fully-bundled CJS language server with zero runtime dependencies
  - Fixes [#2840](https://github.com/likec4/likec4/issues/2840)
