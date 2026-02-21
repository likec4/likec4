# @likec4/language-server

## 1.50.0

### Minor Changes

- [#2638](https://github.com/likec4/likec4/pull/2638) [`0587b66`](https://github.com/likec4/likec4/commit/0587b6609ec9eb372aa3ff8eae2fd3a82c789144) Thanks [@ckeller42](https://github.com/ckeller42)! - Add new MCP query tools: `query-graph`, `query-incomers-graph`, `query-outgoers-graph`, `query-by-metadata`, `query-by-tags`, `query-by-tag-pattern`, `find-relationship-paths`, `batch-read-elements`, `subgraph-summary`, and `element-diff`.

  Enhance `read-project-summary` to include serialized project `config` and extend project config schema with optional `metadata` field.

### Patch Changes

- [#2642](https://github.com/likec4/likec4/pull/2642) [`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e) Thanks [@davydkov](https://github.com/davydkov)! - Automatically derive element technology from icon name when not set explicitly.
  Elements with `aws:`, `azure:`, `gcp:`, or `tech:` icons will get a human-readable technology label
  (e.g. `tech:apache-flink` → "Apache Flink"). Can be disabled via `inferTechnologyFromIcon: false` in project config.

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io export alignment; cross-platform postpack; language-server worker.

  - **Draw.io export:** Generators and CLI export views to Draw.io (.drawio); round-trip comment blocks (layout, stroke, waypoints) and postpack behavior only. No import/parser in this PR.
  - **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
  - **Language-server:** Safe error stringification in browser worker for oxlint.

- [#2648](https://github.com/likec4/likec4/pull/2648) [`5ce02f8`](https://github.com/likec4/likec4/commit/5ce02f8e1fa437c3f7597a546ae3b08515712ac1) Thanks [@davydkov](https://github.com/davydkov)! - Auto-generate scoped views for elements without explicit views, enabling drill-down navigation out of the box. Configurable via `implicitViews` option in project config (enabled by default).

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e), [`5ce02f8`](https://github.com/likec4/likec4/commit/5ce02f8e1fa437c3f7597a546ae3b08515712ac1), [`0587b66`](https://github.com/likec4/likec4/commit/0587b6609ec9eb372aa3ff8eae2fd3a82c789144)]:
  - @likec4/core@1.50.0
  - @likec4/config@1.50.0
  - @likec4/layouts@1.50.0
  - @likec4/log@1.50.0

## 1.49.0

### Patch Changes

- [#2624](https://github.com/likec4/likec4/pull/2624) [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7) Thanks [@davydkov](https://github.com/davydkov)! - Enhanced hover tooltips in editor now show relationship counts and clickable links to views containing the element

- [#2620](https://github.com/likec4/likec4/pull/2620) [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45) Thanks [@davydkov](https://github.com/davydkov)! - Internal restructuring for better maintainability:

  - `@likec4/language-services` - for cross-platform language services initialization
  - `@likec4/react` - bundled version of `@likec4/diagram`
  - `@likec4/vite-plugin` - to separate concerns

- [`12d472b`](https://github.com/likec4/likec4/commit/12d472b19f75a400fb4452cfb9d1be9392792118) Thanks [@davydkov](https://github.com/davydkov)! - Fix title inheritance from specification, closes [#2580](https://github.com/likec4/likec4/issues/2580)

- [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6) Thanks [@davydkov](https://github.com/davydkov)! - Add notes to the elements and relationships using `with`. Example:

  ```likec4
  view {
    include
      some.element with {
        notes '''
          This is a note for some.element.
          It can contain multiple lines and **markdown** formatting.
        '''
      }
  }
  ```

  Relates to [#2567](https://github.com/likec4/likec4/issues/2567)

- [`1c6e427`](https://github.com/likec4/likec4/commit/1c6e4273d96774b5c5c7ee52047539e15bb265e2) Thanks [@davydkov](https://github.com/davydkov)! - Fix MCP server initialization and be stateless (according to suggestion in https://github.com/likec4/likec4/security/dependabot/179)

- Updated dependencies [[`3f28e65`](https://github.com/likec4/likec4/commit/3f28e65162d895a5afd3b61e3dcf1c0c9d67c661), [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/config@1.49.0
  - @likec4/core@1.49.0
  - @likec4/layouts@1.49.0
  - @likec4/log@1.49.0

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
