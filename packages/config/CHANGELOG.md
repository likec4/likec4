# @likec4/config

## 1.60.1

### Patch Changes

- [#3496](https://github.com/likec4/likec4/pull/3496) [`615a6d1`](https://github.com/likec4/likec4/commit/615a6d194299331fe361ae52087e638b590389a7) Thanks [@davydkov](https://github.com/davydkov)! - TypeScript and JavaScript project configs (`likec4.config.ts`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.js`) are no longer experimental. They are now loaded with [jiti](https://github.com/unjs/jiti) instead of esbuild: loading no longer writes temporary `*.bundled_*.mjs` files next to your config, the VSCode extension loads configs faster and is smaller, and `esbuild` is no longer installed with `likec4`, `@likec4/lsp` and `@likec4/mcp`. If you use `@likec4/config` or `@likec4/language-server` directly, install `jiti` instead of `bundle-require` and `esbuild` to load non-JSON configs.
  
  Fixed: changes to a project config (for example, title or styles) were not applied to the model until the project files were edited.

- [`773bd9c`](https://github.com/likec4/likec4/commit/773bd9ce38ec781849cd2d941b59b5ea1468af76) Thanks [@luantaraschi](https://github.com/luantaraschi)! - Fix project config with `styles.customCss` being rejected with `Invalid input at styles.customCss`, which made the whole config (name, theme, defaults) be ignored. Fixes [#3285](https://github.com/likec4/likec4/issues/3285)

- [#3389](https://github.com/likec4/likec4/pull/3389) [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Add Google Material Symbols support through the `md:` icon prefix.
- Updated dependencies [[`aaa53f4`](https://github.com/likec4/likec4/commit/aaa53f42e7e3d20aa0cc85b7c63b4d2b1753738c), [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27), [`c5eaa85`](https://github.com/likec4/likec4/commit/c5eaa85423a74f43f3e233e3c2db5aade1b9ed12), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`3a4bb8b`](https://github.com/likec4/likec4/commit/3a4bb8bd62ff1ce2af560d6280622cd5908395c6), [`b7ebce3`](https://github.com/likec4/likec4/commit/b7ebce3c1cdd0f9d92ff284a82e09e07b76f935d), [`ca1ba7b`](https://github.com/likec4/likec4/commit/ca1ba7b20116671ac1d2c3a71408d5e504e21989), [`c313fb0`](https://github.com/likec4/likec4/commit/c313fb0ad5428e6cec5f752dcdf0d290a686b0dc), [`9e106b8`](https://github.com/likec4/likec4/commit/9e106b8d205b589d49e9c72d2a80dcdfb74a4aa1)]:
  - @likec4/core@1.60.1
  - @likec4/log@1.60.1

## 1.60.0

### Patch Changes

- [#3278](https://github.com/likec4/likec4/pull/3278) [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75) Thanks [@alexhelkar](https://github.com/alexhelkar)! - Add orthogonal edge routing to draw relationships with horizontal and vertical segments. Set `routing ortho` in a view, append `ortho` to `autoLayout`, or set `styles.defaults.view.routing` in the project configuration. The default remains `spline`. Changing routing preserves saved node positions and connection control points.
  
  Place automatic labels beside long straight segments, avoiding nodes, other labels, and relationship lines where space permits. Labels update after layout and node moves. Manually positioned labels retain their position or offset during editing.
  
  Separate shared segments of edited orthogonal edges into tracks with a target spacing of 12 diagram units. Track shifts also separate connection points along node borders, subject to the space available at each endpoint.
  
  Keep edited edge labels centered under spline routing, preventing the initial jump by half the label's size.
  
  Keep labels and separated tracks aligned with edited edges when connection handles are offset from node centers.
- Updated dependencies [[`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75), [`1c22fb0`](https://github.com/likec4/likec4/commit/1c22fb0bc42d9a0c7a9411efba39546aeeb55437), [`a25fcfa`](https://github.com/likec4/likec4/commit/a25fcfae8e47f3c5c3189b3e534a9c9be4a6aead), [`feb3f4e`](https://github.com/likec4/likec4/commit/feb3f4e4cacb9f456161145f97aeed7143160599), [`1332900`](https://github.com/likec4/likec4/commit/1332900ecc79a10aaa81c5aef2334c6a018974dc), [`2bf291e`](https://github.com/likec4/likec4/commit/2bf291e6deec01c679e62c881a394eb9a53c51cd), [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75)]:
  - @likec4/core@1.60.0
  - @likec4/log@1.60.0

## 1.59.4

### Patch Changes

- [#3218](https://github.com/likec4/likec4/pull/3218) [`4b59d64`](https://github.com/likec4/likec4/commit/4b59d6464a2ff347ffc6380037f5c5899a38b5de) Thanks [@ckeller42](https://github.com/ckeller42)! - Configure the default relationship-browser scope and share links that preserve the selected scope.
- Updated dependencies [[`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad), [`add966b`](https://github.com/likec4/likec4/commit/add966b37a0df38e57b84181c3d67f973c099dd2), [`f0f3ec6`](https://github.com/likec4/likec4/commit/f0f3ec65212ff0bd0e7d2849d11bebeeeb070c90)]:
  - @likec4/core@1.59.4
  - @likec4/log@1.59.4

## 1.59.3

### Patch Changes

- [#3078](https://github.com/likec4/likec4/pull/3078) [`61677a8`](https://github.com/likec4/likec4/commit/61677a8e5861f36c12e4f379f1623d9af455fa30) Thanks [@ckeller42](https://github.com/ckeller42)! - Allow generated webapps to limit available export formats from project config.

  Omitting `webapp.exportFormats` keeps all current formats enabled; an empty list hides webapp exports.
- Updated dependencies [[`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c), [`39dc9cf`](https://github.com/likec4/likec4/commit/39dc9cfc729d2e92d9dd0bb4553ed5abca0a3e5d), [`dc7eba2`](https://github.com/likec4/likec4/commit/dc7eba24559706f2e41ee5f8bfd66e79363de435), [`260ac73`](https://github.com/likec4/likec4/commit/260ac730bdfdeb5a27d4a23497b14ad3e2670de6), [`8a4a690`](https://github.com/likec4/likec4/commit/8a4a6905d5cfd63c1c2e443ea93ad86aba474d5e)]:
  - @likec4/core@1.59.3
  - @likec4/log@1.59.3

## 1.59.2

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.59.2
  - @likec4/log@1.59.2

## 1.59.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.59.1
  - @likec4/log@1.59.1

## 1.59.0

### Patch Changes

- Updated dependencies [[`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4), [`0994577`](https://github.com/likec4/likec4/commit/09945775fb0c4c64b79eae6f17ee0abce92ef8f1), [`9b9727f`](https://github.com/likec4/likec4/commit/9b9727fcd1201296c4d7e09f7446edd38669328a), [`d0a05fe`](https://github.com/likec4/likec4/commit/d0a05fe8e29105444762542c78c9861a13bfaff0), [`1814846`](https://github.com/likec4/likec4/commit/1814846f629971cec2a392222ab00c42abea47ed), [`061e687`](https://github.com/likec4/likec4/commit/061e6872ee80b1381d3ec047663a22d1ebe6bab5)]:
  - @likec4/core@1.59.0
  - @likec4/log@1.59.0

## 1.57.1

### Patch Changes

- Updated dependencies [[`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc), [`8ad28c7`](https://github.com/likec4/likec4/commit/8ad28c777c76f294483c352180c7e3ea037eddfd), [`75e1510`](https://github.com/likec4/likec4/commit/75e1510def804bf9931bf222b03d1034e1181d04)]:
  - @likec4/core@1.57.1
  - @likec4/log@1.57.1

## 1.57.0

### Patch Changes

- Updated dependencies [[`311b93d`](https://github.com/likec4/likec4/commit/311b93de360556b9583b901c5ad3d6692b9c9f03), [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d)]:
  - @likec4/core@1.57.0
  - @likec4/log@1.57.0

## 1.56.0

### Patch Changes

- Updated dependencies [[`af34764`](https://github.com/likec4/likec4/commit/af3476421fd8938a897240ad6fd1c70068d1e070), [`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d), [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a)]:
  - @likec4/log@1.56.0
  - @likec4/core@1.56.0

## 1.55.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.55.1
  - @likec4/log@1.55.1

## 1.55.0

### Patch Changes

- Updated dependencies [[`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b), [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8), [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383), [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e), [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad)]:
  - @likec4/core@1.55.0
  - @likec4/log@1.55.0

## 1.54.0

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.54.0
  - @likec4/log@1.54.0

## 1.53.0

### Patch Changes

- [#2733](https://github.com/likec4/likec4/pull/2733) [`22cde07`](https://github.com/likec4/likec4/commit/22cde07331a7d375d30c1220a1603576e8438735) Thanks [@purple52](https://github.com/purple52)! - Add `landingPage` configuration option to control the landing page behavior:

  - `redirect: true` to skip the landing page and go directly to the index view
  - `include` / `exclude` selectors to filter which views appear in the landing page grid

- Updated dependencies [[`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/core@1.53.0
  - @likec4/log@1.53.0

## 1.52.0

### Patch Changes

- [#2705](https://github.com/likec4/likec4/pull/2705) [`4d579d6`](https://github.com/likec4/likec4/commit/4d579d6990bd3f59fb8420d2adb0e246fd9dfdcc) Thanks [@davydkov](https://github.com/davydkov)! - Disable implicit views by default. Auto-generated scoped views for elements without explicit views are no longer created unless `"implicitViews": true` is set in the project config. To restore the previous behavior, add `"implicitViews": true` to your `likec4.json` configuration.

- Updated dependencies [[`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/core@1.52.0
  - @likec4/log@1.52.0

## 1.51.0

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.51.0
  - @likec4/log@1.51.0

## 1.50.0

### Minor Changes

- [#2638](https://github.com/likec4/likec4/pull/2638) [`0587b66`](https://github.com/likec4/likec4/commit/0587b6609ec9eb372aa3ff8eae2fd3a82c789144) Thanks [@ckeller42](https://github.com/ckeller42)! - Add new MCP query tools: `query-graph`, `query-incomers-graph`, `query-outgoers-graph`, `query-by-metadata`, `query-by-tags`, `query-by-tag-pattern`, `find-relationship-paths`, `batch-read-elements`, `subgraph-summary`, and `element-diff`.

  Enhance `read-project-summary` to include serialized project `config` and extend project config schema with optional `metadata` field.

### Patch Changes

- [#2642](https://github.com/likec4/likec4/pull/2642) [`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e) Thanks [@davydkov](https://github.com/davydkov)! - Automatically derive element technology from icon name when not set explicitly.
  Elements with `aws:`, `azure:`, `gcp:`, or `tech:` icons will get a human-readable technology label
  (e.g. `tech:apache-flink` → "Apache Flink"). Can be disabled via `inferTechnologyFromIcon: false` in project config.

- [#2648](https://github.com/likec4/likec4/pull/2648) [`5ce02f8`](https://github.com/likec4/likec4/commit/5ce02f8e1fa437c3f7597a546ae3b08515712ac1) Thanks [@davydkov](https://github.com/davydkov)! - Auto-generate scoped views for elements without explicit views, enabling drill-down navigation out of the box. Configurable via `implicitViews` option in project config (enabled by default).

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0
  - @likec4/log@1.50.0

## 1.49.0

### Patch Changes

- [`3f28e65`](https://github.com/likec4/likec4/commit/3f28e65162d895a5afd3b61e3dcf1c0c9d67c661) Thanks [@davydkov](https://github.com/davydkov)! - Allow JSON configs to extend other configs and merge styles from them. Closes [#2573](https://github.com/likec4/likec4/issues/2573)

  ```json
  {
    "name": "project-name",
    "extends": ["../shared/base-config.json", "../shared/theme-config.json"],
    "styles": {
      "defaults": {
        "relationship": {
          "arrow": "vee"
        }
      }
    }
  }
  ```

- [#2620](https://github.com/likec4/likec4/pull/2620) [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45) Thanks [@davydkov](https://github.com/davydkov)! - Internal restructuring for better maintainability:
  - `@likec4/language-services` - for cross-platform language services initialization
  - `@likec4/react` - bundled version of `@likec4/diagram`
  - `@likec4/vite-plugin` - to separate concerns
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

- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0

## 1.46.4

### Patch Changes

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
