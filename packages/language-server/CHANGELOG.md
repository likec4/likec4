# @likec4/language-server

## 1.60.1

### Patch Changes

- [#3496](https://github.com/likec4/likec4/pull/3496) [`615a6d1`](https://github.com/likec4/likec4/commit/615a6d194299331fe361ae52087e638b590389a7) Thanks [@davydkov](https://github.com/davydkov)! - TypeScript and JavaScript project configs (`likec4.config.ts`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.js`) are no longer experimental. They are now loaded with [jiti](https://github.com/unjs/jiti) instead of esbuild: loading no longer writes temporary `*.bundled_*.mjs` files next to your config, the VSCode extension loads configs faster and is smaller, and `esbuild` is no longer installed with `likec4`, `@likec4/lsp` and `@likec4/mcp`. If you use `@likec4/config` or `@likec4/language-server` directly, install `jiti` instead of `bundle-require` and `esbuild` to load non-JSON configs.
  
  Fixed: changes to a project config (for example, title or styles) were not applied to the model until the project files were edited.

- [#3354](https://github.com/likec4/likec4/pull/3354) [`aaa53f4`](https://github.com/likec4/likec4/commit/aaa53f42e7e3d20aa0cc85b7c63b4d2b1753738c) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Support styled and nested `group` boundaries around deployment nodes and instances in deployment views.

- [#3495](https://github.com/likec4/likec4/pull/3495) [`2f29031`](https://github.com/likec4/likec4/commit/2f29031acc36016d77502734923a0ef585051943) Thanks [@davydkov](https://github.com/davydkov)! - `diagrams()` is deprecated, use `layoutedModel()` instead. Manual layouts are applied by the views of the layouted model: `model.view(id).$layouted` returns the view with manual layout applied, `$view` returns the latest auto layout.
  
  The `likec4/fetchLayoutedModel` LSP request now returns the same data as `layoutedModel()`: views are auto-layouted and manual layouts are in `manualLayouts`. Use `LikeC4Model.create(model).view(id).$layouted` to get a view with manual layout applied.

- [#3317](https://github.com/likec4/likec4/pull/3317) [`aa82a7c`](https://github.com/likec4/likec4/commit/aa82a7c36f62ecf11c38ff567a18539eece001fa) Thanks [@paoValle](https://github.com/paoValle)! - Add `descriptionFile` to reference a markdown file as the description of an element, a relation or a view. The path is resolved relative to the `.c4` file that uses it and must stay inside the project folder; the folder and the file are both canonicalized, so a symbolic link that points outside the project is refused too. A file that cannot be read is reported as an error.

- [#3479](https://github.com/likec4/likec4/pull/3479) [`5918048`](https://github.com/likec4/likec4/commit/5918048ad85879b8dfd595c5cdfe49ce07db9d17) Thanks [@parse](https://github.com/parse)! - Export the syntax tree types as `ast` (type-only) from `likec4` and `@likec4/language-server`, so tools built on the language services can type the nodes they read, for example `import type { ast } from 'likec4'` and `ast.Relation`.

- [`a3558b3`](https://github.com/likec4/likec4/commit/a3558b394d62f44047c38d17c1f71308c55e5251) Thanks [@davydkov](https://github.com/davydkov)! - Relationship kinds in the model specification are no longer nested under `style`. Steps of dynamic views now take color, line and arrows from the relationship kind, and the description and title of a relationship kind are available in the exported model.

- [#3389](https://github.com/likec4/likec4/pull/3389) [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Add Google Material Symbols support through the `md:` icon prefix.

- [#3491](https://github.com/likec4/likec4/pull/3491) [`3a4bb8b`](https://github.com/likec4/likec4/commit/3a4bb8bd62ff1ce2af560d6280622cd5908395c6) Thanks [@davydkov](https://github.com/davydkov)! - Link to elements and views from Markdown values: `[[cloud.api]]`, `[[cloud.api|label]]` and `[[view:index]]`. In the editor, typing `[[` suggests elements and views of the project, links are highlighted, broken links and unknown prefixes get a warning, and go to definition (Ctrl+click, F12) jumps to the element or view. Inside tables, write the label separator as `\\|`; a literal `[[` is written as `\\[[`.
  
  Implements [#2804](https://github.com/likec4/likec4/issues/2804).

- [#3382](https://github.com/likec4/likec4/pull/3382) [`d00fa0c`](https://github.com/likec4/likec4/commit/d00fa0ce7ed3402c087a4e6e6d58cb1451ea2b9e) Thanks [@davydkov](https://github.com/davydkov)! - Faster model updates while editing: parsed and computed models are cached and rebuilt only for affected projects.
  
  - Elements, views and styles with validation errors are now excluded from the model (previously they could leak into diagrams). Duplicated global styles and views are reported and excluded, as the order of documents is not deterministic.
  - Fix project importing elements from another project not picking up changes in the imported project.

- [#3366](https://github.com/likec4/likec4/pull/3366) [`ca1ba7b`](https://github.com/likec4/likec4/commit/ca1ba7b20116671ac1d2c3a71408d5e504e21989) Thanks [@edeak-jsq](https://github.com/edeak-jsq)! - Model diffs, see [discussion #1192](https://github.com/likec4/likec4/discussions/1192): new `diff` block, a named change set of the model (`remove` elements and relationships, `add` model elements, `extend` existing elements). The model stays as is: diffs are validated against it, and views can reference elements that a diff adds.

- [#3366](https://github.com/likec4/likec4/pull/3366) [`c313fb0`](https://github.com/likec4/likec4/commit/c313fb0ad5428e6cec5f752dcdf0d290a686b0dc) Thanks [@edeak-jsq](https://github.com/edeak-jsq)! - Model diffs: apply, discard and safe delete, see [discussion #1192](https://github.com/likec4/likec4/discussions/1192):
  
  - Apply or discard a diff: the `add` blocks are merged into the element definitions of the model files. Code actions in the editor, `likec4 diff list`, and `likec4 diff apply|discard [--dry-run]`.
  - Overlapping diffs (both change the same element or relationship, or one depends on the other) are reported on both diffs and never resolved automatically: applying an overlapping diff needs a confirmation (`--accept-overlaps`). Other diffs are never edited; the diffs an edit breaks are reported.
  - Safe delete: remove an element and everything that references it in one edit, with a dry run that reports relationships, deployed instances, affected views and orphans. Code action in the editor, `likec4 safe-delete [--dry-run]`, and the MCP tools `removal-impact` and `list-diffs`.

- [#3463](https://github.com/likec4/likec4/pull/3463) [`75e32e1`](https://github.com/likec4/likec4/commit/75e32e1e11cdcac0879357438eb22e03e5bb66e6) Thanks [@davydkov](https://github.com/davydkov)! - Reduce memory usage with library icons (don't create unnecessary AST nodes)

- [`e3d12de`](https://github.com/likec4/likec4/commit/e3d12deba102c952f9611529f058af3c122fe85f) Thanks [@davydkov](https://github.com/davydkov)! - The language server now watches project configs, manual layout snapshots and description files itself, using file change notifications from the editor. Any LSP client gets these updates, not only VS Code, and the CLI and Vite plugin handle changes the same way.
  
  - A changed description file (`descriptionFile`) updates the model in the editor.
  - Deleting, moving or copying a folder updates the documents inside it, removes its manual layouts, and reloads the projects it contained.
  - Saving a project config without actual changes (whitespace, comments) no longer rebuilds the project.
  - Applying model edits no longer fails in the browser (VS Code for the Web).
  
  `DidChangeSnapshotNotification` is removed from the language server protocol, the server no longer needs it.
- Updated dependencies [[`615a6d1`](https://github.com/likec4/likec4/commit/615a6d194299331fe361ae52087e638b590389a7), [`aaa53f4`](https://github.com/likec4/likec4/commit/aaa53f42e7e3d20aa0cc85b7c63b4d2b1753738c), [`773bd9c`](https://github.com/likec4/likec4/commit/773bd9ce38ec781849cd2d941b59b5ea1468af76), [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27), [`c5eaa85`](https://github.com/likec4/likec4/commit/c5eaa85423a74f43f3e233e3c2db5aade1b9ed12), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`3a4bb8b`](https://github.com/likec4/likec4/commit/3a4bb8bd62ff1ce2af560d6280622cd5908395c6), [`b7ebce3`](https://github.com/likec4/likec4/commit/b7ebce3c1cdd0f9d92ff284a82e09e07b76f935d), [`5d6ba6b`](https://github.com/likec4/likec4/commit/5d6ba6bc428fdbf6a224cdb2b65187ca162d8a45), [`6756c79`](https://github.com/likec4/likec4/commit/6756c790d86400b5b5dd2db7a749fe0c3ce0ab26), [`ca1ba7b`](https://github.com/likec4/likec4/commit/ca1ba7b20116671ac1d2c3a71408d5e504e21989), [`c313fb0`](https://github.com/likec4/likec4/commit/c313fb0ad5428e6cec5f752dcdf0d290a686b0dc), [`9e106b8`](https://github.com/likec4/likec4/commit/9e106b8d205b589d49e9c72d2a80dcdfb74a4aa1)]:
  - @likec4/config@1.60.1
  - @likec4/core@1.60.1
  - @likec4/generators@1.60.1
  - @likec4/layouts@1.60.1
  - @likec4/log@1.60.1

## 1.60.0

### Patch Changes

- [#3310](https://github.com/likec4/likec4/pull/3310) [`1fb8e00`](https://github.com/likec4/likec4/commit/1fb8e00a8324bcd4a691025b6228e445150dcc6a) Thanks [@davydkov](https://github.com/davydkov)! - Add new `agent` element shape

- [#3278](https://github.com/likec4/likec4/pull/3278) [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75) Thanks [@alexhelkar](https://github.com/alexhelkar)! - Switch edge routing between `spline` and `ortho` from the diagram editor's layout panel. The choice is written to the view source as the `routing` property or as the `autoLayout` routing parameter, and stays available for views with a manual layout. Changing the auto-layout direction no longer drops a routing parameter set on the `autoLayout` rule.

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

- [#3278](https://github.com/likec4/likec4/pull/3278) [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75) Thanks [@alexhelkar](https://github.com/alexhelkar)! - Add orthogonal edge routing to draw relationships with horizontal and vertical segments. Set `routing ortho` in a view, append `ortho` to `autoLayout`, or set `styles.defaults.view.routing` in the project configuration. The default remains `spline`. Changing routing preserves saved node positions and connection control points.
  
  Place automatic labels beside long straight segments, avoiding nodes, other labels, and relationship lines where space permits. Labels update after layout and node moves. Manually positioned labels retain their position or offset during editing.
  
  Separate shared segments of edited orthogonal edges into tracks with a target spacing of 12 diagram units. Track shifts also separate connection points along node borders, subject to the space available at each endpoint.
  
  Keep edited edge labels centered under spline routing, preventing the initial jump by half the label's size.
  
  Keep labels and separated tracks aligned with edited edges when connection handles are offset from node centers.
- Updated dependencies [[`1fb8e00`](https://github.com/likec4/likec4/commit/1fb8e00a8324bcd4a691025b6228e445150dcc6a), [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75), [`1c22fb0`](https://github.com/likec4/likec4/commit/1c22fb0bc42d9a0c7a9411efba39546aeeb55437), [`a25fcfa`](https://github.com/likec4/likec4/commit/a25fcfae8e47f3c5c3189b3e534a9c9be4a6aead), [`feb3f4e`](https://github.com/likec4/likec4/commit/feb3f4e4cacb9f456161145f97aeed7143160599), [`1332900`](https://github.com/likec4/likec4/commit/1332900ecc79a10aaa81c5aef2334c6a018974dc), [`2bf291e`](https://github.com/likec4/likec4/commit/2bf291e6deec01c679e62c881a394eb9a53c51cd), [`57c70ef`](https://github.com/likec4/likec4/commit/57c70ef0952cae0c31d53ef6f266495e92a7661c), [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75)]:
  - @likec4/generators@1.60.0
  - @likec4/core@1.60.0
  - @likec4/layouts@1.60.0
  - @likec4/config@1.60.0
  - @likec4/log@1.60.0

## 1.59.4

### Patch Changes

- [#3227](https://github.com/likec4/likec4/pull/3227) [`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Deployment relationships now support the `<->` and `-[kind]<->` bidirectional syntax introduced in v1.59.3.

- [#3268](https://github.com/likec4/likec4/pull/3268) [`d26c5e4`](https://github.com/likec4/likec4/commit/d26c5e44a9b356cfff6b7105219db06fb7824ff8) Thanks [@cry999](https://github.com/cry999)! - Keep visual style edits inside the selected view when it has no style rules, including dynamic views and empty views that extend another view. This prevents duplicate shared styles and unintended changes to other views.

  Fixes [#3265](https://github.com/likec4/likec4/issues/3265).

- [`f0f3ec6`](https://github.com/likec4/likec4/commit/f0f3ec65212ff0bd0e7d2849d11bebeeeb070c90) Thanks [@davydkov](https://github.com/davydkov)! - Improve how edits made from the UI are written back to the source:

  - Element style rules are inserted inside the view body with correct indentation, and existing style properties are updated in place instead of drifting.
  - View tags are written as a complete set. Clearing the last tag removes the tags line, and `ViewChange.ChangeProperty` now takes `tags` instead of `tag: { add, remove }`.
  - Renaming a view no longer repeats the folder path it already lives in.
  - Elements no longer report tags that are missing from the specification, which could happen for imported elements. `LikeC4Model.tagsFromSpecification` returns all declared tags.

- [#3228](https://github.com/likec4/likec4/pull/3228) [`4caa142`](https://github.com/likec4/likec4/commit/4caa14264512d852e2ec115b99abbf4fd51d6abc) Thanks [@MandarinOptimizer](https://github.com/MandarinOptimizer)! - Honor editor workspace exclusions before traversing folders during project and model discovery, avoiding unnecessary scans of excluded generated files and runtime storage.
- Updated dependencies [[`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad), [`add966b`](https://github.com/likec4/likec4/commit/add966b37a0df38e57b84181c3d67f973c099dd2), [`57c097c`](https://github.com/likec4/likec4/commit/57c097c53acdc28347922763aa39e96c3d4d8a5d), [`f0f3ec6`](https://github.com/likec4/likec4/commit/f0f3ec65212ff0bd0e7d2849d11bebeeeb070c90), [`4b59d64`](https://github.com/likec4/likec4/commit/4b59d6464a2ff347ffc6380037f5c5899a38b5de)]:
  - @likec4/core@1.59.4
  - @likec4/generators@1.59.4
  - @likec4/config@1.59.4
  - @likec4/layouts@1.59.4
  - @likec4/log@1.59.4

## 1.59.3

### Patch Changes

- [#3174](https://github.com/likec4/likec4/pull/3174) [`17c73c1`](https://github.com/likec4/likec4/commit/17c73c18f317641f14d339b70deb76bb3c20d4b2) Thanks [@kgeilmann](https://github.com/kgeilmann)! - Add `preview-view` MCP tool that renders a preview of a LikeC4 view defined by DSL text within the context of an existing project's real elements, without saving changes to disk. If the view ID matches an already existing view, an error is returned. This allows users to experiment with view definitions before adding them to the project.

- [#3150](https://github.com/likec4/likec4/pull/3150) [`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c) Thanks [@merlincat11](https://github.com/merlincat11)! - Add optional view order metadata for sorting sibling views in navigation.

- [#3215](https://github.com/likec4/likec4/pull/3215) [`39dc9cf`](https://github.com/likec4/likec4/commit/39dc9cfc729d2e92d9dd0bb4553ed5abca0a3e5d) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Allow escaping a forward slash in a title with `\/` so it doesn't create a view folder. This also applies to element titles, so `implicitViews` no longer split an auto-generated view into an unwanted subfolder when the element's title contains a slash.

- [#2949](https://github.com/likec4/likec4/pull/2949) [`dc7eba2`](https://github.com/likec4/likec4/commit/dc7eba24559706f2e41ee5f8bfd66e79363de435) Thanks [@ckeller42](https://github.com/ckeller42)! - Allow model relationships to use the documented `<->` and `-[kind]<->` syntax, preserve bidirectional semantics through styling and relationship extensions, and include/exclude them from either endpoint in view relationship expressions. Fixes [#2927](https://github.com/likec4/likec4/issues/2927).

- [#3146](https://github.com/likec4/likec4/pull/3146) [`945ac39`](https://github.com/likec4/likec4/commit/945ac390524a93df4a0a22670e73686d42c662c2) Thanks [@farhan523](https://github.com/farhan523)! - Fix keyword completions inserting the keyword twice (e.g. `modelmodel`) in editors other than VS Code. Snippet and property completions now provide an explicit text edit that replaces the typed prefix, instead of relying on the client to prefer it over the plain insert text.

- [#3151](https://github.com/likec4/likec4/pull/3151) [`603d274`](https://github.com/likec4/likec4/commit/603d2747f3a1c46c1cf84857b637c1fe56f511f9) Thanks [@bounce12340](https://github.com/bounce12340)! - Fix outline entries merging an element's kind into its name, such as `modelmodel`. The kind now renders in parentheses. Fixes [#3091](https://github.com/likec4/likec4/issues/3091)

- [#3143](https://github.com/likec4/likec4/pull/3143) [`31d2e10`](https://github.com/likec4/likec4/commit/31d2e101937d178155e9764eaa2b5ad773fc1a0b) Thanks [@ckeller42](https://github.com/ckeller42)! - Preserve imported project prefixes for scoped `view of` element views.

- [#3156](https://github.com/likec4/likec4/pull/3156) [`797907a`](https://github.com/likec4/likec4/commit/797907a50098c64f50c22ec301183140c38ac33f) Thanks [@ckeller42](https://github.com/ckeller42)! - Avoid overlapping-area warnings when multiple projects intentionally include the same shared folder. Nested or partially overlapping include paths still warn because those can make file ownership ambiguous. Fixes [#2973](https://github.com/likec4/likec4/issues/2973).

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

- [#3188](https://github.com/likec4/likec4/pull/3188) [`d3d597a`](https://github.com/likec4/likec4/commit/d3d597ad1cdfe3b8735744353518339c794b8d28) Thanks [@Phrogz](https://github.com/Phrogz)! - Allow saving and resetting manual layouts for implicit element views.
- Updated dependencies [[`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c), [`39dc9cf`](https://github.com/likec4/likec4/commit/39dc9cfc729d2e92d9dd0bb4553ed5abca0a3e5d), [`dc7eba2`](https://github.com/likec4/likec4/commit/dc7eba24559706f2e41ee5f8bfd66e79363de435), [`bdefe0b`](https://github.com/likec4/likec4/commit/bdefe0b4983a86518bf4a5359bd5ba1511c8473a), [`260ac73`](https://github.com/likec4/likec4/commit/260ac730bdfdeb5a27d4a23497b14ad3e2670de6), [`8a4a690`](https://github.com/likec4/likec4/commit/8a4a6905d5cfd63c1c2e443ea93ad86aba474d5e), [`5b09f1d`](https://github.com/likec4/likec4/commit/5b09f1d2880664635f40b2fb21781332144e75c9), [`61677a8`](https://github.com/likec4/likec4/commit/61677a8e5861f36c12e4f379f1623d9af455fa30)]:
  - @likec4/core@1.59.3
  - @likec4/generators@1.59.3
  - @likec4/config@1.59.3
  - @likec4/layouts@1.59.3
  - @likec4/log@1.59.3

## 1.59.2

### Patch Changes

- [#3135](https://github.com/likec4/likec4/pull/3135) [`1d2575a`](https://github.com/likec4/likec4/commit/1d2575a8abf1cdf48dde3e5f509a087b855b18f4) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix dynamic views that reference imported elements from another project.

  Fixes [#2989](https://github.com/likec4/likec4/issues/2989)

- [#3114](https://github.com/likec4/likec4/pull/3114) [`4b5deac`](https://github.com/likec4/likec4/commit/4b5deac079439b3b6b3dd6eefa78acda2af6ea42) Thanks [@ckeller42](https://github.com/ckeller42)! - Allow dynamic view flow keywords such as `alt` to be used as metadata keys again.

  Fixes [#3110](https://github.com/likec4/likec4/issues/3110)

- Updated dependencies []:
  - @likec4/config@1.59.2
  - @likec4/core@1.59.2
  - @likec4/generators@1.59.2
  - @likec4/layouts@1.59.2
  - @likec4/log@1.59.2

## 1.59.1

### Patch Changes

- [#3107](https://github.com/likec4/likec4/pull/3107) [`3db77c8`](https://github.com/likec4/likec4/commit/3db77c8ee4134e211019c2c7571b1c188910951d) Thanks [@ckeller42](https://github.com/ckeller42)! - Project excludes now match Windows drive-letter URI paths, and workspace startup loads files from configured include paths.

  Fixes [#2546](https://github.com/likec4/likec4/issues/2546)

- Updated dependencies []:
  - @likec4/config@1.59.1
  - @likec4/core@1.59.1
  - @likec4/generators@1.59.1
  - @likec4/layouts@1.59.1
  - @likec4/log@1.59.1

## 1.59.0

### Minor Changes

- [#3053](https://github.com/likec4/likec4/pull/3053) [`d0a05fe`](https://github.com/likec4/likec4/commit/d0a05fe8e29105444762542c78c9861a13bfaff0) Thanks [@farhan523](https://github.com/farhan523)! - Allow defining `title`, `description` and links on relationship kinds in the `specification`, the same way as for element kinds. These properties are inherited by every relationship of that kind and can be overridden per relationship.

  ```likec4
  specification {
    relationship async {
      title 'Asynchronous'
      description 'Communication over a message broker'
      link https://example.com/async
    }
  }
  ```

  Closes [#2260](https://github.com/likec4/likec4/issues/2260)

- [#3083](https://github.com/likec4/likec4/pull/3083) [`1814846`](https://github.com/likec4/likec4/commit/1814846f629971cec2a392222ab00c42abea47ed) Thanks [@farhan523](https://github.com/farhan523)! - Allow defining tags on relationship kinds in the `specification`, the same way as for element kinds. Tags are inherited by every relationship of that kind (merged with the relationship's own tags), so they can be used in view predicates like `where tag is #tcp`.

  ```likec4
  specification {
    relationship https {
      #tcp
      head diamond
    }
    tag tcp
  }
  ```

  Closes [#2533](https://github.com/likec4/likec4/issues/2533)

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

- [#3093](https://github.com/likec4/likec4/pull/3093) [`196988d`](https://github.com/likec4/likec4/commit/196988d8a8fbbc3841200971233be6bda2b517be) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix project `exclude` patterns so they also filter matching files loaded through `include.paths`.

- [#3058](https://github.com/likec4/likec4/pull/3058) [`56d26c1`](https://github.com/likec4/likec4/commit/56d26c1baec4b2ce78a31d22339b90d62452c901) Thanks [@Vinceveve](https://github.com/Vinceveve)! - Fix `EMFILE: too many open files, watch` crash in `likec4 serve`/`dev` on large repositories.

  The file watcher now honors the project's `exclude` patterns from `likec4.config.json`, consistent with how the source scan already filters files. Previously the watcher descended into every directory regardless of `exclude` (it only skipped `node_modules`/`.git` and non-`.c4` files), so on repositories where `.c4` files are a small fraction of a large tree it could exhaust the OS file-watch limit and crash on startup.

- Updated dependencies [[`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4), [`0994577`](https://github.com/likec4/likec4/commit/09945775fb0c4c64b79eae6f17ee0abce92ef8f1), [`9b9727f`](https://github.com/likec4/likec4/commit/9b9727fcd1201296c4d7e09f7446edd38669328a), [`d0a05fe`](https://github.com/likec4/likec4/commit/d0a05fe8e29105444762542c78c9861a13bfaff0), [`1814846`](https://github.com/likec4/likec4/commit/1814846f629971cec2a392222ab00c42abea47ed), [`061e687`](https://github.com/likec4/likec4/commit/061e6872ee80b1381d3ec047663a22d1ebe6bab5)]:
  - @likec4/core@1.59.0
  - @likec4/layouts@1.59.0
  - @likec4/generators@1.59.0
  - @likec4/config@1.59.0
  - @likec4/log@1.59.0

## 1.57.1

### Patch Changes

- [#2985](https://github.com/likec4/likec4/pull/2985) [`e2ad89e`](https://github.com/likec4/likec4/commit/e2ad89e6206af2ea51ac5b6dcf4aceee2e1e4dfc) Thanks [@farhan523](https://github.com/farhan523)! - Nested `parallel` blocks in dynamic views now produce a clear validation error (`Nested parallel blocks are not allowed`) instead of a cryptic parser error. The grammar is loosened to accept the nested form so the validator can attach a diagnostic to the inner block. Resolves [#988](https://github.com/likec4/likec4/issues/988).

- Updated dependencies [[`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc), [`8ad28c7`](https://github.com/likec4/likec4/commit/8ad28c777c76f294483c352180c7e3ea037eddfd), [`75e1510`](https://github.com/likec4/likec4/commit/75e1510def804bf9931bf222b03d1034e1181d04)]:
  - @likec4/core@1.57.1
  - @likec4/config@1.57.1
  - @likec4/generators@1.57.1
  - @likec4/layouts@1.57.1
  - @likec4/log@1.57.1

## 1.57.0

### Minor Changes

- [#2939](https://github.com/likec4/likec4/pull/2939) [`311b93d`](https://github.com/likec4/likec4/commit/311b93de360556b9583b901c5ad3d6692b9c9f03) Thanks [@galuszkak](https://github.com/galuszkak)! - Support expanding merged relationships into separate edges with the `multiple` flag. Set `multiple true` on a relationship kind in `specification`, or per-view via `with { multiple true }`, to show each relationship as its own edge with its own label instead of merging them into a single `[...]` edge. Resolves [#663](https://github.com/likec4/likec4/issues/663).

- [#2935](https://github.com/likec4/likec4/pull/2935) [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d) Thanks [@Kiiv](https://github.com/Kiiv)! - feat: add `includeAncestors` property to deployment views to include all ancestors of visible nodes. Fix https://github.com/likec4/likec4/issues/1483

### Patch Changes

- [#2944](https://github.com/likec4/likec4/pull/2944) [`1c70ea0`](https://github.com/likec4/likec4/commit/1c70ea023adb628457269d8a9d932b88d4bc2887) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix formatter preserving metadata arrays instead of converting them to strings.

- [#2948](https://github.com/likec4/likec4/pull/2948) [`9637876`](https://github.com/likec4/likec4/commit/96378760c468d10810d769fcfc7dcf6fef0dfc03) Thanks [@ckeller42](https://github.com/ckeller42)! - Fixes [#2932](https://github.com/likec4/likec4/issues/2932) by allowing reserved keywords such as `group` as metadata keys.

- Updated dependencies [[`b7ff481`](https://github.com/likec4/likec4/commit/b7ff48171a0812978857af3f9edbffc6bdfeac9f), [`783155b`](https://github.com/likec4/likec4/commit/783155bba49ec60485af2c7f420fbb28e893955c), [`311b93d`](https://github.com/likec4/likec4/commit/311b93de360556b9583b901c5ad3d6692b9c9f03), [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d)]:
  - @likec4/layouts@1.57.0
  - @likec4/generators@1.57.0
  - @likec4/core@1.57.0
  - @likec4/config@1.57.0
  - @likec4/log@1.57.0

## 1.56.0

### Minor Changes

- [#2912](https://github.com/likec4/likec4/pull/2912) [`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d) Thanks [@Kiiv](https://github.com/Kiiv)! - Improve color palette used for element rendering to be more accurate with the color specified by the user. Fix https://github.com/likec4/likec4/issues/2101

### Patch Changes

- [#2904](https://github.com/likec4/likec4/pull/2904) [`935f6bb`](https://github.com/likec4/likec4/commit/935f6bb3fc42b88669bd8af65947a201f8e3d490) Thanks [@davydkov](https://github.com/davydkov)! - Support applying view changes without LSP connection (e.g. in vite-plugin/CLI mode)

- Updated dependencies [[`af34764`](https://github.com/likec4/likec4/commit/af3476421fd8938a897240ad6fd1c70068d1e070), [`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d), [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a)]:
  - @likec4/log@1.56.0
  - @likec4/core@1.56.0
  - @likec4/config@1.56.0
  - @likec4/layouts@1.56.0

## 1.55.1

### Patch Changes

- [#2897](https://github.com/likec4/likec4/pull/2897) [`41ee8b7`](https://github.com/likec4/likec4/commit/41ee8b715fabecf8022a3440c971adeea1e8f9a3) Thanks [@davydkov](https://github.com/davydkov)! - Allow using reserved keyword `relationship` as an identifier in LikeC4 DSL (i.e. as element kind)

- Updated dependencies []:
  - @likec4/core@1.55.1
  - @likec4/config@1.55.1
  - @likec4/layouts@1.55.1
  - @likec4/log@1.55.1

## 1.55.0

### Patch Changes

- [#2877](https://github.com/likec4/likec4/pull/2877) [`51adb85`](https://github.com/likec4/likec4/commit/51adb85ad1097cdd4c95f9082533c8b33b124a42) Thanks [@davydkov](https://github.com/davydkov)! - Extract MCP server and tools to `@likec4/mcp` package. This will allow us to reuse MCP server and tools in other projects, and also will make the codebase cleaner and more modular.

- [#2861](https://github.com/likec4/likec4/pull/2861) [`9687f89`](https://github.com/likec4/likec4/commit/9687f8974309de08001db3699e8712c7beac2b07) Thanks [@davydkov](https://github.com/davydkov)! - Add `likec4.exclude` VS Code setting to exclude files and folders from LikeC4 processing via glob patterns

- Updated dependencies [[`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b), [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8), [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383), [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e), [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad)]:
  - @likec4/core@1.55.0
  - @likec4/config@1.55.0
  - @likec4/layouts@1.55.0
  - @likec4/log@1.55.0

## 1.54.0

### Patch Changes

- [#2832](https://github.com/likec4/likec4/pull/2832) [`302f020`](https://github.com/likec4/likec4/commit/302f020e4e892d94159255a876da0119f9c8d9c9) Thanks [@davydkov](https://github.com/davydkov)! - Add `list-icons` CLI command to list all available built-in icons with `--format text|json` and `--group` filter options

- [#2845](https://github.com/likec4/likec4/pull/2845) [`06ca18f`](https://github.com/likec4/likec4/commit/06ca18f9f0d69602917ff90b65e165bd8edffb25) Thanks [@davydkov](https://github.com/davydkov)! - Fix element names starting with underscore followed by digit (e.g. `_1password`) being incorrectly rejected by the parser

  Fixes [#2836](https://github.com/likec4/likec4/issues/2836)

- Updated dependencies []:
  - @likec4/config@1.54.0
  - @likec4/core@1.54.0
  - @likec4/layouts@1.54.0
  - @likec4/log@1.54.0

## 1.53.0

### Minor Changes

- [#2769](https://github.com/likec4/likec4/pull/2769) [`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7) Thanks [@galuszkak](https://github.com/galuszkak)! - Support `metadata` filtering in view predicates

  - Filter elements and relations by metadata key existence (`where metadata.key`) or value (`where metadata.key = 'value'`)
  - Works with `!=` for negation and supports `source.metadata` / `target.metadata` for relation participants

### Patch Changes

- Updated dependencies [[`22cde07`](https://github.com/likec4/likec4/commit/22cde07331a7d375d30c1220a1603576e8438735), [`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/config@1.53.0
  - @likec4/core@1.53.0
  - @likec4/layouts@1.53.0
  - @likec4/log@1.53.0

## 1.52.0

### Minor Changes

- [#2667](https://github.com/likec4/likec4/pull/2667) [`2c6a43d`](https://github.com/likec4/likec4/commit/2c6a43da4552dbd40473effba65c7b04e165a7f3) Thanks [@m9810223](https://github.com/m9810223)! - Add `likec4 format` (alias `fmt`) CLI command for formatting `.c4` source files

  - `@likec4/language-server` — add `format()` method to `LikeC4LanguageServices` with `projectIds`/`documentUris` filtering and LSP formatting options
  - `@likec4/language-services` — add `format()` method to `LikeC4` facade, translating project name strings to `ProjectId`
  - `likec4` — add `format` CLI command with `--check` mode for CI, `--project` and `--files` filtering

### Patch Changes

- [#2705](https://github.com/likec4/likec4/pull/2705) [`4d579d6`](https://github.com/likec4/likec4/commit/4d579d6990bd3f59fb8420d2adb0e246fd9dfdcc) Thanks [@davydkov](https://github.com/davydkov)! - Disable implicit views by default. Auto-generated scoped views for elements without explicit views are no longer created unless `"implicitViews": true` is set in the project config. To restore the previous behavior, add `"implicitViews": true` to your `likec4.json` configuration.

- [#2713](https://github.com/likec4/likec4/pull/2713) [`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3) Thanks [@davydkov](https://github.com/davydkov)! - Remove deprecated ManualLayoutV1 and related migration command

- Updated dependencies [[`4d579d6`](https://github.com/likec4/likec4/commit/4d579d6990bd3f59fb8420d2adb0e246fd9dfdcc), [`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/config@1.52.0
  - @likec4/core@1.52.0
  - @likec4/layouts@1.52.0
  - @likec4/log@1.52.0

## 1.51.0

### Patch Changes

- [#2681](https://github.com/likec4/likec4/pull/2681) [`70e0f7d`](https://github.com/likec4/likec4/commit/70e0f7db20c0945d37a6b2f77ad9722abf4706ce) Thanks [@davydkov](https://github.com/davydkov)! - Deprecate `likec4-language-server` from `@likec4/language-server` package. Use `likec4 lsp` instead.

- [#2683](https://github.com/likec4/likec4/pull/2683) [`026ef4a`](https://github.com/likec4/likec4/commit/026ef4ab673f07669f460d4b075918f5045ecddd) Thanks [@davydkov](https://github.com/davydkov)! - Fix "View title cannot contain newlines" error when using implicit views with elements that have multi-line titles

  Fixes [#2669](https://github.com/likec4/likec4/issues/2669), [#2672](https://github.com/likec4/likec4/issues/2672)

- Updated dependencies []:
  - @likec4/core@1.51.0
  - @likec4/config@1.51.0
  - @likec4/layouts@1.51.0
  - @likec4/log@1.51.0

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
