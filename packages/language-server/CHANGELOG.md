# @likec4/language-server

## 1.48.0

### Minor Changes

- [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83) Thanks [@davydkov](https://github.com/davydkov)! - Add icon customization options

  - Add iconColor, iconSize, and iconPosition properties to element styles
  - Support icon positioning (left, right, top, bottom) in diagrams and layouts
  - Enable custom icon colors and sizes in element specifications

### Patch Changes

- [`545b58a`](https://github.com/likec4/likec4/commit/545b58a34a44cff906f8a1b5335e32f662272c0c) Thanks [@davydkov](https://github.com/davydkov)! - Fix issue where including additional directories in project stopped working, closing #2555

- [`fdcfb0e`](https://github.com/likec4/likec4/commit/fdcfb0e75c10b9253b85c05fabeace9efae74c74) Thanks [@davydkov](https://github.com/davydkov)! - Improve cache management in ProjectsManager and ManualLayouts

- [`46938b1`](https://github.com/likec4/likec4/commit/46938b10aa189a8faf7338ff7ea845d92fc4d9dc) Thanks [@davydkov](https://github.com/davydkov)! - Add project update listeners and notifications to ProjectsManager. Introduced `DidChangeProjectsNotification` to LSP Protocol.

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0
  - @likec4/layouts@1.48.0
  - @likec4/config@1.48.0
  - @likec4/log@1.48.0

## 1.47.0

### Patch Changes

- [`817d159`](https://github.com/likec4/likec4/commit/817d159df509b50963ef135c218936c35c460ab1) Thanks [@davydkov](https://github.com/davydkov)! - Completions for project name in `import` statements

- [`be5326a`](https://github.com/likec4/likec4/commit/be5326a029c4f295cdd2bcf34dfa4a928dd9b948) Thanks [@davydkov](https://github.com/davydkov)! - Updated MCP SDK

- [#2521](https://github.com/likec4/likec4/pull/2521) [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15) Thanks [@davydkov](https://github.com/davydkov)! - - Add two new shapes: `document` and `bucket`

  - Apply border style to element node (previously it was applied to compound nodes and groups), closes [#2502](https://github.com/likec4/likec4/issues/2502)

- [#2521](https://github.com/likec4/likec4/pull/2521) [`8a15bb6`](https://github.com/likec4/likec4/commit/8a15bb6acde616eae65891d3dc73ff19eb0d5ffc) Thanks [@davydkov](https://github.com/davydkov)! - Improve reloading and updating projects

## 1.46.4

### Patch Changes

- [#2506](https://github.com/likec4/likec4/pull/2506) [`39dcb77`](https://github.com/likec4/likec4/commit/39dcb77328310970f5d254e5a55f84a7a534524f) - Fixed "exclude" option in project configuration (it was working only with "\*\*/" prefix)

## 1.46.3

### Patch Changes

- [#2495](https://github.com/likec4/likec4/pull/2495) [`d91e69c`](https://github.com/likec4/likec4/commit/d91e69c988b0e430215ada8b38d40f63821750db) Thanks [@davydkov](https://github.com/davydkov)! - Corrected resolution of project's included documents

- [#2493](https://github.com/likec4/likec4/pull/2493) [`5c5c33c`](https://github.com/likec4/likec4/commit/5c5c33ca615bb8b79592c688b9ab0e53bf9d55dc) Thanks [@renovate](https://github.com/apps/renovate)! - update chokidar to v5

- [#2495](https://github.com/likec4/likec4/pull/2495) [`aa7340c`](https://github.com/likec4/likec4/commit/aa7340c882a147cf7f659a1f93d10e1d137711d5) Thanks [@davydkov](https://github.com/davydkov)! - Remove workspace locks in ProjectsManager, as they lead to race conditions during extension activation. Fixes [#2466](https://github.com/likec4/likec4/issues/2466)

## 1.46.2

### Patch Changes

- [#2476](https://github.com/likec4/likec4/pull/2476) [`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671) Thanks [@davydkov](https://github.com/davydkov)! - Deployment nodes name is wrong derived from instanceOf, fixes #2387
