# Repository Guidelines

LikeC4 is an architecture-as-code tool for visualizing software architecture. It provides a DSL for describing architecture, a language server, CLI, VSCode extension, and web-based diagram visualization.

## Project Structure & Module Organization

- Monorepo managed by `pnpm` workspaces and `turbo`.
- `apps/` contains user-facing apps (notably `apps/docs` and `apps/playground`).
- `packages/` holds libraries (`packages/core`, `packages/likec4`, `packages/diagram`, etc.).
- `e2e/` is an isolated workspace for Playwright end-to-end tests.
- `styled-system/preset` holds PandaCSS preset.
- `styled-system/styles` holds `pandacss codegen` results, shared across packages.
- `examples/` provides sample LikeC4 projects;
- `devops/` - utilities for CI/CD, devops tasks.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies (requires Node `>=22.21.1`).
- `pnpm generate` pre-generates sources; run after big merges or refactors.
- `pnpm build` builds packages (excludes docs/playground).
- `pnpm dev` inside `apps/playground` or `packages/likec4` starts hot-reload development.
- `pnpm test` runs Vitest suites; (you can run `pnpm test --no-typecheck`)
- `pnpm lint` (oxlint) and `pnpm fmt` (dprint) enforce style and formatting.

## Generated Files

Several packages have auto-generated files that MUST be generated before building:

- `packages/language-server/src/generated/*` - Langium parser (from grammar)
- `packages/language-server/src/generated-lib/*` - Registry of bundled icons
- `packages/vscode/src/meta.ts` - VSCode extension metadata
- `packages/likec4/app/src/routeTree.gen.ts` - TanStack Router routes
- `styled-system/preset/src/generated.ts` - Panda CSS preset

Always run `pnpm generate` after checkout or when these files are missing.

## Coding Style & Naming Conventions

- TypeScript-first repo; use explicit types, never use `any`.
- Formatting is handled by `dprint` (120-column lines, single quotes, no semicolons).
- Use `oxlint` for linting; keep imports sorted and type-only imports grouped first.
- Test files are named `*.spec.ts`; may use `__tests__` folders.

## Testing Guidelines

- Unit/integration tests use `vitest` and live alongside source modules.
- Snapshots are stored in `__snapshots__` folders; update deliberately when behavior changes.
- Aim to cover new features with relevant tests; keep test names descriptive.

## Commit & Pull Request Guidelines

- Recent history shows Conventional Commit-style prefixes (e.g., `feat:`, `chore:`); follow this pattern when possible.
- Keep commits focused and scoped to one change.
- Include a changeset for user-facing package changes (`pnpm changeset` or `pnpm changeset:empty`).
- PRs should include a clear description, linked issue (if any), and test results; add screenshots for UI changes.

## Configuration & Tooling Notes

- Pre-commit hooks use `nano-staged` to run `dprint` on staged files.
- Use `.tool-versions` for the expected Node/pnpm versions.
