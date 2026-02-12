# Repository Guidelines

LikeC4 is an architecture-as-code tool for visualizing software architecture. It provides a DSL for describing architecture, a language server, CLI, VSCode extension, and web-based diagram visualization.

## Project Structure & Module Organization

- Monorepo managed by `pnpm` workspaces and `turbo`.
- `apps/` contains user-facing apps (notably `apps/docs` and `apps/playground`).
- `packages/` holds:
  - `likec4/` - CLI, Vite plugin, static site generator (main entry point)
  - `core/` - Core and model types, model builder, compute-view, layout drifts detection logic
  - `language-server/` - Langium-based DSL parser and language services (LSP)
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

## Build, Test, and Development Commands

- `pnpm install` installs dependencies (requires Node `>=22.21.1`).
- `pnpm generate` pre-generates sources; always run after big merges or refactors.
- `pnpm build` builds packages (excludes docs/playground).
- `pnpm typecheck` validates typescript, always run after `pnpm generate`.
- `pnpm test` runs Vitest suites; (you can run `pnpm test --no-typecheck`)
- **`pnpm validate`** runs the same pipeline as CI (generate → typecheck → type tests in core → lint → build → lint:package → test). Run before pushing to catch the same failures as the PR checks.

## Generated Files

Several packages have auto-generated files that MUST be generated before:

- `packages/language-server/src/generated/*` - Langium parser (from grammar)
- `packages/language-server/src/generated-lib/*` - Registry of bundled icons
- `packages/vscode/src/meta.ts` - VSCode extension metadata
- `**/routeTree.gen.ts` - TanStack Router routes
- `styled-system/preset/src/generated.ts` - Panda CSS preset
- `styled-system/styles/dist/` - Panda CSS generated styles

DO NOT edit files that are git-ignored - they are generated and your changes will be overwritten.

Always run `pnpm generate` after:

- checkout
- when these files are missing.
- when changing styles presets in `styled-system/preset`
- when changing language grammar in `packages/language-server/src/like-c4.langium`

## Coding Style & Naming Conventions

- TypeScript-first repo; use explicit types.
- Avoid using `any`.
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
- Include a changeset for user-facing package changes (`pnpm changeset` or `pnpm changeset:empty`).
- PRs should include a clear description, linked issue (if any), and test results; add screenshots for UI changes.

## Configuration & Tooling Notes

- Pre-commit hooks use `nano-staged` to run `dprint` on staged files.
- Use `.tool-versions` for the expected Node/pnpm versions.
