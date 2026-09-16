# @likec4/mcp

## 1.59.4

### Patch Changes

- [#3240](https://github.com/likec4/likec4/pull/3240) [`6050e61`](https://github.com/likec4/likec4/commit/6050e6109b979443695b5ebc17069d77611bb365) Thanks [@ckeller42](https://github.com/ckeller42)! - Advertise tool input and output schemas as JSON Schema 2020-12

- [#3232](https://github.com/likec4/likec4/pull/3232) [`df5e0ad`](https://github.com/likec4/likec4/commit/df5e0ad27e3d1190e7dc1c1112ec2f2955c639e4) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix `preview-view` for projects with non-default IDs.

- [#3249](https://github.com/likec4/likec4/pull/3249) [`dd113dd`](https://github.com/likec4/likec4/commit/dd113dd0c7840de1837b568ffae8c1b5e6a5121b) Thanks [@ckeller42](https://github.com/ckeller42)! - Let render-view callers set the initial canvas size hint and viewport behavior for embedded diagrams.

- [#3252](https://github.com/likec4/likec4/pull/3252) [`cd0d5c9`](https://github.com/likec4/likec4/commit/cd0d5c957db59dfc1b5a10c5c682695f7bf4617d) Thanks [@ckeller42](https://github.com/ckeller42)! - Honor the render-view `fitView` option without hiding navigation controls.

- [#3253](https://github.com/likec4/likec4/pull/3253) [`4f56b2d`](https://github.com/likec4/likec4/commit/4f56b2d4f0011c39805ed5ec0d12f167b869d2d6) Thanks [@ckeller42](https://github.com/ckeller42)! - Open interactive render-view diagrams in fullscreen when the MCP App host supports it.

- [#3246](https://github.com/likec4/likec4/pull/3246) [`f9cdd54`](https://github.com/likec4/likec4/commit/f9cdd54cf7c1e78141b629daacbb281e13dbcc63) Thanks [@ckeller42](https://github.com/ckeller42)! - Render workspace-local SVG icons and open element and relationship details in interactive MCP App diagrams.

- [#3226](https://github.com/likec4/likec4/pull/3226) [`a4e691b`](https://github.com/likec4/likec4/commit/a4e691b8d20ea4af0c5010e1de8f9c0ab5aadfa0) Thanks [@parse](https://github.com/parse)! - `batch-read-elements` now returns `links` and `sourceLocation` for each element, matching `read-element`. Reading those for many elements no longer needs one call per element.

- [#3246](https://github.com/likec4/likec4/pull/3246) [`f9cdd54`](https://github.com/likec4/likec4/commit/f9cdd54cf7c1e78141b629daacbb281e13dbcc63) Thanks [@ckeller42](https://github.com/ckeller42)! - Reduce `render-view` and `preview-view` payloads by returning only model data required by the selected view. Set `fullModel` to `true` to request the complete model.
- Updated dependencies [[`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad), [`cd0d5c9`](https://github.com/likec4/likec4/commit/cd0d5c957db59dfc1b5a10c5c682695f7bf4617d), [`dd113dd`](https://github.com/likec4/likec4/commit/dd113dd0c7840de1837b568ffae8c1b5e6a5121b), [`4b59d64`](https://github.com/likec4/likec4/commit/4b59d6464a2ff347ffc6380037f5c5899a38b5de), [`4caa142`](https://github.com/likec4/likec4/commit/4caa14264512d852e2ec115b99abbf4fd51d6abc)]:
  - @likec4/core@1.59.4
  - @likec4/language-server@1.59.4
  - @likec4/diagram@1.59.4
  - @likec4/config@1.59.4
  - @likec4/language-services@1.59.4
  - @likec4/layouts@1.59.4
  - @likec4/log@1.59.4

## 1.59.3

### Patch Changes

- [#3174](https://github.com/likec4/likec4/pull/3174) [`17c73c1`](https://github.com/likec4/likec4/commit/17c73c18f317641f14d339b70deb76bb3c20d4b2) Thanks [@kgeilmann](https://github.com/kgeilmann)! - Add `preview-view` MCP tool that renders a preview of a LikeC4 view defined by DSL text within the context of an existing project's real elements, without saving changes to disk. If the view ID matches an already existing view, an error is returned. This allows users to experiment with view definitions before adding them to the project.

- [#3174](https://github.com/likec4/likec4/pull/3174) [`17c73c1`](https://github.com/likec4/likec4/commit/17c73c18f317641f14d339b70deb76bb3c20d4b2) Thanks [@kgeilmann](https://github.com/kgeilmann)! - Add `render-view` MCP App tool that renders a LikeC4 view as an interactive diagram (pan/zoom/fit) inline in MCP hosts that support MCP Apps, in addition to the existing text-only `read-view` tool.
- Updated dependencies [[`17c73c1`](https://github.com/likec4/likec4/commit/17c73c18f317641f14d339b70deb76bb3c20d4b2), [`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c), [`67b696e`](https://github.com/likec4/likec4/commit/67b696e77ef8f97f43e435819a019ff8cc637cec), [`39dc9cf`](https://github.com/likec4/likec4/commit/39dc9cfc729d2e92d9dd0bb4553ed5abca0a3e5d), [`a77d799`](https://github.com/likec4/likec4/commit/a77d79990089149eb0c4420224ee4368041663fd), [`dc7eba2`](https://github.com/likec4/likec4/commit/dc7eba24559706f2e41ee5f8bfd66e79363de435), [`945ac39`](https://github.com/likec4/likec4/commit/945ac390524a93df4a0a22670e73686d42c662c2), [`603d274`](https://github.com/likec4/likec4/commit/603d2747f3a1c46c1cf84857b637c1fe56f511f9), [`ef28a22`](https://github.com/likec4/likec4/commit/ef28a2272630324c38fd2465d2a52696160cb59c), [`31d2e10`](https://github.com/likec4/likec4/commit/31d2e101937d178155e9764eaa2b5ad773fc1a0b), [`ecae4b2`](https://github.com/likec4/likec4/commit/ecae4b28259040be97f17041ebcf6ce535fc5fe4), [`797907a`](https://github.com/likec4/likec4/commit/797907a50098c64f50c22ec301183140c38ac33f), [`d1099dd`](https://github.com/likec4/likec4/commit/d1099dd4cd14ab0aec891eb66622f0c070530345), [`13daa47`](https://github.com/likec4/likec4/commit/13daa47058023ee3b13e660dbeb3df97748b09f0), [`260ac73`](https://github.com/likec4/likec4/commit/260ac730bdfdeb5a27d4a23497b14ad3e2670de6), [`8a4a690`](https://github.com/likec4/likec4/commit/8a4a6905d5cfd63c1c2e443ea93ad86aba474d5e), [`2159ad5`](https://github.com/likec4/likec4/commit/2159ad568c6daf555f90d6697fc13bf22150530c), [`6546da5`](https://github.com/likec4/likec4/commit/6546da5b8f5e96ee2d73d6254e5fa8d8c0a63ec4), [`be42269`](https://github.com/likec4/likec4/commit/be422697cab02c760f470d5e74c2b709505f72ac), [`d3d597a`](https://github.com/likec4/likec4/commit/d3d597ad1cdfe3b8735744353518339c794b8d28), [`61677a8`](https://github.com/likec4/likec4/commit/61677a8e5861f36c12e4f379f1623d9af455fa30)]:
  - @likec4/language-server@1.59.3
  - @likec4/core@1.59.3
  - @likec4/diagram@1.59.3
  - @likec4/language-services@1.59.3
  - @likec4/config@1.59.3
  - @likec4/layouts@1.59.3
  - @likec4/log@1.59.3

## 1.59.2

### Patch Changes

- [#3113](https://github.com/likec4/likec4/pull/3113) [`9dbaaf0`](https://github.com/likec4/likec4/commit/9dbaaf0af1f952437cbf5e42e471fa854413ec9b) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix npx installs of the MCP server by publishing its runtime dependencies.

- Updated dependencies [[`1d2575a`](https://github.com/likec4/likec4/commit/1d2575a8abf1cdf48dde3e5f509a087b855b18f4), [`4b5deac`](https://github.com/likec4/likec4/commit/4b5deac079439b3b6b3dd6eefa78acda2af6ea42)]:
  - @likec4/language-server@1.59.2
  - @likec4/language-services@1.59.2
  - @likec4/config@1.59.2
  - @likec4/core@1.59.2
  - @likec4/layouts@1.59.2
  - @likec4/log@1.59.2

## 1.59.1

## 1.59.0

### Patch Changes

- [#3097](https://github.com/likec4/likec4/pull/3097) [`a862f7f`](https://github.com/likec4/likec4/commit/a862f7f72ab63e635881eb0c5bb1ceab5296df6f) Thanks [@ckeller42](https://github.com/ckeller42)! - Stop stdio MCP servers when the client closes stdin so file watchers are cleaned up instead of leaving orphaned processes.

## 1.57.1

## 1.57.0

## 1.56.0

## 1.55.1

## 1.55.0

### Patch Changes

- [#2828](https://github.com/likec4/likec4/pull/2828) [`75fa6d2`](https://github.com/likec4/likec4/commit/75fa6d2b066b42970892bfc8fac407618af160e3) Thanks [@sraphaz](https://github.com/sraphaz)! - - MCP README: clarify MCP vs LeanIX bridge and Draw.io `--profile leanix`.

  - LikeC4 DSL Agent Skill: LeanIX + Draw.io reference (`bridge-leanix-drawio.md`), CLI reference (`cli.md`), and `SKILL.md` alignment.
  - AGENTS.md: pointers for agent-facing docs and the LeanIX bridge workflow.

- [#2877](https://github.com/likec4/likec4/pull/2877) [`51adb85`](https://github.com/likec4/likec4/commit/51adb85ad1097cdd4c95f9082533c8b33b124a42) Thanks [@davydkov](https://github.com/davydkov)! - Extract MCP server and tools to `@likec4/mcp` package. This will allow us to reuse MCP server and tools in other projects, and also will make the codebase cleaner and more modular.

## 1.54.0

## 1.53.0

## 1.52.0

## 1.51.0

## 1.50.0

### Minor Changes

- [#2638](https://github.com/likec4/likec4/pull/2638) [`0587b66`](https://github.com/likec4/likec4/commit/0587b6609ec9eb372aa3ff8eae2fd3a82c789144) Thanks [@ckeller42](https://github.com/ckeller42)! - Add new MCP query tools: `query-graph`, `query-incomers-graph`, `query-outgoers-graph`, `query-by-metadata`, `query-by-tags`, `query-by-tag-pattern`, `find-relationship-paths`, `batch-read-elements`, `subgraph-summary`, and `element-diff`.

  Enhance `read-project-summary` to include serialized project `config` and extend project config schema with optional `metadata` field.

## 1.49.0

### Patch Changes

- [`1c6e427`](https://github.com/likec4/likec4/commit/1c6e4273d96774b5c5c7ee52047539e15bb265e2) Thanks [@davydkov](https://github.com/davydkov)! - Fix MCP server initialization and be stateless (according to suggestion in https://github.com/likec4/likec4/security/dependabot/179)

## 1.48.0

## 1.47.0

### Patch Changes

- [`be5326a`](https://github.com/likec4/likec4/commit/be5326a029c4f295cdd2bcf34dfa4a928dd9b948) Thanks [@davydkov](https://github.com/davydkov)! - Updated MCP SDK

## 1.46.4

## 1.46.3

## 1.46.2
