# Model and public API

Canonical task guidance referenced by root AGENTS.md. Read the sections that apply to the task.

## Public API entry files

- `packages/likec4/src/LikeC4.ts` is the SDK entry for `import { LikeC4 } from 'likec4'`.
- `packages/likec4/src/index.ts` contains SDK re-exports, including `writeDSL`.
- `packages/language-services/src/common/LikeC4.ts` contains the real `LikeC4` class.
- `packages/language-services/src/node/index.ts` contains Node-only helpers such as `fromWorkspace`, `fromSource`, and `writeDSL`.
- `packages/core/src/builder/Builder.ts` contains `Builder` and static helpers `forSpecification`, `specification`, and `fromParsed`.
- `packages/core/src/builder/_types.ts` contains Builder type machinery: `Types`, `AnyTypes`, `Types.FromAux`, and `Types.ToAux`.
- `packages/core/src/model/LikeC4Model.ts` contains `LikeC4Model` for Parsed, Computed, and Layouted models.
- `packages/core/src/types/model-data.ts` contains `ParsedLikeC4ModelData`, `ComputedLikeC4ModelData`, and `LayoutedLikeC4ModelData`.
- `packages/generators/src/likec4/index.ts` contains the DSL emitter `generate(input): string`; production usage is in `packages/language-services/src/common/LikeC4.ts`.

## Model stages

`ParsedLikeC4ModelData` is parsed from DSL. `ComputedLikeC4ModelData` has views computed through `computeLikeC4Model`. `LayoutedLikeC4ModelData` has Graphviz positions applied.

All three share `projectId`, `project`, `elements`, `relations`, `deployments`, `specification`, `globals`, and `imports`. They differ by `_stage` and `views`; computed and layouted data may also carry saved `manualLayouts`. `LikeC4Model.Parsed.$data` is the canonical input to `Builder.fromParsed`.

## Composite TypeScript project gotcha

- `packages/core` has `composite: true`. Downstream packages such as `language-services`, `likec4`, and `generators` read `.d.ts` files from `packages/core/lib/`, not source files.
- After adding a new export or method in core, run `pnpm exec tsc --build` before typechecking downstream. Otherwise TypeScript may report phantom `Property X does not exist on Y` errors from stale declarations.
- If downstream `tsc -b` reports errors that package-local source-mode `tsc --noEmit` does not, clear stale build info with `find packages -name "*.tsbuildinfo" -delete`, then rebuild.

## Builder type-loss when loading from runtime data

- `Builder` in `packages/core/src/builder/` uses a phantom-type ledger (`Types`, `Types.AddFqn`, `Types.ToAux`) to track added FQNs, view ids, and kinds at compile time. The reverse direction is `Types.FromAux<A>` in `packages/core/src/builder/_types.ts`.
- `Builder.fromParsed(data)` is the runtime-to-builder seeding entry and is overloaded:
  - When `data: ParsedLikeC4ModelData<A>` carries a typed `Aux`, the returned builder preserves those types.
  - When `A` is `UnknownParsed`, the returned helpers are runtime-only and do not provide compile-time autocomplete on existing kinds or FQNs.
- `Builder.build()` produces `ParsedLikeC4ModelData<Types.ToAux<T>>`.
- `Builder.toLikeC4Model()` additionally runs `computeLikeC4Model`.
- Callers who know the spec statically can supply an explicit generic such as `Builder.fromParsed<typeof mySpec['Types']>(data)`. This is an unchecked cast and is the caller's responsibility.
- Do not try to reconstruct the phantom-type ledger from disk; element kinds, FQNs, and view ids are not statically knowable from a loaded workspace.

## DSL writeback is lossy

The DSL generator at `packages/generators/src/likec4/` emits formatted `.c4` source from `ParsedLikeC4ModelData`, but it does not preserve comments, source positions, or original formatting. It is used by `LikeC4.toDSL()` and `writeDSL()`.

Treat round trips such as `fromWorkspace → toDSL → fromSource` as one-way generation, not as formatting.

## Package-specific instructions

### packages/core

- When changes relate to views, either types or model behavior, update view-drift detection and auto-applying logic under `packages/core/src/manual-layout`.
- If you are unsure what causes layout drift or what can be auto-applied, ask for confirmation.
- Respect the Builder phantom-type ledger rules described above.

### packages/language-server

- Do not edit files in `packages/language-server/src/generated` or `packages/language-server/src/generated-lib`.
- After changing `packages/language-server/src/like-c4.langium`, always run `pnpm generate`.
- After grammar changes, update TextMate grammars in:
  - `packages/vscode/likec4.tmLanguage.json`
  - `apps/playground/likec4.tmLanguage.json`
  - `apps/docs/likec4.tmLanguage.json`

### packages/language-services

- Public API surface lives in `packages/language-services/src/common/LikeC4.ts` on the `LikeC4` class. Add new public methods there, not in subclasses.
- Node-only helpers that import `node:fs`, `node:path`, or similar modules go in `packages/language-services/src/node/index.ts`. Do not put them in `src/common/`.
- The common module is bundled for the browser.
- The class wraps `LikeC4Langium` services. Use these access points:
  - `modelBuilder.parseModel(projectId)` returns `LikeC4Model.Parsed`.
  - `modelBuilder.computeModel(projectId)` returns `LikeC4Model.Computed`.
  - `languageServices.layoutedModel(projectId)` returns `LikeC4Model.Layouted`.
- Consumers must not import `@likec4/language-server` directly; go through this package's exports.
