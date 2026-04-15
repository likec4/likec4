# likec4-vscode

## 1.55.1

### Patch Changes

- [#2896](https://github.com/likec4/likec4/pull/2896) [`d628461`](https://github.com/likec4/likec4/commit/d6284616ba5fefbd510fdbf6460238f9be94ab79) Thanks [@davydkov](https://github.com/davydkov)! - Fix programmatic config (`likec4.config.ts`) not being loaded in VSCode extension and standalone LSP

## 1.55.0

### Patch Changes

- [#2880](https://github.com/likec4/likec4/pull/2880) [`dd6de6e`](https://github.com/likec4/likec4/commit/dd6de6e8d3b302dd94c6f23b67d9026bca4f16ee) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix external links in VSCode preview opening blank page instead of browser ([#2422](https://github.com/likec4/likec4/issues/2422))

- [#2877](https://github.com/likec4/likec4/pull/2877) [`51adb85`](https://github.com/likec4/likec4/commit/51adb85ad1097cdd4c95f9082533c8b33b124a42) Thanks [@davydkov](https://github.com/davydkov)! - Extract MCP server and tools to `@likec4/mcp` package. This will allow us to reuse MCP server and tools in other projects, and also will make the codebase cleaner and more modular.

- [#2861](https://github.com/likec4/likec4/pull/2861) [`9687f89`](https://github.com/likec4/likec4/commit/9687f8974309de08001db3699e8712c7beac2b07) Thanks [@davydkov](https://github.com/davydkov)! - Add `likec4.exclude` VS Code setting to exclude files and folders from LikeC4 processing via glob patterns

## 1.54.0

### Patch Changes

- [#2826](https://github.com/likec4/likec4/pull/2826) [`0a4af22`](https://github.com/likec4/likec4/commit/0a4af22540239b5ec95f32f039a1cc230fb84940) Thanks [@davydkov](https://github.com/davydkov)! - Improve navigation from preview panel to sources by showing editor in a different tab group (deterministically).

## 1.53.0

### Patch Changes

- [#2785](https://github.com/likec4/likec4/pull/2785) [`eddfe46`](https://github.com/likec4/likec4/commit/eddfe462b49d8dd598db443259bc2ba0820b76f1) Thanks [@davydkov](https://github.com/davydkov)! - Restore Markdown syntax highlighting in triple-quoted strings

- [#2773](https://github.com/likec4/likec4/pull/2773) [`f4698a6`](https://github.com/likec4/likec4/commit/f4698a61129c26eadd0b73acfcff3f81f85e99fe) Thanks [@davydkov](https://github.com/davydkov)! - Add configurable Node.js path for language server runtime

- [`2c8ed1c`](https://github.com/likec4/likec4/commit/2c8ed1c3cc0caa2ed45be14035156294afa68eb4) Thanks [@davydkov](https://github.com/davydkov)! - Fix web extension failing to start language server. Closes [#2702](https://github.com/likec4/likec4/issues/2702)

## 1.52.0

### Patch Changes

- [#2713](https://github.com/likec4/likec4/pull/2713) [`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3) Thanks [@davydkov](https://github.com/davydkov)! - Remove deprecated ManualLayoutV1 and related migration command

## 1.51.0

## 1.50.0

## 1.49.0

### Patch Changes

- [`d039d0b`](https://github.com/likec4/likec4/commit/d039d0b2dd0ce98e4ec96498877bb60e2c921829) Thanks [@davydkov](https://github.com/davydkov)! - Fixed "reload" screen in VSCode preview

- [#2624](https://github.com/likec4/likec4/pull/2624) [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7) Thanks [@davydkov](https://github.com/davydkov)! - LikeC4 Extension registers MCP server definition, enabling native MCP support in VSCode

## 1.48.0

### Minor Changes

- [`3049b78`](https://github.com/likec4/likec4/commit/3049b78701df485fff6fae2f0ac9ee08873872c2) Thanks [@davydkov](https://github.com/davydkov)! - Add Projects Overview to VSCode Extension. Improve navigation in preview panel.

## 1.47.0

### Patch Changes

- [`817d159`](https://github.com/likec4/likec4/commit/817d159df509b50963ef135c218936c35c460ab1) Thanks [@davydkov](https://github.com/davydkov)! - Completions for project name in `import` statements

## 1.46.4

### Patch Changes

- [#2509](https://github.com/likec4/likec4/pull/2509) [`9b93f25`](https://github.com/likec4/likec4/commit/9b93f25a568f4adba9bce414c0a776ed447c6676) - Fix generated PlantUML diagrams for unsupported names, [#2307](https://github.com/likec4/likec4/issues/2307)
- [#2506](https://github.com/likec4/likec4/pull/2506) [`39dcb77`](https://github.com/likec4/likec4/commit/39dcb77328310970f5d254e5a55f84a7a534524f) - Fixed "exclude" option in project configuration (it was working only with "\*\*/" prefix)
- [#2507](https://github.com/likec4/likec4/pull/2507) [`6e65818`](https://github.com/likec4/likec4/commit/6e658182dfb50a3366873f90831b1406178891b0) Bundle Bootstrap icons (2000+ icons, https://icons.getbootstrap.com/), closes [#2503](https://github.com/likec4/likec4/issues/2503)

## 1.46.3

### Patch Changes

- [#2495](https://github.com/likec4/likec4/pull/2495) [`d91e69c`](https://github.com/likec4/likec4/commit/d91e69c988b0e430215ada8b38d40f63821750db) Thanks [@davydkov](https://github.com/davydkov)! - Corrected resolution of project's included documents

- [#2493](https://github.com/likec4/likec4/pull/2493) [`5c5c33c`](https://github.com/likec4/likec4/commit/5c5c33ca615bb8b79592c688b9ab0e53bf9d55dc) Thanks [@renovate](https://github.com/apps/renovate)! - update chokidar to v5

- [#2495](https://github.com/likec4/likec4/pull/2495) [`aa7340c`](https://github.com/likec4/likec4/commit/aa7340c882a147cf7f659a1f93d10e1d137711d5) Thanks [@davydkov](https://github.com/davydkov)! - Remove workspace locks in ProjectsManager, as they lead to race conditions during extension activation. Fixes [#2466](https://github.com/likec4/likec4/issues/2466)

## 1.46.2
