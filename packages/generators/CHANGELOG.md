# @likec4/generators

## 1.60.1

### Patch Changes

- [#3354](https://github.com/likec4/likec4/pull/3354) [`aaa53f4`](https://github.com/likec4/likec4/commit/aaa53f42e7e3d20aa0cc85b7c63b4d2b1753738c) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Support styled and nested `group` boundaries around deployment nodes and instances in deployment views.

- [#3492](https://github.com/likec4/likec4/pull/3492) [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f) Thanks [@davydkov](https://github.com/davydkov)! - Links to elements and views in Markdown (`[[cloud.api]]`, `[[view:index]]`) show the element or view title (or your label) in PlantUML, Draw.io and Markdown exports and in MCP tool results, instead of the raw `[[…]]`. Broken links show their target. The LikeC4 DSL export keeps the links as written.
  
  In the model API, `description`, `summary` and `notes` resolve links to titles in `.text` and `.html` (`.md` stays as written), and `LikeC4Model.resolveMarkdownRef` and `resolveMarkdownRefs` from `@likec4/core/utils` resolve links for your own outputs.

- [#3485](https://github.com/likec4/likec4/pull/3485) [`6756c79`](https://github.com/likec4/likec4/commit/6756c790d86400b5b5dd2db7a749fe0c3ce0ab26) Thanks [@bim-ba](https://github.com/bim-ba)! - Mermaid export (`likec4 gen mermaid`) keeps the diagram's colors and line styles: each element gets the fill, border and text color of its LikeC4 color through `classDef`/`class`, and each relationship gets its line color and pattern through `linkStyle` (solid lines are drawn solid, dashed ones dashed, dotted ones dotted). Previously every node used Mermaid's default style and every edge was dotted.
- Updated dependencies [[`615a6d1`](https://github.com/likec4/likec4/commit/615a6d194299331fe361ae52087e638b590389a7), [`aaa53f4`](https://github.com/likec4/likec4/commit/aaa53f42e7e3d20aa0cc85b7c63b4d2b1753738c), [`773bd9c`](https://github.com/likec4/likec4/commit/773bd9ce38ec781849cd2d941b59b5ea1468af76), [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27), [`c5eaa85`](https://github.com/likec4/likec4/commit/c5eaa85423a74f43f3e233e3c2db5aade1b9ed12), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`3a4bb8b`](https://github.com/likec4/likec4/commit/3a4bb8bd62ff1ce2af560d6280622cd5908395c6), [`b7ebce3`](https://github.com/likec4/likec4/commit/b7ebce3c1cdd0f9d92ff284a82e09e07b76f935d), [`ca1ba7b`](https://github.com/likec4/likec4/commit/ca1ba7b20116671ac1d2c3a71408d5e504e21989), [`c313fb0`](https://github.com/likec4/likec4/commit/c313fb0ad5428e6cec5f752dcdf0d290a686b0dc), [`9e106b8`](https://github.com/likec4/likec4/commit/9e106b8d205b589d49e9c72d2a80dcdfb74a4aa1), [`d1f5178`](https://github.com/likec4/likec4/commit/d1f51781912a64284403e707f734379699acc385)]:
  - @likec4/config@1.60.1
  - @likec4/core@1.60.1
  - @likec4/log@1.60.1

## 1.60.0

### Patch Changes

- [#3310](https://github.com/likec4/likec4/pull/3310) [`1fb8e00`](https://github.com/likec4/likec4/commit/1fb8e00a8324bcd4a691025b6228e445150dcc6a) Thanks [@davydkov](https://github.com/davydkov)! - Add new `agent` element shape

- [#3289](https://github.com/likec4/likec4/pull/3289) [`2bf291e`](https://github.com/likec4/likec4/commit/2bf291e6deec01c679e62c881a394eb9a53c51cd) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Add `sizing` style property for elements. With `sizing fixed`, all elements of the same `size` are drawn with exactly the same width and height, regardless of title, description, icon or shape. Long titles and icons shrink to fit the element instead of making it grow. The default `sizing auto` keeps the current behavior, where `size` is the minimum size.
  
  ```likec4
  specification {
    element service {
      style {
        size small
        sizing fixed
      }
    }
  }
  ```

- [#3363](https://github.com/likec4/likec4/pull/3363) [`57c70ef`](https://github.com/likec4/likec4/commit/57c70ef0952cae0c31d53ef6f266495e92a7661c) Thanks [@davydkov](https://github.com/davydkov)! - LikeC4 DSL generator now emits `views`, including dynamic views with `loop`, `opt`, `par` and `break` blocks, step titles and descriptions. `printOperation` is renamed to `print`.
  
  Also refactored internal zod schemas, bundle size reduced from 2mb to ~400Kb

- [#3278](https://github.com/likec4/likec4/pull/3278) [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75) Thanks [@alexhelkar](https://github.com/alexhelkar)! - Add orthogonal edge routing to draw relationships with horizontal and vertical segments. Set `routing ortho` in a view, append `ortho` to `autoLayout`, or set `styles.defaults.view.routing` in the project configuration. The default remains `spline`. Changing routing preserves saved node positions and connection control points.
  
  Place automatic labels beside long straight segments, avoiding nodes, other labels, and relationship lines where space permits. Labels update after layout and node moves. Manually positioned labels retain their position or offset during editing.
  
  Separate shared segments of edited orthogonal edges into tracks with a target spacing of 12 diagram units. Track shifts also separate connection points along node borders, subject to the space available at each endpoint.
  
  Keep edited edge labels centered under spline routing, preventing the initial jump by half the label's size.
  
  Keep labels and separated tracks aligned with edited edges when connection handles are offset from node centers.
- Updated dependencies [[`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75), [`1c22fb0`](https://github.com/likec4/likec4/commit/1c22fb0bc42d9a0c7a9411efba39546aeeb55437), [`a25fcfa`](https://github.com/likec4/likec4/commit/a25fcfae8e47f3c5c3189b3e534a9c9be4a6aead), [`feb3f4e`](https://github.com/likec4/likec4/commit/feb3f4e4cacb9f456161145f97aeed7143160599), [`1332900`](https://github.com/likec4/likec4/commit/1332900ecc79a10aaa81c5aef2334c6a018974dc), [`2bf291e`](https://github.com/likec4/likec4/commit/2bf291e6deec01c679e62c881a394eb9a53c51cd), [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75)]:
  - @likec4/core@1.60.0
  - @likec4/config@1.60.0
  - @likec4/log@1.60.0

## 1.59.4

### Patch Changes

- [#3227](https://github.com/likec4/likec4/pull/3227) [`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Deployment relationships now support the `<->` and `-[kind]<->` bidirectional syntax introduced in v1.59.3.

- [#3244](https://github.com/likec4/likec4/pull/3244) [`57c097c`](https://github.com/likec4/likec4/commit/57c097c53acdc28347922763aa39e96c3d4d8a5d) Thanks [@humb1t](https://github.com/humb1t)! - Fix Mermaid export producing invalid output for views with a `group`. The subgraph id no longer starts with `@`, which Mermaid reserves for the `node@{ ... }` shape syntax, and grouped elements keep their own ids instead of being truncated by the length of the generated group id (which left short ids, such as `auth`, with an empty id).
- Updated dependencies [[`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad), [`add966b`](https://github.com/likec4/likec4/commit/add966b37a0df38e57b84181c3d67f973c099dd2), [`f0f3ec6`](https://github.com/likec4/likec4/commit/f0f3ec65212ff0bd0e7d2849d11bebeeeb070c90), [`4b59d64`](https://github.com/likec4/likec4/commit/4b59d6464a2ff347ffc6380037f5c5899a38b5de)]:
  - @likec4/core@1.59.4
  - @likec4/config@1.59.4
  - @likec4/log@1.59.4

## 1.59.3

### Patch Changes

- [#3150](https://github.com/likec4/likec4/pull/3150) [`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c) Thanks [@merlincat11](https://github.com/merlincat11)! - Add optional view order metadata for sorting sibling views in navigation.

- [#3210](https://github.com/likec4/likec4/pull/3210) [`bdefe0b`](https://github.com/likec4/likec4/commit/bdefe0b4983a86518bf4a5359bd5ba1511c8473a) Thanks [@davydkov](https://github.com/davydkov)! - Fix generated output using CRLF line endings on Windows. Markdown, Mermaid, D2, PlantUML and LikeC4 DSL exports now always emit LF, so generated files are byte-identical across platforms.

- [#3147](https://github.com/likec4/likec4/pull/3147) [`8a4a690`](https://github.com/likec4/likec4/commit/8a4a6905d5cfd63c1c2e443ea93ad86aba474d5e) Thanks [@farhan523](https://github.com/farhan523)! - Allow referencing global predicate groups inside view groups, so a reusable set of predicates can be scoped into a named group:

  ```likec4
  views {
    view of newServices {
      include cloud.new.*

      group 'Microservices' {
        global predicate microservices
      }
    }
  }
  ```

- [#3160](https://github.com/likec4/likec4/pull/3160) [`5b09f1d`](https://github.com/likec4/likec4/commit/5b09f1d2880664635f40b2fb21781332144e75c9) Thanks [@StefanStuehrmann](https://github.com/StefanStuehrmann)! - Add a Markdown generator and `export markdown` CLI command. `generateMarkdown` renders a
  project's views as a single GitHub-flavored Markdown document (optionally with a project
  overview from `options.description`), reusing `generateMermaid` for each embedded diagram.
  `likec4 export markdown [path]` writes one `README.md` per project into that project's own
  folder — following the `export png`/`json` precedent of iterating all projects by default,
  with `--project` to restrict to one — so the rendered architecture is browsable directly on
  GitHub, with no server and no manual diagram assembly.
- Updated dependencies [[`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c), [`39dc9cf`](https://github.com/likec4/likec4/commit/39dc9cfc729d2e92d9dd0bb4553ed5abca0a3e5d), [`dc7eba2`](https://github.com/likec4/likec4/commit/dc7eba24559706f2e41ee5f8bfd66e79363de435), [`260ac73`](https://github.com/likec4/likec4/commit/260ac730bdfdeb5a27d4a23497b14ad3e2670de6), [`8a4a690`](https://github.com/likec4/likec4/commit/8a4a6905d5cfd63c1c2e443ea93ad86aba474d5e), [`61677a8`](https://github.com/likec4/likec4/commit/61677a8e5861f36c12e4f379f1623d9af455fa30)]:
  - @likec4/core@1.59.3
  - @likec4/config@1.59.3
  - @likec4/log@1.59.3

## 1.59.2

### Patch Changes

- Updated dependencies []:
  - @likec4/config@1.59.2
  - @likec4/core@1.59.2
  - @likec4/log@1.59.2

## 1.59.1

### Patch Changes

- Updated dependencies []:
  - @likec4/config@1.59.1
  - @likec4/core@1.59.1
  - @likec4/log@1.59.1

## 1.59.0

### Patch Changes

- [#3084](https://github.com/likec4/likec4/pull/3084) [`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4) Thanks [@davydkov](https://github.com/davydkov)! - Flow control in dynamic views. Besides `parallel`, steps can now be grouped into flow blocks (each with an optional title):

  - `opt`, `loop` and `break` blocks
  - `alt` with `when` / `else` branches
  - `try` / `catch` / `finally` blocks

  ```likec4
  dynamic view example {
    customer -> app 'opens app'
    alt {
      when 'authorized' {
        app -> api 'requests data'
      }
      else 'not authorized' {
        app -> customer 'shows login'
      }
    }
  }
  ```

  Sequence diagrams render these blocks as nested frames, and actors stay visible when zoomed in (fixes [#3074](https://github.com/likec4/likec4/issues/3074)). During a walkthrough, a docked Sequence Outline panel shows the flow as a collapsible tree that mirrors the block nesting — each step is numbered and every operator carries a colored type tag and step count, so you can jump to any step and keep your place.

  > [!NOTE]
  > Flow control blocks are experimental — syntax and rendering may change. We are looking for your feedback in [discussions](https://github.com/likec4/likec4/discussions)!

  Resolved issues:

  - [#2745](https://github.com/likec4/likec4/issues/2745)
  - [#2993](https://github.com/likec4/likec4/issues/2993)
  - [#3074](https://github.com/likec4/likec4/issues/3074)

- Updated dependencies [[`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4), [`0994577`](https://github.com/likec4/likec4/commit/09945775fb0c4c64b79eae6f17ee0abce92ef8f1), [`9b9727f`](https://github.com/likec4/likec4/commit/9b9727fcd1201296c4d7e09f7446edd38669328a), [`d0a05fe`](https://github.com/likec4/likec4/commit/d0a05fe8e29105444762542c78c9861a13bfaff0), [`1814846`](https://github.com/likec4/likec4/commit/1814846f629971cec2a392222ab00c42abea47ed), [`061e687`](https://github.com/likec4/likec4/commit/061e6872ee80b1381d3ec047663a22d1ebe6bab5)]:
  - @likec4/core@1.59.0
  - @likec4/config@1.59.0
  - @likec4/log@1.59.0

## 1.57.1

### Patch Changes

- Updated dependencies [[`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc), [`8ad28c7`](https://github.com/likec4/likec4/commit/8ad28c777c76f294483c352180c7e3ea037eddfd), [`75e1510`](https://github.com/likec4/likec4/commit/75e1510def804bf9931bf222b03d1034e1181d04)]:
  - @likec4/core@1.57.1
  - @likec4/config@1.57.1
  - @likec4/log@1.57.1

## 1.57.0

### Minor Changes

- [#2935](https://github.com/likec4/likec4/pull/2935) [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d) Thanks [@Kiiv](https://github.com/Kiiv)! - feat: add `includeAncestors` property to deployment views to include all ancestors of visible nodes. Fix https://github.com/likec4/likec4/issues/1483

### Patch Changes

- [#2976](https://github.com/likec4/likec4/pull/2976) [`783155b`](https://github.com/likec4/likec4/commit/783155bba49ec60485af2c7f420fbb28e893955c) Thanks [@davydkov](https://github.com/davydkov)! - Rename public helpers for clarity:

  - `operators` → `ops`
  - `print` → `printOperation`
  - `printTabIndent` → `printWithTabIndent`

- Updated dependencies [[`311b93d`](https://github.com/likec4/likec4/commit/311b93de360556b9583b901c5ad3d6692b9c9f03), [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d)]:
  - @likec4/core@1.57.0
  - @likec4/config@1.57.0
  - @likec4/log@1.57.0

## 1.56.0

### Patch Changes

- Updated dependencies [[`af34764`](https://github.com/likec4/likec4/commit/af3476421fd8938a897240ad6fd1c70068d1e070), [`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d), [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a)]:
  - @likec4/log@1.56.0
  - @likec4/core@1.56.0
  - @likec4/config@1.56.0

## 1.55.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.55.1
  - @likec4/config@1.55.1
  - @likec4/log@1.55.1

## 1.55.0

### Patch Changes

- Updated dependencies [[`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b), [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8), [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383), [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e), [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad)]:
  - @likec4/core@1.55.0
  - @likec4/config@1.55.0
  - @likec4/log@1.55.0

## 1.54.0

### Patch Changes

- [#2825](https://github.com/likec4/likec4/pull/2825) [`b6f6a35`](https://github.com/likec4/likec4/commit/b6f6a35aff00e141c8f0a04686579b08773c2d7b) Thanks [@kavishkartha05](https://github.com/kavishkartha05)! - Fix LikeC4 generator not emitting element name in DSL output
  Fixes [#2815](https://github.com/likec4/likec4/issues/2815)
- Updated dependencies []:
  - @likec4/config@1.54.0
  - @likec4/core@1.54.0
  - @likec4/log@1.54.0

## 1.53.0

### Minor Changes

- [#2768](https://github.com/likec4/likec4/pull/2768) [`cf5acbc`](https://github.com/likec4/likec4/commit/cf5acbcb8410cd66342e39a490fcfd9d91619916) Thanks [@sraphaz](https://github.com/sraphaz)! - feat(leanix-bridge): Phase 2 & 3, CLI, tooling docs (Draw.io + CLI)

  **@likec4/leanix-bridge**

  - Phase 2: `fetchLeanixInventorySnapshot`, `reconcileInventoryWithManifest` (inbound)
  - Phase 3: `buildDriftReport`, `impactReportFromSyncPlan`, `generateAdrFromReconciliation`, `generateAdrFromDriftReport`, `runGovernanceChecks`
  - Refactors: sync-to-leanix, to-bridge-manifest, to-leanix-inventory-dry-run, report, leanix-api-client, drawio-leanix-roundtrip

  **likec4 (CLI)**

  - `gen leanix-inventory-snapshot`, `gen leanix-reconcile`; `sync leanix` (dry-run / apply)
  - Shared LeanIX API client for snapshot and sync

  **@likec4/docs-astro**

  - Draw.io: Export profiles (default / leanix), bridge-managed metadata
  - CLI: `--profile` option for Export to DrawIO

  **@likec4/generators**

  - Parse Draw.io: compatibility with bridge-managed metadata

### Patch Changes

- [#2685](https://github.com/likec4/likec4/pull/2685) [`d4aa31a`](https://github.com/likec4/likec4/commit/d4aa31ac1c1f14381a35f59d00880e75c7a4332e) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: infer shape person on re-import for round-trip fidelity

  - **Import:** `inferKind()` now treats `shape=actor` as actor (alongside `umlactor` and `shape=person`). `inferShape()` returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get `actor 'title'` and an explicit `style { shape person }` in the emitted .c4 source. Round-trip: export may emit person as `shape=actor` or `shape=umlActor`; import recognizes both via `inferKind()` and `inferShape()` so cells become actor with shape person.

- [#2746](https://github.com/likec4/likec4/pull/2746) [`bb95d5a`](https://github.com/likec4/likec4/commit/bb95d5a601f630b0d8deb73ac4e83191b00a33c1) Thanks [@sraphaz](https://github.com/sraphaz)! - LeanIX bridge (dry-run) and Draw.io bridge-managed export profile

  **@likec4/leanix-bridge (new package)**

  - Identity manifest and LeanIX-shaped dry-run artifacts (no live sync)
  - Pure functions: `toBridgeManifest`, `toLeanixInventoryDryRun`, `toReport`
  - Configurable mapping (kinds → fact sheet types, relation kinds → relation types)
  - Outputs: manifest.json, leanix-dry-run.json, report.json
  - Use via custom generator; see package README

  **@likec4/generators**

  - Draw.io export profile `leanix`: adds bridge-managed metadata (bridgeManaged, likec4Id, likec4Kind, likec4ViewId, likec4ProjectId, likec4RelationId, optional leanixFactSheetType) for round-trip and LeanIX interoperability
  - New options: `profile`, `projectId`, `leanixFactSheetTypeByKind`
  - Export type `DrawioExportProfile`

  **likec4**

  - CLI: `likec4 export drawio --profile leanix` to emit bridge-managed .drawio files

- Updated dependencies [[`22cde07`](https://github.com/likec4/likec4/commit/22cde07331a7d375d30c1220a1603576e8438735), [`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/config@1.53.0
  - @likec4/core@1.53.0
  - @likec4/log@1.53.0

## 1.52.0

### Patch Changes

- [#2685](https://github.com/likec4/likec4/pull/2685) [`a80d2e8`](https://github.com/likec4/likec4/commit/a80d2e85c8c508236262156d4ef45e28750c295c) Thanks [@sraphaz](https://github.com/sraphaz)! - Draw.io: infer shape person on re-import for round-trip fidelity

  - **Import:** `inferKind()` now treats `shape=actor` as actor (alongside `umlactor` and `shape=person`). `inferShape()` returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get `actor 'title'` and an explicit `style { shape person }` in the emitted .c4 source. Round-trip: export may emit person as `shape=actor` or `shape=umlActor`; import recognizes both via `inferKind()` and `inferShape()` so cells become actor with shape person.

- [#2682](https://github.com/likec4/likec4/pull/2682) [`aab9343`](https://github.com/likec4/likec4/commit/aab9343f0e149d978915a13429ff367dc284937b) Thanks [@davydkov](https://github.com/davydkov)! - Fix Draw.io export rendering elements with `shape person` as ellipses instead of person/actor shapes. Fixes [#2679](https://github.com/likec4/likec4/issues/2679).

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
