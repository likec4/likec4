# @likec4/generators

## 1.50.0

### Minor Changes

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: extended round-trip (export options, waypoints, view notation)

  - **Export:** Optional `GenerateDrawioOptions`: `layoutOverride`, `strokeColorByNodeId`, `strokeWidthByNodeId`. Emit element/edge customData as mxUserObject; emit edge waypoints (viewmodel points) as mxGeometry Array.
  - **Import:** Emit `// likec4.view.notation viewId '...'` from root `likec4ViewNotation`; emit `// <likec4.edge.waypoints>` with `// src|tgt [ [x,y], … ]` for edges with mxGeometry points (single and multi-diagram).
  - **Docs:** drawio.mdx updated with options, waypoints, customData, and comment blocks for view notation and edge waypoints.

### Patch Changes

- [#2639](https://github.com/likec4/likec4/pull/2639) [`871f134`](https://github.com/likec4/likec4/commit/871f134911d3a1313c62fb002f2834e94dc305d0) Thanks [@davydkov](https://github.com/davydkov)! - Enable "Export to Draw.io" in the app's export menu — opens app.diagrams.net with the current diagram pre-loaded

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io export alignment; cross-platform postpack; language-server worker.

  - **Draw.io export:** Generators and CLI export views to Draw.io (.drawio); round-trip comment blocks (layout, stroke, waypoints) and postpack behavior only. No import/parser in this PR.
  - **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
  - **Language-server:** Safe error stringification in browser worker for oxlint.

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0
  - @likec4/log@1.50.0

## 1.49.0

### Patch Changes

- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0
  - @likec4/log@1.49.0

## 1.48.0

### Patch Changes

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0
  - @likec4/log@1.48.0

## 1.47.0

### Patch Changes

- [#2521](https://github.com/likec4/likec4/pull/2521) [`7e89693`](https://github.com/likec4/likec4/commit/7e896936c27bf9cb3e5409d6c1c36dc6d73c2870) Thanks [@davydkov](https://github.com/davydkov)! - - Generate Mermaid with expanded Node Shapes (v11.3.0+)
  - Improve labels in PlantUML
  - Support new shapes: `bucket` and `document`
- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0

## 1.46.4

### Patch Changes

- [#2509](https://github.com/likec4/likec4/pull/2509) [`9b93f25`](https://github.com/likec4/likec4/commit/9b93f25a568f4adba9bce414c0a776ed447c6676) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix generated PlantUML diagrams for unsupported names, [#2307](https://github.com/likec4/likec4/issues/2307)

- Updated dependencies []:
  - @likec4/core@1.46.4

## 1.46.3

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
