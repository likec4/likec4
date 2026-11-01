# Repository Guidelines

AGENTS.md is the canonical shared repository instruction file. Tool-specific files must import, point to, or defer to this file instead of duplicating repository guidance.

LikeC4 is an architecture-as-code tool for visualizing software architecture. It provides a DSL for describing architecture, a language server, CLI, VSCode extension, and web-based diagram visualization.

## Read task guidance before work

AGENTS.md is the entry point and canonical shared policy. The linked references own the detailed rules;
do not copy them into tool adapters. Paths below are relative to the repository root.
Before planning, editing, or reviewing, read each reference that matches the task, including cross-package work.
Read these files explicitly; do not depend on automatic nested instruction or skill discovery.

- To locate packages, apps, exports, examples, or bridge documentation: [project map](devops/agent-instructions/project-map.md).
- For model stages, Builder types, SDK APIs, DSL generation/writeback, core declarations, view drift,
  grammar, or language services: [model and API rules](devops/agent-instructions/model-api.md). Read for changes in
  `packages/core`, `packages/language-server`, `packages/language-services`, `packages/generators`, or `packages/likec4`.
- For diagram UI, state, SPA, virtual modules, RPC, or app/language-server data flow:
  [webapp rules](devops/agent-instructions/webapp.md). Read for changes in `packages/diagram`,
  `packages/likec4-spa`, or `packages/vite-plugin`, and for `packages/likec4` static-site builds
  or `./internal` consumers.
- For sequence layout in either `packages/diagram/src/likec4diagram/xyflow-sequence/` or
  `packages/layouts/src/sequence/`, including calls from `packages/layouts/src/graphviz/GraphvizLayoter.ts`:
  [sequence rules](devops/agent-instructions/sequence.md). Also read webapp rules when
  working in the diagram dev copy.

Critical boundaries: DSL writeback loses comments, source positions, and formatting; it is generation, not formatting.
Keep data access out of `packages/diagram`; wire it through SPA and vite-plugin. RPC is dev-only;
production diagrams are read-only. Do not import `@likec4/language-server` into SPA or
`@likec4/layouts` into diagram. For core view changes, update drift detection and auto-applying logic;
ask if drift behavior is unclear. Read model and API rules before downstream typechecks after core exports change.

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
- `pnpm check:agent-instructions` validates that this file remains canonical and that instruction and skill adapters do not drift.

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
- Nested `CLAUDE.md` files are not shared adapters. Keep one only when Claude Code's lazy-loaded subtree memory should point agents at materially local guidance routed by AGENTS.md; it must import AGENTS.md and contain only a short pointer, not copied rules. Currently `packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md` is allowed for the sequence layouter workbench.
- Tools with native `AGENTS.md` support should read `AGENTS.md` directly.
- Tool-specific files with import support should import `AGENTS.md`.
- Tools without import support may use generated plain-text adapters derived from `AGENTS.md`, but those adapters must be generated and checked for drift.
- Do not use symlink adapters for shared repository instructions; this repository has Windows CI and Windows contributors.
- Do not duplicate repository instructions into a second long-lived source of truth.
- Do not create `AGENT.md`.
- `.github/agents/*.agent.md` files may remain only as task-specific wrappers. Shared repository policy must live here in `AGENTS.md`; task details belong in its linked references.
- VS Code and GitHub Copilot coding-agent/code-review surfaces can consume `AGENTS.md`. Do not add `.github/copilot-instructions.md`; any future adapter must be generated from `AGENTS.md` and added together with drift validation.
- The `.cursor/` directory is gitignored. Contributors may add local `.cursor/rules/` files for personal use, but do not commit them.
- Repo-local developer workflow skills live in `.agents/skills/`.
- The public LikeC4 DSL skill lives in `skills/likec4-dsl/`.
- Claude Code discovers project skills from `.claude/skills/`; keep each tracked `.claude/skills/*` entry as a per-skill symlink to one canonical skill directory.
- Do not duplicate skill bodies into `.claude/skills/`; add or update the symlink adapter and `devops/check-agent-skills.mjs` together.
- Use `.tool-versions` for expected Node and pnpm versions.
- Pre-commit hooks use `nano-staged` to run dprint on staged files.
