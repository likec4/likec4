# MCP package runtime dependency test design

## Context

Issue #3112 showed that `npx @likec4/mcp@1.59.1` could install the package successfully but fail at runtime with missing packages such as `lodash-es` and `vscode-languageserver`. The root cause was a package boundary problem: the published MCP bundle still referenced runtime packages, while most of those packages were only declared in `devDependencies`.

PR #3113 currently adds `packages/mcp/src/__tests__/package-runtime-deps.spec.ts`, but the test is partly hand-maintained. It catches the immediate regression if one of the listed packages moves back to `devDependencies`, but it can miss future runtime imports and does not prove the packed artifact works.

## Goals

- Keep a fast test that fails when MCP runtime source imports a package that is not declared in `dependencies`.
- Prove the real `npx` boundary with a packed-artifact smoke that installs the tarball into a fresh temporary project.
- Avoid brittle tests that duplicate a hand-written list of package names without checking the source or package artifact.
- Keep normal unit tests fast and deterministic.

## Non-goals

- Do not add a full MCP server integration session to every unit test run.
- Do not require network-heavy fresh npm installs inside the normal Vitest suite.
- Do not redesign MCP packaging or the tsdown build in this change.

## Proposed approach

Use a hybrid test strategy.

1. Revise `package-runtime-deps.spec.ts` into a source/package manifest guard.
   - Walk MCP runtime source files under `packages/mcp/src`.
   - Exclude `__tests__`, `*.spec.ts`, `*.test.ts`, and `*.int.spec.ts`.
   - Parse import declarations with TypeScript rather than relying on a narrow regex.
   - Ignore type-only imports, relative imports, and Node builtins.
   - Assert every direct runtime package import is present in `package.json.dependencies`.
   - Assert those direct runtime packages are not present in `devDependencies`.
   - Use a small documented allowlist only for intentional exceptions.

2. Replace the SDK subpath suffix assertion with a resolution assertion.
   - Collect runtime value imports from `@modelcontextprotocol/sdk/...`.
   - Assert each collected specifier is resolvable in Node with `import.meta.resolve`.
   - This verifies the actual behavior that failed for `@modelcontextprotocol/sdk/server/completable`, instead of assuming `.js` is sufficient.

3. Add a separate package smoke script for the actual publish boundary.
   - Build `@likec4/mcp`.
   - Pack the package into a temporary directory.
   - Install the tarball into a fresh temporary npm project.
   - Run `npx likec4-mcp --help`.
   - Keep this script outside the regular Vitest suite; run it explicitly in validation and make it suitable for future CI wiring.

## Components

- `packages/mcp/src/__tests__/package-runtime-deps.spec.ts`
  - Fast Vitest guard for source imports and manifest placement.
  - Does not run package builds or fresh installs.

- `packages/mcp/scripts/smoke-packed-install.mjs`
  - Node script for the packed-artifact smoke.
  - Owns temp directory creation, package build/pack/install, command execution, and cleanup-safe diagnostics.

- `packages/mcp/package.json`
  - Adds an explicit `smoke:pack` script.
  - The script name should make clear that it is slower and package-boundary focused.

## Data flow

The Vitest guard reads MCP source files and `packages/mcp/package.json`, derives direct runtime package imports, and compares them against manifest dependency sections.

The smoke script starts from the workspace package, produces the same tarball shape users get from npm, installs that tarball into an isolated project, and executes the package bin. This validates `files`, `publishConfig`, workspace/catalog dependency rewriting, installed dependency graph, and Node ESM resolution together.

## Error handling and diagnostics

- The Vitest guard should report missing dependencies as clear strings such as `src/index.ts imports @likec4/language-services but it is not in dependencies`.
- The SDK resolution check should report the exact unresolved specifier and source file.
- The smoke script should print the tarball path, npm install log path, and failing command when it fails.
- Temporary directories may be left behind on failure for debugging, but the script should use unique `/tmp` paths and avoid touching repository source.

## Testing and validation

After implementation, run:

- `pnpm --filter @likec4/mcp exec vitest run src/__tests__/package-runtime-deps.spec.ts --no-isolate`
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

- Use `smoke:pack` as the package script name unless implementation discovers an existing package-script convention that is clearly more consistent.
- Do not wire the smoke script into CI in this revision. Keep the PR focused on making the test meaningful, run the smoke script as explicit validation, and leave CI wiring as a follow-up if maintainers want the slower package-boundary check on every PR.
