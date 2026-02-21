# likec4

## 1.50.0

### Patch Changes

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: CLI --roundtrip, Playground E2E, DrawioContextMenu getSourceContent

  - **CLI:** `likec4 export drawio --roundtrip` reads all `.c4`/`.likec4` files in the workspace, parses round-trip comment blocks (layout, stroke colors/widths, edge waypoints), and applies them when generating each view's `.drawio` file.
  - **Docs:** CLI reference updated with `--roundtrip` and `--all-in-one` options.
  - **Playground:** `DrawioContextMenu` component accepts optional `getSourceContent` for round-trip export when used outside the provider.
  - **E2E:** New Playwright config and test for Draw.io context menu in the Playground (`pnpm test:playground` from e2e/).

- [#2639](https://github.com/likec4/likec4/pull/2639) [`871f134`](https://github.com/likec4/likec4/commit/871f134911d3a1313c62fb002f2834e94dc305d0) Thanks [@davydkov](https://github.com/davydkov)! - Enable "Export to Draw.io" in the app's export menu — opens app.diagrams.net with the current diagram pre-loaded

- [#2630](https://github.com/likec4/likec4/pull/2630) [`68ab5f6`](https://github.com/likec4/likec4/commit/68ab5f6652b43f2f6e52fd3cd2736cdc3672e3cf) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io export alignment; cross-platform postpack; language-server worker.

  - **Draw.io export:** Generators and CLI export views to Draw.io (.drawio); round-trip comment blocks (layout, stroke, waypoints) and postpack behavior only. No import/parser in this PR.
  - **Postpack:** `likec4ops postpack` copies packed tgz to package.tgz (cross-platform); all packages use it instead of `cp` so pack/lint:package works on Windows.
  - **Language-server:** Safe error stringification in browser worker for oxlint.

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0

## 1.49.0

### Patch Changes

- [#2616](https://github.com/likec4/likec4/pull/2616) [`4a7c01c`](https://github.com/likec4/likec4/commit/4a7c01c9ee1e2d006f9002b0fed79cb5fdda9a6f) Thanks [@davydkov](https://github.com/davydkov)! - Add new `component` element shape

- [#2620](https://github.com/likec4/likec4/pull/2620) [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45) Thanks [@davydkov](https://github.com/davydkov)! - Internal restructuring for better maintainability:

  - `@likec4/language-services` - for cross-platform language services initialization
  - `@likec4/react` - bundled version of `@likec4/diagram`
  - `@likec4/vite-plugin` - to separate concerns

- [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300) Thanks [@davydkov](https://github.com/davydkov)! - Add review drifts feature to the compare panel, highlight drifts in the diagram and add drifts summary panel.

- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0

## 1.48.0

### Minor Changes

- [`cd71c00`](https://github.com/likec4/likec4/commit/cd71c00a36cfe3a065a578befe87f6b1d2d26a6d) Thanks [@ckeller42](https://github.com/ckeller42)! - Direct links to Relationship Views, thanks to @ckeller42 in [#2547](https://github.com/ckeller/likec4/pull/2547)

### Patch Changes

- [`ee4cdc2`](https://github.com/likec4/likec4/commit/ee4cdc29db81fddc54b401a8af954a352fdbb142) Thanks [@davydkov](https://github.com/davydkov)! - Enable D2/DOT/MMD/PUML pages when viewing multiple projects.
  Improve export page behavior.

- [`ec06c45`](https://github.com/likec4/likec4/commit/ec06c4530ef92bf466a54764d21dccad7c50cb59) Thanks [@davydkov](https://github.com/davydkov)! - Fix export to PNG of sequence diagrams, closes [#2532](https://github.com/likec4/likec4/issues/2532)

- [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546) Thanks [@davydkov](https://github.com/davydkov)! - Improved font loading performance by migrating to variable fonts and enhanced diagram bounds calculation with better edge handling

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0

## 1.47.0

### Patch Changes

- [`be5326a`](https://github.com/likec4/likec4/commit/be5326a029c4f295cdd2bcf34dfa4a928dd9b948) Thanks [@davydkov](https://github.com/davydkov)! - Updated MCP SDK

- [#2520](https://github.com/likec4/likec4/pull/2520) [`37f2777`](https://github.com/likec4/likec4/commit/37f27773e68cd28484930cd07f0e02ca36ac4532) Thanks [@davydkov](https://github.com/davydkov)! - Export to json format supports multiple projects, plus:

  - Added `--pretty` option for exporting indented JSON
  - Added `--skip-layout` option to skip layouts and return only computed models

- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0

## 1.46.4

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.4

## 1.46.3

### Patch Changes

- [#2495](https://github.com/likec4/likec4/pull/2495) [`faa3b86`](https://github.com/likec4/likec4/commit/faa3b86ac9a44d179e637ef65474410bd5f23524) Thanks [@davydkov](https://github.com/davydkov)! - Fallback to the first project in vite plugin, if `projectId` is not found, instead of erroring out. Closes [#2472](https://github.com/like-c4/likec4/issues/2472)

- Updated dependencies []:
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
