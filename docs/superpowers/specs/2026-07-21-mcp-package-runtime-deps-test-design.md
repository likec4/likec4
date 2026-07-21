# MCP package runtime dependency test split design

## Context

Issue #3112 showed that `npx @likec4/mcp@1.59.1` could install the package successfully but fail at runtime with missing packages such as `lodash-es` and `vscode-languageserver`. The root cause was a package boundary problem: the published MCP bundle still referenced runtime packages, while most of those packages were only declared in `devDependencies`.

PR #3113 currently adds `packages/mcp/src/__tests__/package-runtime-deps.spec.ts`, but the test is partly hand-maintained. It catches the immediate regression if one of the listed packages moves back to `devDependencies`, but it can miss future runtime imports and does not prove the packed artifact works.

The clean review shape is to split the work:

- #3113 remains the urgent runtime fix for #3112.
- A follow-up PR owns the stronger package-boundary tests and CI wiring.

## Goals

- Keep #3113 focused on the release-regression fix and avoid expanding it into CI policy work.
- Replace the hand-maintained test with tests that derive their assertions from runtime source or packed artifacts.
- Prove the real `npx` boundary with a packed-artifact smoke that installs the tarball into a fresh temporary project.
- Wire the packed-artifact smoke into CI in a follow-up PR where CI runtime and flake risk can be reviewed separately.
- Keep normal unit tests fast and deterministic.

## Non-goals

- Do not add robust package-boundary checks to #3113.
- Do not add a full MCP server integration session to every unit test run.
- Do not require network-heavy fresh npm installs inside the normal Vitest suite.
- Do not redesign MCP packaging or the tsdown build in this change.

## Proposed approach

Use a two-PR strategy.

### PR 1: urgent #3112 fix

#3113 should contain only the immediate runtime fix:

- Move actual MCP runtime imports from `devDependencies` to `dependencies`.
- Keep the lockfile consistent with that manifest move.
- Fix MCP SDK runtime imports to use resolvable Node ESM subpaths.
- Keep the patch changeset for `@likec4/mcp`.
- Remove the hand-maintained `package-runtime-deps.spec.ts` from #3113. The follow-up PR owns automated package-boundary tests.
- Keep the packed fresh-install smoke as PR validation evidence in the PR body.

### PR 2: robust package checks

Create a follow-up PR that adds a hybrid test strategy.

1. Add a source/package manifest guard.
   - Walk MCP runtime source files under `packages/mcp/src`.
   - Exclude `__tests__`, `*.spec.ts`, `*.test.ts`, and `*.int.spec.ts`.
   - Parse import declarations with TypeScript rather than relying on a narrow regex.
   - Ignore type-only imports, relative imports, and Node builtins.
   - Assert every direct runtime package import is present in `package.json.dependencies`.
   - Assert those direct runtime packages are not present in `devDependencies`.
   - Use a small documented allowlist only for intentional exceptions.

2. Add an SDK subpath resolution assertion.
   - Collect runtime value imports from `@modelcontextprotocol/sdk/...`.
   - Assert each collected specifier is resolvable in Node with `import.meta.resolve`.
   - This verifies the actual behavior that failed for `@modelcontextprotocol/sdk/server/completable`, instead of assuming `.js` is sufficient.

3. Add a separate package smoke script for the actual publish boundary.
   - Build `@likec4/mcp`.
   - Pack the package into a temporary directory.
   - Install the tarball into a fresh temporary npm project.
   - Run `npx likec4-mcp --help`.
   - Keep this script outside the regular Vitest suite.
   - Wire it into CI in the follow-up PR, scoped to package/build checks so the added CI cost is visible and reviewable.

## Components

- `packages/mcp/src/__tests__/package-runtime-imports.spec.ts`
  - Fast Vitest guard for source imports and manifest placement.
  - Does not run package builds or fresh installs.

- `packages/mcp/scripts/smoke-packed-install.mjs`
  - Node script for the packed-artifact smoke.
  - Owns temp directory creation, package build/pack/install, command execution, and cleanup-safe diagnostics.

- `packages/mcp/package.json`
  - Adds an explicit `smoke:pack` script.
  - The script name should make clear that it is slower and package-boundary focused.

- `.github/workflows/checks.yaml`
  - Runs the MCP package smoke in the existing `check-build` job after `pnpm lint:package`.
  - Keeps the slow package-boundary check separate from normal Vitest.

## Data flow

In the follow-up PR, the Vitest guard reads MCP source files and `packages/mcp/package.json`, derives direct runtime package imports, and compares them against manifest dependency sections.

The smoke script starts from the workspace package, produces the same tarball shape users get from npm, installs that tarball into an isolated project, and executes the package bin. This validates `files`, `publishConfig`, workspace/catalog dependency rewriting, installed dependency graph, and Node ESM resolution together.

## Error handling and diagnostics

- The Vitest guard should report missing dependencies as clear strings such as `src/index.ts imports @likec4/language-services but it is not in dependencies`.
- The SDK resolution check should report the exact unresolved specifier and source file.
- The smoke script should print the tarball path, npm install log path, and failing command when it fails.
- Temporary directories may be left behind on failure for debugging, but the script should use unique `/tmp` paths and avoid touching repository source.

## Testing and validation

For #3113, validation remains:

- `pnpm --filter @likec4/mcp build`
- packed tarball fresh-install smoke run manually
- `pnpm --filter @likec4/mcp test -- --no-isolate`
- `pnpm --filter @likec4/mcp typecheck`
- `pnpm exec dprint check` on changed files
- `git diff --check`

For the follow-up package-check PR, run:

- `pnpm --filter @likec4/mcp exec vitest run src/__tests__/package-runtime-imports.spec.ts --no-isolate`
- `pnpm --filter @likec4/mcp build`
- `pnpm --filter @likec4/mcp test -- --no-isolate`
- `pnpm --filter @likec4/mcp typecheck`
- `pnpm --filter @likec4/mcp run smoke:pack`
- `pnpm exec dprint check` on changed files
- `git diff --check`

## Rejected approaches

- Keep only the current hand-written package list: too easy to miss future runtime imports.
- Put the fresh tarball install inside normal Vitest: too slow and too dependent on npm registry/network behavior for every unit test run.
- Only scan built `dist` chunks in unit tests: stronger for packaging, but requires a build before the test and makes the normal package test order more fragile.

## Decisions

- Split the work into two PRs.
- #3113 should stay focused on the urgent runtime dependency and ESM subpath fix.
- The follow-up PR should add the derived source-import guard, the packed install smoke, and CI wiring.
- Use `smoke:pack` as the package script name unless implementation discovers an existing package-script convention that is clearly more consistent.
