# Canonical AGENTS.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make root `AGENTS.md` the single canonical LikeC4 repository instruction file and turn all other instruction surfaces into adapters, task wrappers, or deletions.

**Architecture:** Consolidate all existing shared and package-scoped guidance into root `AGENTS.md`, keep root `CLAUDE.md` as a one-line Claude Code adapter, delete package-level `CLAUDE.md` files, and delete `.github/copilot-instructions.md` because current GitHub Copilot and VS Code documentation support native `AGENTS.md` discovery. Add a small Node.js validator that scans tracked files through `git ls-files`, then wire it into the existing `check-types` job so the existing quality gate blocks drift.

**Tech Stack:** Markdown instruction files, Node.js built-ins only for validation, `pnpm` root scripts, GitHub Actions `checks.yaml`.

## Global Constraints

- Root `AGENTS.md` is the canonical shared repository instruction file.
- Root `CLAUDE.md` must contain exactly `@AGENTS.md` plus a trailing newline.
- Do not create `AGENT.md`.
- Do not keep package-level `CLAUDE.md` files unless a verified discovery requirement exists; this implementation removes them.
- Do not keep `.github/copilot-instructions.md` because GitHub Copilot now supports `AGENTS.md` directly.
- Do not use symlink adapters; this repository has Windows CI and Windows contributors.
- `.github/agents/*.agent.md` may remain as task-specific wrappers, but `AGENTS.md` must contain the canonical shared policy.
- Do not touch unrelated untracked local files.
- No changeset is required because this is repository documentation/tooling only and has no user-facing package release impact.

---

## File structure

- Create `AGENTS.md`: canonical root repository instructions.
- Modify `CLAUDE.md`: one-line adapter to `AGENTS.md`.
- Delete package-level instruction files:
  - `packages/core/CLAUDE.md`
  - `packages/diagram/CLAUDE.md`
  - `packages/language-server/CLAUDE.md`
  - `packages/language-services/CLAUDE.md`
  - `packages/likec4-spa/CLAUDE.md`
  - `packages/vite-plugin/CLAUDE.md`
  - `packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md`
- Delete `.github/copilot-instructions.md`: GitHub Copilot should use native `AGENTS.md`.
- Modify `.github/agents/changeset-generator.agent.md`: add a short canonical-source note while keeping task-specific workflow.
- Create `devops/check-agent-instructions.mjs`: drift validator with no package dependencies.
- Modify `package.json`: add `check:agent-instructions`.
- Modify `.github/workflows/checks.yaml`: run the validator in `check-types`, which is already required by `check-quality-gate`.

---

### Task 1: Canonical instruction migration and local validator

**Files:**

- Create: `AGENTS.md`
- Create: `devops/check-agent-instructions.mjs`
- Modify: `CLAUDE.md`
- Modify: `.github/agents/changeset-generator.agent.md`
- Modify: `package.json`
- Delete: `.github/copilot-instructions.md`
- Delete: `packages/core/CLAUDE.md`
- Delete: `packages/diagram/CLAUDE.md`
- Delete: `packages/language-server/CLAUDE.md`
- Delete: `packages/language-services/CLAUDE.md`
- Delete: `packages/likec4-spa/CLAUDE.md`
- Delete: `packages/vite-plugin/CLAUDE.md`
- Delete: `packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md`

**Interfaces:**

- Consumes: current instruction files listed in the preservation checklist.
- Produces:
  - `pnpm check:agent-instructions` root script.
  - `devops/check-agent-instructions.mjs`, executable with `node`.
  - Root `AGENTS.md` section anchors required by the validator.

- [ ] **Step 1: Add the root script and validator**

Modify `package.json` by adding this script next to the existing formatting/check scripts:

```json
"check:agent-instructions": "node devops/check-agent-instructions.mjs"
```

Create `devops/check-agent-instructions.mjs` with this exact implementation:

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const tracked = execFileSync('git', ['ls-files'], {
  cwd: root,
  encoding: 'utf8',
}).split('\n').filter(Boolean)

const failures = []

const absolute = relativePath => path.join(root, relativePath)
const isTracked = relativePath => tracked.includes(relativePath)
const read = relativePath => readFileSync(absolute(relativePath), 'utf8')
const fail = message => failures.push(message)

const requireTrackedFile = relativePath => {
  if (!isTracked(relativePath)) {
    fail(`${relativePath} must be tracked`)
    return false
  }
  if (!existsSync(absolute(relativePath))) {
    fail(`${relativePath} must exist`)
    return false
  }
  return true
}

const requireIncludes = (content, needle, label) => {
  if (!content.includes(needle)) {
    fail(`AGENTS.md must contain ${label}: ${needle}`)
  }
}

requireTrackedFile('AGENTS.md')

if (requireTrackedFile('CLAUDE.md')) {
  const claude = read('CLAUDE.md')
  if (claude !== '@AGENTS.md\n') {
    fail('CLAUDE.md must contain exactly "@AGENTS.md" plus a trailing newline')
  }
}

if (isTracked('AGENT.md') || existsSync(absolute('AGENT.md'))) {
  fail('Do not create root AGENT.md; use AGENTS.md')
}

const trackedAgentSingularFiles = tracked.filter(file => path.basename(file) === 'AGENT.md')
if (trackedAgentSingularFiles.length > 0) {
  fail(`Do not track AGENT.md files: ${trackedAgentSingularFiles.join(', ')}`)
}

const trackedClaudeFiles = tracked.filter(file => path.basename(file) === 'CLAUDE.md')
const unexpectedClaudeFiles = trackedClaudeFiles.filter(file => file !== 'CLAUDE.md')
if (unexpectedClaudeFiles.length > 0) {
  fail(`Only root CLAUDE.md is allowed; remove package adapters: ${unexpectedClaudeFiles.join(', ')}`)
}

if (isTracked('.github/copilot-instructions.md')) {
  fail('Remove .github/copilot-instructions.md; GitHub Copilot should use root AGENTS.md directly')
}

if (existsSync(absolute('.github/copilot-instructions.md'))) {
  fail('Do not keep local .github/copilot-instructions.md; it becomes a competing instruction source')
}

if (existsSync(absolute('AGENTS.md'))) {
  const agents = read('AGENTS.md')

  const requiredSections = [
    '# Repository Guidelines',
    '## Project Structure & Module Organization',
    '## App ↔ Language Server Architecture',
    '## Public API entry files',
    '## Model stages',
    '## Build, Test, and Development Commands',
    '## Generated Files',
    '## Coding Style & Naming Conventions',
    '## Testing Guidelines',
    '## Commit, Pull Request, and Changeset Guidelines',
    '## Tooling and Adapter Policy',
    '## Package-specific instructions',
    '### packages/core',
    '### packages/diagram',
    '### packages/language-server',
    '### packages/language-services',
    '### packages/likec4-spa',
    '### packages/vite-plugin',
    '### packages/diagram/src/likec4diagram/xyflow-sequence',
    '## Source preservation map',
  ]

  for (const section of requiredSections) {
    requireIncludes(agents, section, 'required section')
  }

  const requiredPhrases = [
    'AGENTS.md is the canonical shared repository instruction file.',
    'The root `CLAUDE.md` file is the Claude Code adapter and must contain exactly `@AGENTS.md`.',
    'Do not create `AGENT.md`.',
    'Do not use symlink adapters; this repository has Windows CI and Windows contributors.',
    'Always use `patch` changesets; versioning is handled manually by maintainers.',
    'Builder` in `packages/core/src/builder/` uses a phantom-type ledger',
    'Do not import Vite virtual modules (`likec4:*`) or call the language server from `packages/diagram`.',
    'Do not edit files in `packages/language-server/src/generated` or `packages/language-server/src/generated-lib`.',
    'Node-only helpers that import `node:fs`, `node:path`, or similar modules go in `packages/language-services/src/node/index.ts`.',
    'No XState in `packages/likec4-spa`.',
    'Imports from `@likec4/language-server` in `packages/vite-plugin` must be type-only.',
    'Never import `@likec4/layouts` from `packages/diagram`.',
  ]

  for (const phrase of requiredPhrases) {
    requireIncludes(agents, phrase, 'required preserved rule')
  }

  const requiredSources = [
    'CLAUDE.md',
    'packages/core/CLAUDE.md',
    'packages/diagram/CLAUDE.md',
    'packages/language-server/CLAUDE.md',
    'packages/language-services/CLAUDE.md',
    'packages/likec4-spa/CLAUDE.md',
    'packages/vite-plugin/CLAUDE.md',
    'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md',
    '.github/copilot-instructions.md',
    '.github/agents/changeset-generator.agent.md',
  ]

  for (const source of requiredSources) {
    requireIncludes(agents, `| \`${source}\` |`, 'source preservation map row')
  }
}

if (isTracked('.github/agents/changeset-generator.agent.md')) {
  const changesetAgent = read('.github/agents/changeset-generator.agent.md')
  if (!changesetAgent.includes('AGENTS.md is the canonical source for shared LikeC4 repository instructions')) {
    fail(
      '.github/agents/changeset-generator.agent.md must declare AGENTS.md as the canonical shared instruction source',
    )
  }
}

if (failures.length > 0) {
  console.error('Agent instruction validation failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Agent instruction validation passed')
```

- [ ] **Step 2: Run the validator before migration and confirm it fails**

Run:

```bash
pnpm check:agent-instructions
```

Expected: FAIL. The failure list must include at least:

```text
AGENTS.md must be tracked
CLAUDE.md must contain exactly "@AGENTS.md" plus a trailing newline
Only root CLAUDE.md is allowed
Remove .github/copilot-instructions.md
```

- [ ] **Step 3: Create the canonical root AGENTS.md**

Create `AGENTS.md` with this content:

```md
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
- `packages/generators/src/likec4/index.ts` contains the DSL emitter `generate(input): string`; production usage is in `packages/language-server/src/model-change/viewChange.ts`.

## Model stages

`ParsedLikeC4ModelData` is parsed from DSL. `ComputedLikeC4ModelData` has views computed through `computeLikeC4Model`. `LayoutedLikeC4ModelData` has Graphviz positions applied.

All three share `elements`, `relations`, `deployments`, `specification`, `globals`, and `imports`; only `views` differs. `LikeC4Model.Parsed.$data` is the canonical input to `Builder.fromParsed`.

## Composite TypeScript project gotcha

- `packages/core` has `composite: true`. Downstream packages such as `language-services`, `likec4`, and `generators` read `.d.ts` files from `packages/core/lib/`, not source files.
- After adding a new export or method in core, run `pnpm exec tsc --build` or `pnpm generate` before typechecking downstream. Otherwise TypeScript may report phantom `Property X does not exist on Y` errors.
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

- `pnpm install` installs dependencies and requires Node `>=22.21.1`.
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
- `schemas/likec4-config.schema.json` is generated from `packages/config/src/schema.ts`.

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
- Skip changesets when changes are only tests, generated files, internal refactors, docs-only repository instructions, or internal packages that are never published such as `@likec4/icons` and `@likec4/tsconfig`.
- Always use `patch` changesets; versioning is handled manually by maintainers.
- Write changeset summaries from the user's perspective and focus on public impact.
- Do not mention test changes, internal refactors, config changes, cleanup, or dependency bumps in changeset summaries.

## Tooling and Adapter Policy

- AGENTS.md is the canonical shared repository instruction file.
- The root `CLAUDE.md` file is the Claude Code adapter and must contain exactly `@AGENTS.md`.
- Tools with native `AGENTS.md` support should read `AGENTS.md` directly.
- Tool-specific files with import support should import `AGENTS.md`.
- Tools without import support may use generated plain-text adapters derived from `AGENTS.md`, but those adapters must be generated and checked for drift.
- Do not use symlink adapters; this repository has Windows CI and Windows contributors.
- Do not duplicate repository instructions into a second long-lived source of truth.
- Do not create `AGENT.md`.
- `.github/agents/*.agent.md` files may remain only as task-specific wrappers. Shared repository policy must live here in `AGENTS.md`.
- GitHub Copilot and VS Code support `AGENTS.md` natively, so this repository does not keep `.github/copilot-instructions.md`.
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
- `custom/` is a re-export façade for custom renderer projects. Add re-exports only; do not put original logic here.
- `overlays/`, `navigationpanel/`, `search/`, and `projects-overview/` are sibling stateful features. Each owns its own XState actor.
- `likec4diagram/` is the top-level diagram engine. It hosts the main machine in `state/machine.ts` and embeds the editor as a child actor when editing is enabled.
- `editor/` is an orthogonal feature injected into `likec4diagram/` through an actor reference. Do not nest it inside `likec4diagram/`, and do not import from `likec4diagram/` here.
- `adhoc-editor/` is a separate code path with its own machine and is intentionally not re-exported from `src/index.ts`.
- `context/`, `hooks/`, `components/`, `shadowroot/`, and `utils/` are utility layers used by everything above.
- When adding a new feature, default to a sibling folder under `src/` with its own actor. Promote it into `likec4diagram/` only if it must coordinate with the main machine.

State management:

- XState machines are the default for coordinated or persistent state. Use file patterns such as `actor.ts`, `*Actor.ts`, and `state/machine.ts`.
- `@xstate/store` is only for ephemeral UI state inside a single feature. It is currently used only by `adhoc-editor/state/panel.tsx`; do not introduce it elsewhere without a clear reason.
- `nanostores` are reserved for ambient reactive concerns such as media queries and container size. Do not use them for feature or model state; that belongs in `@likec4/spa`.
- `useState` and `useReducer` are for transient UI state only, such as hover, focus, and form inputs.

Public API and app contract:

- `packages/diagram/src/index.ts` is the public API.
- `adhoc-editor/` is intentionally internal.
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
- Node-only helpers that import `node:fs`, `node:path`, or similar modules go in `packages/language-services/src/node/index.ts`, not in `src/common/`.
- The common module is bundled for the browser.
- The class wraps `LikeC4Langium` services. Use these access points:
  - `modelBuilder.parseModel(projectId)` returns `LikeC4Model.Parsed`.
  - `modelBuilder.computeModel(projectId)` returns `LikeC4Model.Computed`.
  - `languageServices.layoutedModel(projectId)` returns `LikeC4Model.Layouted`.
- Consumers must not import `@likec4/language-server` directly; go through this package's exports.

### packages/likec4-spa

This package is the webapp host (`@likec4/spa`) and materializes `@likec4/diagram` into a runnable Vite SPA. Imports flow upward only.

- `src/routes/` contains TanStack Router route definitions. `routeTree.gen.ts` is generated by `tsr generate` through `pnpm generate`; do not edit it.
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
- All cross-process data comes from `likec4:*` virtual modules: `likec4:model`, `likec4:projects`, `likec4:app-config`, `likec4:icons`, `likec4:rpc`, and format exporters.
- Adding a new data source means adding a virtual module in `@likec4/vite-plugin`, not fetching data here.
- New routes require regenerating `routeTree.gen.ts` with `pnpm generate`.

### packages/vite-plugin

This package is the data and RPC bridge between `@likec4/spa` and other consumers and `@likec4/language-services`. It owns the `likec4:*` virtual modules and the birpc channel over Vite HMR.

Subdirectory layering:

- `src/index.ts` is the public plugin entry. It re-exports `LikeC4VitePlugin` and `LikeC4VitePluginOptions`. Keep the surface minimal.
- `src/plugin.ts` is the plugin factory. It wires `resolveId`, `load`, `configureServer`, and `handleHotUpdate`, and registers the virtual-module list. New virtual modules must be added to its registration arrays.
- `src/internal.ts` is exported through the `./internal` subpath and consumed by generated virtual-module code and by `packages/likec4` static-site build. It re-exports nanostores helpers, `createRpc`, and `createHooksForModel`. Treat this as a stable contract because generated code in the wild depends on it.
- `src/virtuals/` contains one file per virtual module. Each owns a single `likec4:*` id and its loader. Use `_shared.ts` helpers; do not cross-import between virtuals.
- `src/rpc/` contains server-side birpc setup. `protocol.ts` is the typed contract, `rpc.ts` wires `enablePluginRPC` over `server.hot`, and individual files such as `updateView.ts` and `calcAdhocView.ts` hold handlers.
- `src/modules.d.ts` contains ambient TypeScript declarations for every `likec4:*` id. It is required for IDE/type-check and published through the `./modules` subpath.

Adding new functionality:

- New virtual module: create a file in `src/virtuals/`, export a `VirtualModule` or `ProjectVirtualModule` with a unique `likec4:*` id and a `load()` returning generated code, register it in `src/plugin.ts`, and declare its module type in `src/modules.d.ts`.
- New RPC method: add the signature to `src/rpc/protocol.ts`, implement the handler in `src/rpc/`, and wire it into `createBirpc` in `src/rpc/rpc.ts`. The client wrapper in `src/virtuals/rpc.ts` picks up the new method through the protocol type.
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

## Source preservation map

| Source file                                                    | Destination in `AGENTS.md`                                  | Required preservation                                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                    | Repository guidelines and architecture sections             | All shared root instructions, including public API, model stages, composite TS gotcha, Builder type-loss, and DSL writeback limits |
| `packages/core/CLAUDE.md`                                      | `packages/core` section                                     | View-drift guidance and Builder phantom ledger rules                                                                               |
| `packages/diagram/CLAUDE.md`                                   | `packages/diagram` section                                  | Layering, state management, public API, and app/language-server boundary                                                           |
| `packages/language-server/CLAUDE.md`                           | `packages/language-server` section                          | Generated-file and grammar/TextMate update rules                                                                                   |
| `packages/language-services/CLAUDE.md`                         | `packages/language-services` section                        | API boundaries, Node/common split, and model access points                                                                         |
| `packages/likec4-spa/CLAUDE.md`                                | `packages/likec4-spa` section                               | Layering, nanostores, no XState, virtual-module boundaries, route generation                                                       |
| `packages/vite-plugin/CLAUDE.md`                               | `packages/vite-plugin` section                              | Virtual modules, RPC, generated-code contract, and hard boundaries                                                                 |
| `packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md` | nested package section                                      | Sequence layouter mirror/sync rules and both-side test requirement                                                                 |
| `.github/copilot-instructions.md`                              | Repository guidelines, generated-file rules, adapter policy | Current shared instructions folded in; file removed because GitHub Copilot supports `AGENTS.md`                                    |
| `.github/agents/changeset-generator.agent.md`                  | Changeset policy section                                    | Shared LikeC4 changeset rules; task workflow remains in the GitHub agent                                                           |
```

- [ ] **Step 4: Replace Claude and remove obsolete instruction files**

Replace `CLAUDE.md` with exactly:

```md
@AGENTS.md
```

Delete these files:

```text
.github/copilot-instructions.md
packages/core/CLAUDE.md
packages/diagram/CLAUDE.md
packages/language-server/CLAUDE.md
packages/language-services/CLAUDE.md
packages/likec4-spa/CLAUDE.md
packages/vite-plugin/CLAUDE.md
packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md
```

- [ ] **Step 5: Mark the GitHub changeset agent as task-specific**

In `.github/agents/changeset-generator.agent.md`, add this note immediately after the YAML frontmatter:

```md
> AGENTS.md is the canonical source for shared LikeC4 repository instructions, including changeset policy. This file is a task-specific wrapper for generating changeset files.
```

Do not delete the task workflow in `.github/agents/changeset-generator.agent.md`; it remains a GitHub custom agent definition.

- [ ] **Step 6: Stage the migration and confirm the validator passes**

Stage the migration before running the validator because `devops/check-agent-instructions.mjs` intentionally validates
the tracked index with `git ls-files`:

```bash
git add AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md devops/check-agent-instructions.mjs package.json .github/copilot-instructions.md packages/core/CLAUDE.md packages/diagram/CLAUDE.md packages/language-server/CLAUDE.md packages/language-services/CLAUDE.md packages/likec4-spa/CLAUDE.md packages/vite-plugin/CLAUDE.md packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md
```

Run:

```bash
pnpm check:agent-instructions
```

Expected:

```text
Agent instruction validation passed
```

- [ ] **Step 7: Format and commit Task 1**

Run:

```bash
npx -y pnpm@11.5.1 exec dprint fmt AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md devops/check-agent-instructions.mjs package.json
git add AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md devops/check-agent-instructions.mjs package.json .github/copilot-instructions.md packages/core/CLAUDE.md packages/diagram/CLAUDE.md packages/language-server/CLAUDE.md packages/language-services/CLAUDE.md packages/likec4-spa/CLAUDE.md packages/vite-plugin/CLAUDE.md packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md
npx -y pnpm@11.5.1 exec dprint check AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md devops/check-agent-instructions.mjs package.json
git diff --check
pnpm check:agent-instructions
```

Expected: all commands pass.

Commit:

```bash
git add AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md devops/check-agent-instructions.mjs package.json .github/copilot-instructions.md packages/core/CLAUDE.md packages/diagram/CLAUDE.md packages/language-server/CLAUDE.md packages/language-services/CLAUDE.md packages/likec4-spa/CLAUDE.md packages/vite-plugin/CLAUDE.md packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md
git commit -m "docs: add canonical agent instructions"
```

---

### Task 2: CI enforcement

**Files:**

- Modify: `.github/workflows/checks.yaml`

**Interfaces:**

- Consumes: `pnpm check:agent-instructions` from Task 1.
- Produces: GitHub Actions enforcement through the existing `check-types` job and existing `check-quality-gate` dependency chain.

- [ ] **Step 1: Add the CI step**

In `.github/workflows/checks.yaml`, add this step in `jobs.check-types.steps` immediately after the `🛠️ bootstrap` step and before `ʦ typecheck`:

```yaml
- name: 🤖 agent instructions
  run: pnpm check:agent-instructions
```

The `check-quality-gate` job already depends on `check-types`, so no quality-gate dependency change is needed.

- [ ] **Step 2: Run local checks**

Run:

```bash
pnpm check:agent-instructions
npx -y pnpm@11.5.1 exec dprint check .github/workflows/checks.yaml
git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Commit Task 2**

Commit:

```bash
git add .github/workflows/checks.yaml
git commit -m "ci: check canonical agent instructions"
```

---

### Task 3: Negative validation, final review, and branch hygiene

**Files:**

- Modify temporarily: `CLAUDE.md`
- Review: `AGENTS.md`
- Review: `devops/check-agent-instructions.mjs`
- Review: `.github/workflows/checks.yaml`

**Interfaces:**

- Consumes: validator and CI wiring from Tasks 1 and 2.
- Produces: verified branch ready for PR description/update.

- [ ] **Step 1: Prove the validator catches a broken Claude adapter**

Temporarily change `CLAUDE.md` with this patch:

```diff
*** Begin Patch
*** Update File: CLAUDE.md
@@
-@AGENTS.md
+@BROKEN.md
*** End Patch
```

Run:

```bash
pnpm check:agent-instructions
```

Expected: FAIL with:

```text
CLAUDE.md must contain exactly "@AGENTS.md" plus a trailing newline
```

Restore `CLAUDE.md` with this patch:

```diff
*** Begin Patch
*** Update File: CLAUDE.md
@@
-@BROKEN.md
+@AGENTS.md
*** End Patch
```

- [ ] **Step 2: Prove the validator catches a competing Copilot instruction file**

Temporarily recreate `.github/copilot-instructions.md` with this content:

```diff
*** Begin Patch
*** Add File: .github/copilot-instructions.md
+# Temporary invalid duplicate
+
+This file must not be tracked or kept locally.
*** End Patch
```

Run:

```bash
pnpm check:agent-instructions
```

Expected: FAIL with:

```text
Do not keep local .github/copilot-instructions.md; it becomes a competing instruction source
```

Delete `.github/copilot-instructions.md` again before continuing:

```diff
*** Begin Patch
*** Delete File: .github/copilot-instructions.md
*** End Patch
```

- [ ] **Step 3: Final validation**

Run:

```bash
pnpm check:agent-instructions
npx -y pnpm@11.5.1 exec dprint check AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md devops/check-agent-instructions.mjs package.json .github/workflows/checks.yaml
git diff --check
npx -y pnpm@11.5.1 git:pre-commit
```

Expected: all commands pass. `git:pre-commit` may report no matching staged tasks if nothing is staged.

- [ ] **Step 4: Review branch diff**

Run:

```bash
git status --short --branch
git diff --stat origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Expected tracked changes:

```text
A  AGENTS.md
M  CLAUDE.md
M  .github/agents/changeset-generator.agent.md
D  .github/copilot-instructions.md
M  .github/workflows/checks.yaml
A  devops/check-agent-instructions.mjs
M  package.json
D  packages/core/CLAUDE.md
D  packages/diagram/CLAUDE.md
D  packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md
D  packages/language-server/CLAUDE.md
D  packages/language-services/CLAUDE.md
D  packages/likec4-spa/CLAUDE.md
D  packages/vite-plugin/CLAUDE.md
```

The existing untracked local files must remain untracked and untouched.

- [ ] **Step 5: Final commit if Task 3 produced tracked fixes**

If Task 3 required any tracked corrections after Tasks 1 and 2, commit them:

```bash
git add AGENTS.md CLAUDE.md .github/agents/changeset-generator.agent.md .github/workflows/checks.yaml devops/check-agent-instructions.mjs package.json
git commit -m "docs: finalize canonical agent instruction checks"
```

If Task 3 produced no tracked corrections, do not create an empty commit.

---

## Self-review checklist

- [ ] `AGENTS.md` contains every source row from the preservation map.
- [ ] Root `CLAUDE.md` contains exactly `@AGENTS.md` plus a trailing newline.
- [ ] No tracked package-level `CLAUDE.md` files remain.
- [ ] No tracked or local `.github/copilot-instructions.md` remains.
- [ ] `.github/agents/changeset-generator.agent.md` clearly says `AGENTS.md` is canonical for shared rules.
- [ ] `devops/check-agent-instructions.mjs` uses only Node.js built-ins and `git`.
- [ ] `pnpm check:agent-instructions` passes.
- [ ] CI runs `pnpm check:agent-instructions` in `check-types`.
- [ ] `check-quality-gate` already depends on `check-types`.
- [ ] No changeset was added.
