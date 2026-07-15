# Repository Guidelines

AGENTS.md is the canonical shared repository instruction file. Tool-specific files must import, point to, or defer to this file instead of duplicating repository guidance.

LikeC4 is an architecture-as-code tool for visualizing software architecture. It provides a DSL for describing architecture, a language server, CLI, VSCode extension, and web-based diagram visualization.

## Project Structure & Module Organization

- Monorepo managed by `pnpm` workspaces and `turbo`.
- `apps/` contains user-facing apps, notably `apps/docs` and `apps/playground`.
- `packages/likec4/` is the CLI and static site generator main entry point.
- `packages/likec4-spa/` is the single-page application for rendering architecture diagrams.
- `packages/vite-plugin/` is the LikeC4 Vite plugin (`@likec4/vite-plugin`).
- `packages/lsp/` is the standalone LikeC4 Language Server for editor integrations (`@likec4/lsp`).
- `packages/react/` is the LikeC4 React bundle (`@likec4/react`).
- `packages/core/` contains core and model types, model builder, compute-view, and layout drift detection logic.
- `packages/language-server/` contains the Langium-based DSL parser and LSP implementation.
- `packages/language-services/` contains language service initialization for browser and Node.js consumers.
- `packages/diagram/` contains the React/ReactFlow diagram renderer.
- `packages/layouts/` contains Graphviz-based layout algorithms.
- `packages/generators/` contains exports to Mermaid, PlantUML, D2, and LikeC4 DSL.
- `packages/vscode/` contains the VSCode extension.
- `packages/vscode-preview/` contains the preview panel component for VSCode.
- `packages/config/` contains configuration schema and validation.
- `packages/icons/` is script-generated; never change it unless explicitly asked.
- `packages/log/` contains shared logging utilities.
- `packages/mcp/` contains the MCP server package; see `packages/mcp/README.md`.
- `packages/tsconfig/` contains shared TypeScript configuration.
- `packages/create-likec4/` is not used for now.
- `e2e/` is an isolated workspace for Playwright end-to-end tests.
- `styled-system/preset` holds the PandaCSS preset.
- `styled-system/styles` holds `pandacss codegen` results shared across packages.
- `examples/` provides sample LikeC4 projects.
- `devops/` contains CI/CD and repository utility scripts.
- `skills/` contains agent skills for AI assistants, including `skills/likec4-dsl/`.
- LeanIX / Draw.io bridge details live in `packages/leanix-bridge/README.md` and `skills/likec4-dsl/references/bridge-leanix-drawio.md`.

## App ↔ Language Server Architecture

The webapp talks to the Language Server through three layered packages. When extending the flow, pick the right layer:

- `packages/diagram` is the UI contract. It renders diagrams from a `LikeC4Model`, defines the consumer contract via `LikeC4ModelProvider` in `packages/diagram/src/LikeC4ModelProvider.tsx`, and exposes `useLikeC4Model`-style hooks. It must not know how data is fetched, stored, or mutated.
- `packages/likec4-spa` is the UI host. It materializes the diagram into a runnable app, imports `likec4:*` virtual modules, wraps them in nanostores for HMR reactivity, and mounts `LikeC4ModelProvider`. See `packages/likec4-spa/src/context/LikeC4ModelContext.tsx`.
- `packages/vite-plugin` is the data and RPC bridge. It owns the `likec4:*` virtual modules in `packages/vite-plugin/src/virtuals/` and the birpc channel between SPA and Language Server over Vite HMR in `packages/vite-plugin/src/rpc/rpc.ts` and `packages/vite-plugin/src/virtuals/rpc.ts`.

Dev-mode flow: `SPA → likec4:rpc (birpc over import.meta.hot) → vite-plugin (server.hot.on) → @likec4/language-services → updated likec4:model → HMR → SPA nanostore → diagram re-renders`.

In production builds (`likec4 build`), RPC is absent and virtual modules are inlined as static JSON. The diagram is read-only.

### Where to make changes

- New visual feature, no new data: change `packages/diagram` only.
- New data shape from the model: add a virtual module in `packages/vite-plugin`, surface a hook or atom in `packages/likec4-spa`, then consume it in `packages/diagram`.
- New action that mutates the model through a round trip to the LSP: add an RPC method in `packages/vite-plugin/src/rpc`, then call it from `packages/likec4-spa`.
- Do not import `@likec4/language-server` directly from `packages/likec4-spa`; always go through the vite-plugin RPC.

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

## Build, Test, and Development Commands

- `pnpm install` installs dependencies and requires Node `>=22.22.3`.
- `pnpm generate` pre-generates sources; always run after checkout, big merges, refactors, and when generated files are missing.
- `pnpm build` builds packages except docs and playground.
- `pnpm typecheck` validates TypeScript; run it after `pnpm generate`.
- `pnpm test` runs Vitest suites. Use `pnpm test --no-typecheck` when only runtime tests are needed.
- `pnpm lint` runs oxlint.
- `pnpm lint:fix` applies oxlint fixes.
- `pnpm fmt` formats with dprint.
- `pnpm test:e2e` runs Playwright tests from the isolated `e2e` workspace and takes longer than unit tests.
- `pnpm check:agent-instructions` validates that this file remains canonical and adapters do not drift.

## Generated Files

Several packages have auto-generated files that must be generated before build or typecheck:

- `packages/language-server/src/generated/*` is the Langium parser generated from grammar.
- `packages/language-server/src/generated-lib/*` is the registry of bundled icons.
- `packages/vscode/src/meta.ts` is VSCode extension metadata.
- `**/routeTree.gen.ts` files are TanStack Router routes.
- `styled-system/preset/src/generated.ts` is the Panda CSS preset.
- `styled-system/styles/dist/` is generated Panda CSS styles.
- `packages/config/schema.json` is generated from `packages/config/src/schema.ts` and copied into
  `packages/likec4/config/schema.json` during the LikeC4 package build.

Do not edit git-ignored generated files; those changes will be overwritten.

Always run `pnpm generate` after checkout, when generated files are missing, after changing style presets in `styled-system/preset`, and after changing language grammar in `packages/language-server/src/like-c4.langium`.

## Coding Style & Naming Conventions

- TypeScript-first repository; use explicit types.
- Avoid `any` and avoid casts with `as` unless there is no safer alternative.
- Formatting is handled by dprint with 120-column lines, single quotes, and no semicolons.
- Use oxlint for linting; keep imports sorted and type-only imports grouped first.
- Use JSDoc to document public classes and methods.
- Favor `switch (true)` over if-else chains.
- Use Context7 MCP tools when looking up external library or framework documentation.

## Testing Guidelines

- Unit and integration tests use Vitest.
- Test files are named `*.spec.ts` and live alongside sources or in `__tests__` folders.
- Snapshots are stored in `__snapshots__` folders and should be updated deliberately.
- Cover new features with relevant tests and keep test names descriptive.
- Always run relevant tests before committing.

## Commit, Pull Request, and Changeset Guidelines

- Follow Conventional Commit-style prefixes when possible, such as `feat:`, `fix:`, `docs:`, `chore:`, `test:`, and `refactor:`.
- Keep commits focused and scoped to one change.
- PRs should include a clear description and linked issues when relevant.
- Project release changes use `.changeset/` files.
- Create changesets for user-facing package changes.
- Skip changesets when changes are only tests, generated files, internal refactors, docs-only repository instructions, or private packages that are never published such as `@likec4/tsconfig`.
- `packages/icons` is script-generated and should not be hand-edited unless explicitly requested; if it changes, verify whether the public `@likec4/icons` package needs a changeset.
- Always use `patch` changesets; versioning is handled manually by maintainers.
- Write changeset summaries from the user's perspective and focus on public impact.
- Do not mention test changes, internal refactors, config changes, cleanup, or dependency bumps in changeset summaries.

## Tooling and Adapter Policy

- AGENTS.md is the canonical shared repository instruction file.
- The root `CLAUDE.md` file is the Claude Code adapter and must contain exactly `@AGENTS.md`.
- Tools with native `AGENTS.md` support should read `AGENTS.md` directly.
- Tool-specific files with import support should import `AGENTS.md`.
- Tools without import support may use generated plain-text adapters derived from `AGENTS.md`, but those adapters must be generated and checked for drift.
- Do not use symlink adapters for shared repository instructions; this repository has Windows CI and Windows contributors.
- Do not duplicate repository instructions into a second long-lived source of truth.
- Do not create `AGENT.md`.
- `.github/agents/*.agent.md` files may remain only as task-specific wrappers. Shared repository policy must live here in `AGENTS.md`.
- VS Code and GitHub Copilot coding-agent/code-review surfaces can consume `AGENTS.md`. Do not add `.github/copilot-instructions.md`; any future adapter must be generated from `AGENTS.md` and added together with drift validation.
- The `.cursor/` directory is gitignored. Contributors may add local `.cursor/rules/` files for personal use, but do not commit them.
- Use `.tool-versions` for expected Node and pnpm versions.
- Pre-commit hooks use `nano-staged` to run dprint on staged files.

## Package-specific instructions

### packages/core

- When changes relate to views, either types or model behavior, update view-drift detection and auto-applying logic under `packages/core/src/manual-layout`.
- If you are unsure what causes layout drift or what can be auto-applied, ask for confirmation.
- Respect the Builder phantom-type ledger rules described above.

### packages/diagram

Imports flow upward only; never have a lower layer import from a higher one.

- `base/` is the ReactFlow foundation for types, constants, and `BaseXYFlow`; it contains no business logic.
- `base-primitives/` contains concrete Element, Compound, Edge, and Markdown components built on `base/`. New diagram building blocks go here.
- `custom/` supports custom renderer projects. Keep original renderer logic in focused modules and avoid turning this folder into a cross-feature dependency hub.
- `overlays/`, `navigationpanel/`, `search/`, and `projects-overview/` are sibling stateful features. Each owns its own XState actor.
- `likec4diagram/` is the top-level diagram engine. It hosts the main machine in `state/machine.ts` and embeds the editor as a child actor when editing is enabled.
- `editor/` is an orthogonal feature injected into `likec4diagram/` through an actor reference. Do not nest it inside `likec4diagram/`, and do not import from `likec4diagram/` here.
- `context/`, `hooks/`, `components/`, `shadowroot/`, and `utils/` are utility layers used by everything above.
- When adding a new feature, default to a sibling folder under `src/` with its own actor. Promote it into `likec4diagram/` only if it must coordinate with the main machine.

State management:

- XState machines are the default for coordinated or persistent state. Use file patterns such as `actor.ts`, `*Actor.ts`, and `state/machine.ts`.
- `@xstate/store` is available as a dependency, but current source does not import it. Do not introduce it without a clear reason and keep any future usage local to one feature.
- `nanostores` are reserved for ambient reactive concerns such as media queries and container size. Do not use them for feature or model state; that belongs in `@likec4/spa`.
- `useState` and `useReducer` are for transient UI state only, such as hover, focus, and form inputs.

Public API and app contract:

- `packages/diagram/src/index.ts` is the public API.
- Do not treat package shims or build output such as `packages/diagram/adhoc-editor/package.json`, `lib/`, or `dist/` as active source layers.
- Do not import Vite virtual modules (`likec4:*`) or call the language server from `packages/diagram`.
- `packages/diagram` defines the consumer contract through `LikeC4ModelProvider` and `useLikeC4Model`-style hooks. Data wiring belongs in `packages/likec4-spa` and `packages/vite-plugin`.

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

### packages/likec4-spa

This package is the webapp host (`@likec4/spa`) and materializes `@likec4/diagram` into a runnable Vite SPA. Imports flow upward only.

- `src/routes/` contains TanStack Router route definitions. `routeTree.gen.ts` is generated by the TanStack Router Vite plugin during dev/build; do not edit it.
- `src/pages/` contains page-level components, one per route. It owns async data wiring. Import from `src/context/` and `likec4:*` virtual modules. Do not import sibling pages.
- `src/components/` contains reusable UI. Pages may import components, but components must not import pages.
- `src/context/` contains React providers that bridge `likec4:*` virtual modules into `@likec4/diagram`. `LikeC4ModelContext.tsx` is where the diagram's `LikeC4ModelProvider` contract is fulfilled. New context that adapts virtual-module data goes here.
- `src/main.tsx` and `src/router.tsx` are entrypoints. `start-dev.ts` is the dev-server bootstrap invoked by `pnpm dev`.
- `lib/`, `dist/`, and `codegen/` are build output or generators consumed by `packages/likec4` for static-site build. Do not edit them by hand.

State management:

- `nanostores` are this package's primary reactive primitive. Use atoms for state that crosses route boundaries or needs to survive HMR, such as the model atom in `context/LikeC4ModelContext.tsx` or the sidebar drawer in `components/sidebar/state.ts`.
- Keep atom modules small and HMR-friendly.
- Use React `useState` and `useReducer` only for local UI state inside a single page or component.
- No XState in `packages/likec4-spa`. Diagram-side state machines live in `@likec4/diagram`; do not add machines here.

Public API and contracts:

- `package.json` is `private: true`; this is an app, not a library, so there are no stable exports.
- Talk to the Language Server only through `likec4:rpc` from `@likec4/vite-plugin`.
- Do not import `@likec4/language-server` or `@likec4/vite-plugin` source directly.
- Model, project, app-config, icon, RPC, and export-format data should come from `likec4:*` virtual modules. Dev-only integrations such as AI chat or external renderers may use their documented endpoints.
- Adding new model-backed data means adding a virtual module in `@likec4/vite-plugin`, not fetching language-server data here.
- New routes require `routeTree.gen.ts` to be regenerated by the TanStack Router Vite plugin.

### packages/vite-plugin

This package is the data and RPC bridge between `@likec4/spa` and other consumers and `@likec4/language-services`. It owns the `likec4:*` virtual modules and the birpc channel over Vite HMR.

Subdirectory layering:

- `src/index.ts` is the public plugin entry. It re-exports `LikeC4VitePlugin` and `LikeC4VitePluginOptions`. Keep the surface minimal.
- `src/plugin.ts` is the plugin factory. It wires `resolveId`, `load`, and `configureServer`, and registers the virtual-module list. New virtual modules must be added to its registration arrays.
- `src/internal.ts` is exported through the `./internal` subpath and consumed by generated virtual-module code and by `packages/likec4` static-site build. It re-exports nanostores helpers, `createRpc`, and `createHooksForModel`. Treat this as a stable contract because generated code in the wild depends on it.
- `src/virtuals/` contains the virtual module loaders. Keep each file focused on its own related `likec4:*` ids and use `_shared.ts` helpers; do not cross-import between virtuals.
- `src/rpc/` contains server-side birpc setup. `protocol.ts` is the typed contract, `rpc.ts` wires `enablePluginRPC` over `server.hot`, and `src/rpc/functions/` contains handlers such as `updateView.ts` and `calcAdhocView.ts`.
- `src/modules.d.ts` contains ambient TypeScript declarations for every `likec4:*` id. It is required for IDE/type-check and published through the `./modules` subpath.

Adding new functionality:

- New virtual module: create a file in `src/virtuals/`, export a `VirtualModule` or `ProjectVirtualModule` with a unique `likec4:*` id and a `load()` returning generated code, register it in `src/plugin.ts`, and declare its module type in `src/modules.d.ts`.
- New RPC method: add the signature to `src/rpc/protocol.ts`, implement the handler in `src/rpc/functions/`, and wire it into `createBirpc` in `src/rpc/rpc.ts`. The client wrapper in `src/virtuals/rpc.ts` picks up the new method through the protocol type.
- All virtual ids use the `likec4:*` prefix. Project-scoped ids include the project id, such as `likec4:model/{projectId}`.

Boundaries:

- Do not import from `@likec4/diagram`; this is a Vite/Node-side package, not a UI package.
- Imports from `@likec4/language-server` in `packages/vite-plugin` must be type-only.
- The runtime language service instance comes from `@likec4/language-services/node` (`fromWorkspace`) or through the `languageServices` plugin option.
- RPC is dev-only. Generated code in `virtuals/rpc.ts` guards on `import.meta.hot`, and handlers are registered in `configureServer` only.
- Do not assume RPC is available in production builds; in build mode virtual modules are inlined as static JSON.

### packages/diagram/src/likec4diagram/xyflow-sequence

This directory is a development copy of the sequence layouter from `@likec4/layouts`. It exists only to get Vite HMR while iterating on the layouter in the dev app. The canonical production implementation is `packages/layouts/src/sequence/`.

Runtime use:

- Production (`likec4 build`, exports): `GraphvizLayoter` in `packages/layouts/src/graphviz/GraphvizLayoter.ts` calls `calcSequenceLayout(diagram)` and stores the result in `view.sequenceLayout`. The diagram package only reads it.
- Dev: `sequence-layout.ts` in this directory detects `hasProp(view, 'flow')` and recomputes layout on the fly via local `calcSequenceLayout(view, flow)`, enabling HMR iteration.

Mirrored with `packages/layouts/src/sequence/`; keep these files in sync:

- `_types.ts`
- `const.ts`
- `layouter.ts`
- `sequence-view.ts`
- `utils.ts`
- `utils.spec.ts`

Local to this directory; do not copy to layouts:

- `sequence-layout.ts`, which contains `sequenceLayoutToXY()` and converts computed layout into XYFlow nodes and edges consumed by `../convert-to-xyflow.ts`.

Local to the layouts side:

- `packages/layouts/src/sequence/index.ts`, which contains public exports.

Syncing rules:

- Iterate here first, then port stable changes to `packages/layouts/src/sequence/`.
- Syncing is not a blind file copy. The entry signature intentionally differs: here `calcSequenceLayout(view, flow)` receives flow from the caller in `sequence-layout.ts`; in layouts, `calcSequenceLayout(view)` computes flow internally to match `GraphvizLayoter` call sites.
- `const.ts` exports such as `SeqZIndex` and `SeqParallelAreaColor` are consumed only by local `sequence-layout.ts`, but the file is mirrored. Keep values consistent when syncing.
- Always diff the two directories before syncing; do not assume they are currently identical.
- After porting, run tests in both packages because `utils.spec.ts` exists in each.
- Typecheck `packages/layouts` after porting.
- Never import `@likec4/layouts` from `packages/diagram`.
