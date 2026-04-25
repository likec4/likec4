# Repository Guidelines

LikeC4 is an architecture-as-code tool for visualizing software architecture. It provides a DSL for describing architecture, a language server, CLI, VSCode extension, and web-based diagram visualization.

## Project Structure & Module Organization

- Monorepo managed by `pnpm` workspaces and `turbo`.
- `apps/` contains user-facing apps (notably `apps/docs` and `apps/playground`).
- `packages/` holds:
  - `likec4/` - CLI and static site generator (main entry point)
  - `likec4-spa/` - Single-page application for rendering architecture diagrams (webapp, extracted from former `packages/likec4/app/`)
  - `vite-plugin/` - LikeC4 Vite plugin (`@likec4/vite-plugin`)
  - `lsp/` - Standalone LikeC4 Language Server for editor integrations (`@likec4/lsp`)
  - `react/` - LikeC4 React bundle (`@likec4/react`)
  - `core/` - Core and model types, model builder, compute-view, layout drifts detection logic
  - `language-server/` - Langium-based DSL parser and LSP implementation
  - `language-services/` - Language services initialization (browser and Node.js compatible)
  - `diagram/` - React/ReactFlow diagram renderer
  - `layouts/` - Graphviz-based layout algorithms
  - `generators/` - Export to Mermaid, PlantUML, D2, etc.
  - `vscode/` - VSCode extension
  - `vscode-preview/` - Preview panel component for VSCode
  - `config/` - Configuration schema and validation
  - `icons/` - Icon bundle (never change, unless you are asked to, package is script-generated)
  - `log/` - Shared logging utilities
  - `mcp/` - MCP Server as separate package
  - `tsconfig/` - Shared TypeScript configuration
  - `create-likec4/` - Not used for now
- `e2e/` is an isolated workspace for Playwright end-to-end tests.
- `styled-system/preset` holds PandaCSS preset.
- `styled-system/styles` holds `pandacss codegen` results, shared across packages.
- `examples/` provides sample LikeC4 projects;
- `devops/` - utilities for CI/CD, devops tasks.
- **skills/** — Agent Skills for AI assistants ([`likec4-dsl`](skills/likec4-dsl/)).
- **MCP Server:** [packages/mcp/README.md](packages/mcp/README.md).
- **LeanIX / Draw.io (bridge):** [packages/leanix-bridge/README.md](packages/leanix-bridge/README.md); Agent Skill reference [skills/likec4-dsl/references/bridge-leanix-drawio.md](skills/likec4-dsl/references/bridge-leanix-drawio.md).

## App ↔ Language Server Architecture

The webapp talks to the Language Server through three layered packages. When extending the flow, pick the right layer:

- **`packages/diagram`** — UI contract. Renders diagrams from a `LikeC4Model`; defines the consumer contract via `LikeC4ModelProvider` ([`packages/diagram/src/LikeC4ModelProvider.tsx`](packages/diagram/src/LikeC4ModelProvider.tsx)) and `useLikeC4Model`-style hooks. Knows nothing about how data is fetched, stored, or mutated.
- **`packages/likec4-spa`** — UI host. Materializes the diagram into a runnable app and provides the "context": imports `likec4:*` virtual modules, wraps them in nanostores for HMR reactivity, mounts `LikeC4ModelProvider`. See [`packages/likec4-spa/src/context/LikeC4ModelContext.tsx`](packages/likec4-spa/src/context/LikeC4ModelContext.tsx).
- **`packages/vite-plugin`** — data + RPC bridge. Owns the `likec4:*` virtual modules ([`packages/vite-plugin/src/virtuals/`](packages/vite-plugin/src/virtuals/)) and a birpc channel between SPA and Language Server over Vite HMR ([`packages/vite-plugin/src/rpc/rpc.ts`](packages/vite-plugin/src/rpc/rpc.ts), client at [`packages/vite-plugin/src/virtuals/rpc.ts`](packages/vite-plugin/src/virtuals/rpc.ts)).

Dev-mode flow: `SPA → likec4:rpc (birpc over import.meta.hot) → vite-plugin (server.hot.on) → @likec4/language-services → updated likec4:model → HMR → SPA nanostore → diagram re-renders`. In production builds (`likec4 build`), RPC is absent and virtual modules are inlined as static JSON — the diagram is read-only.

### Where to make changes

- New visual feature, no new data → **`diagram`** only (extend hooks or contract).
- New data shape from the model → add a virtual module in **`vite-plugin`**, surface a hook/atom in **`likec4-spa`**, consume in **`diagram`**.
- New action that mutates the model (round-trip to LSP) → add an RPC method in **`vite-plugin/src/rpc`** (server handler + client wrapper), call from **`likec4-spa`**.
- Do NOT import `@likec4/language-server` directly from `likec4-spa` — always go through the vite-plugin RPC.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies (requires Node `>=22.21.1`).
- `pnpm generate` pre-generates sources; always run after big merges or refactors.
- `pnpm build` builds packages (excludes docs/playground).
- `pnpm typecheck` validates typescript, always run after `pnpm generate`.
- `pnpm test` runs Vitest suites; (you can run `pnpm test --no-typecheck`)

## Generated Files

Several packages have auto-generated files that MUST be generated before:

- `packages/language-server/src/generated/*` - Langium parser (from grammar)
- `packages/language-server/src/generated-lib/*` - Registry of bundled icons
- `packages/vscode/src/meta.ts` - VSCode extension metadata
- `**/routeTree.gen.ts` - TanStack Router routes
- `styled-system/preset/src/generated.ts` - Panda CSS preset
- `styled-system/styles/dist/` - Panda CSS generated styles
- `schemas/likec4-config.schema.json` - Configuration JSON-Schema, generated from `packages/config/src/schema.ts`

DO NOT edit files that are git-ignored - they are generated and your changes will be overwritten.

Always run `pnpm generate` after:

- checkout
- when these files are missing.
- when changing styles presets in `styled-system/preset`
- when changing language grammar in `packages/language-server/src/like-c4.langium`

## Coding Style & Naming Conventions

- TypeScript-first repo; use explicit types.
- Avoid using `any`, casts with `as`.
- Formatting is handled by `dprint` (120-column lines, single quotes, no semicolons).
- Use `oxlint` for linting; keep imports sorted and type-only imports grouped first.
- Use JSDoc to document public classes and methods.
- Favor switch(true) over if-else chains.
- Use Context7 MCP tools.

## Testing Guidelines

- Unit/integration tests use `vitest`;
- Test files are named `*.spec.ts` and live alongside sources; may use `__tests__` folders.
- Snapshots are stored in `__snapshots__` folders; update deliberately when behavior changes.
- Aim to cover new features with relevant tests; keep test names descriptive.
- Always run tests before committing.

## Commit & Pull Request Guidelines

- Recent history shows Conventional Commit-style prefixes (e.g., `feat:`, `chore:`); follow this pattern when possible.
- Keep commits focused and scoped to one change.
- Project requires changeset files (folder `.changeset/`).
  - use `changeset-generator` skill.
- PRs should include a clear description and linked issues (if any)

## Configuration & Tooling Notes

- Pre-commit hooks use `nano-staged` to run `dprint` on staged files.
- Use `.tool-versions` for the expected Node/pnpm versions.
- The `.cursor/` directory is gitignored; contributors may add their own `.cursor/rules/` locally (e.g. for remotes); do not commit it.
