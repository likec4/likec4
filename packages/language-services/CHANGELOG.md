# @likec4/language-services

## 1.55.2

### Patch Changes

- Updated dependencies [[`935f6bb`](https://github.com/likec4/likec4/commit/935f6bb3fc42b88669bd8af65947a201f8e3d490)]:
  - @likec4/language-server@1.55.2
  - @likec4/config@1.55.2
  - @likec4/core@1.55.2
  - @likec4/generators@1.55.2
  - @likec4/layouts@1.55.2
  - @likec4/log@1.55.2

## 1.55.1

### Patch Changes

- Updated dependencies [[`41ee8b7`](https://github.com/likec4/likec4/commit/41ee8b715fabecf8022a3440c971adeea1e8f9a3)]:
  - @likec4/language-server@1.55.1
  - @likec4/core@1.55.1
  - @likec4/config@1.55.1
  - @likec4/generators@1.55.1
  - @likec4/layouts@1.55.1
  - @likec4/log@1.55.1

## 1.55.0

### Patch Changes

- [#2877](https://github.com/likec4/likec4/pull/2877) [`51adb85`](https://github.com/likec4/likec4/commit/51adb85ad1097cdd4c95f9082533c8b33b124a42) Thanks [@davydkov](https://github.com/davydkov)! - Extract MCP server and tools to `@likec4/mcp` package. This will allow us to reuse MCP server and tools in other projects, and also will make the codebase cleaner and more modular.

- Updated dependencies [[`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b), [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8), [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383), [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e), [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad), [`51adb85`](https://github.com/likec4/likec4/commit/51adb85ad1097cdd4c95f9082533c8b33b124a42), [`9687f89`](https://github.com/likec4/likec4/commit/9687f8974309de08001db3699e8712c7beac2b07)]:
  - @likec4/core@1.55.0
  - @likec4/language-server@1.55.0
  - @likec4/config@1.55.0
  - @likec4/generators@1.55.0
  - @likec4/layouts@1.55.0
  - @likec4/log@1.55.0

## 1.54.0

### Patch Changes

- [`15e92a4`](https://github.com/likec4/likec4/commit/15e92a4a62c67a7c4e0130011fadb67decd13c31) Thanks [@davydkov](https://github.com/davydkov)! - Don't cache LikeC4 instances in globalThis (leave it up to the user to do it if they want to)

- Updated dependencies [[`302f020`](https://github.com/likec4/likec4/commit/302f020e4e892d94159255a876da0119f9c8d9c9), [`b6f6a35`](https://github.com/likec4/likec4/commit/b6f6a35aff00e141c8f0a04686579b08773c2d7b), [`06ca18f`](https://github.com/likec4/likec4/commit/06ca18f9f0d69602917ff90b65e165bd8edffb25)]:
  - @likec4/language-server@1.54.0
  - @likec4/generators@1.54.0
  - @likec4/config@1.54.0
  - @likec4/core@1.54.0
  - @likec4/layouts@1.54.0
  - @likec4/log@1.54.0

## 1.53.0

### Patch Changes

- [#2785](https://github.com/likec4/likec4/pull/2785) [`eddfe46`](https://github.com/likec4/likec4/commit/eddfe462b49d8dd598db443259bc2ba0820b76f1) Thanks [@davydkov](https://github.com/davydkov)! - Fix logger initialization defaults and environment detection

- [#2790](https://github.com/likec4/likec4/pull/2790) [`9a3fa0b`](https://github.com/likec4/likec4/commit/9a3fa0bfd78dfbbd0fa9b26f2f872445c5b9ddcf) Thanks [@davydkov](https://github.com/davydkov)! - Improve `likec4 validate` CLI command:

  - Fix exit code (now properly exits with 1 on validation failure)
  - Add `--json` flag for structured JSON output
  - Add `--file` flag to filter errors to specific files
  - Add `--no-layout` flag to skip layout drift checks
  - Add success/failure summary messages
  - Add `--project` support for multi-project workspaces

- Updated dependencies [[`d4aa31a`](https://github.com/likec4/likec4/commit/d4aa31ac1c1f14381a35f59d00880e75c7a4332e), [`22cde07`](https://github.com/likec4/likec4/commit/22cde07331a7d375d30c1220a1603576e8438735), [`bb95d5a`](https://github.com/likec4/likec4/commit/bb95d5a601f630b0d8deb73ac4e83191b00a33c1), [`cf5acbc`](https://github.com/likec4/likec4/commit/cf5acbcb8410cd66342e39a490fcfd9d91619916), [`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/generators@1.53.0
  - @likec4/config@1.53.0
  - @likec4/core@1.53.0
  - @likec4/language-server@1.53.0
  - @likec4/layouts@1.53.0
  - @likec4/log@1.53.0

## 1.52.0

### Minor Changes

- [#2667](https://github.com/likec4/likec4/pull/2667) [`2c6a43d`](https://github.com/likec4/likec4/commit/2c6a43da4552dbd40473effba65c7b04e165a7f3) Thanks [@m9810223](https://github.com/m9810223)! - Add `likec4 format` (alias `fmt`) CLI command for formatting `.c4` source files

  - `@likec4/language-server` — add `format()` method to `LikeC4LanguageServices` with `projectIds`/`documentUris` filtering and LSP formatting options
  - `@likec4/language-services` — add `format()` method to `LikeC4` facade, translating project name strings to `ProjectId`
  - `likec4` — add `format` CLI command with `--check` mode for CI, `--project` and `--files` filtering

### Patch Changes

- Updated dependencies [[`2c6a43d`](https://github.com/likec4/likec4/commit/2c6a43da4552dbd40473effba65c7b04e165a7f3), [`4d579d6`](https://github.com/likec4/likec4/commit/4d579d6990bd3f59fb8420d2adb0e246fd9dfdcc), [`a80d2e8`](https://github.com/likec4/likec4/commit/a80d2e85c8c508236262156d4ef45e28750c295c), [`aab9343`](https://github.com/likec4/likec4/commit/aab9343f0e149d978915a13429ff367dc284937b), [`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/language-server@1.52.0
  - @likec4/config@1.52.0
  - @likec4/generators@1.52.0
  - @likec4/core@1.52.0
  - @likec4/layouts@1.52.0
  - @likec4/log@1.52.0

## 1.51.0

### Patch Changes

- Updated dependencies [[`70e0f7d`](https://github.com/likec4/likec4/commit/70e0f7db20c0945d37a6b2f77ad9722abf4706ce), [`026ef4a`](https://github.com/likec4/likec4/commit/026ef4ab673f07669f460d4b075918f5045ecddd)]:
  - @likec4/language-server@1.51.0
  - @likec4/core@1.51.0
  - @likec4/config@1.51.0
  - @likec4/generators@1.51.0
  - @likec4/layouts@1.51.0
  - @likec4/log@1.51.0

## 1.50.0

### Patch Changes

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e), [`871f134`](https://github.com/likec4/likec4/commit/871f134911d3a1313c62fb002f2834e94dc305d0), [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf), [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf), [`5ce02f8`](https://github.com/likec4/likec4/commit/5ce02f8e1fa437c3f7597a546ae3b08515712ac1), [`0587b66`](https://github.com/likec4/likec4/commit/0587b6609ec9eb372aa3ff8eae2fd3a82c789144)]:
  - @likec4/core@1.50.0
  - @likec4/config@1.50.0
  - @likec4/language-server@1.50.0
  - @likec4/generators@1.50.0
  - @likec4/layouts@1.50.0
  - @likec4/log@1.50.0

## 1.49.0

### Patch Changes

- [#2624](https://github.com/likec4/likec4/pull/2624) [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7) Thanks [@davydkov](https://github.com/davydkov)! - Enhanced hover tooltips in editor now show relationship counts and clickable links to views containing the element

- Updated dependencies [[`3f28e65`](https://github.com/likec4/likec4/commit/3f28e65162d895a5afd3b61e3dcf1c0c9d67c661), [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45), [`12d472b`](https://github.com/likec4/likec4/commit/12d472b19f75a400fb4452cfb9d1be9392792118), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6), [`1c6e427`](https://github.com/likec4/likec4/commit/1c6e4273d96774b5c5c7ee52047539e15bb265e2)]:
  - @likec4/config@1.49.0
  - @likec4/core@1.49.0
  - @likec4/language-server@1.49.0
  - @likec4/generators@1.49.0
  - @likec4/layouts@1.49.0
  - @likec4/log@1.49.0
