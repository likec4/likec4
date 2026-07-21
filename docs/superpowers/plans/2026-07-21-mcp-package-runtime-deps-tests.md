# MCP Package Runtime Dependency Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the urgent #3112 MCP runtime fix from a follow-up PR that adds robust package-boundary checks and CI coverage.

**Architecture:** Keep #3113 focused on package metadata and ESM import fixes. Add a stacked follow-up PR that derives MCP runtime imports from TypeScript source, resolves MCP SDK runtime subpaths with Node, and runs a packed-tarball install smoke in CI.

**Tech Stack:** TypeScript compiler API, Vitest, Node.js `child_process`, npm tarball installs, pnpm/turbo package tasks, GitHub Actions.

## Global Constraints

- #3113 stays focused on the urgent runtime dependency and ESM subpath fix.
- The follow-up PR adds the derived source-import guard, the packed install smoke, and CI wiring.
- Keep normal unit tests fast and deterministic.
- Do not add a full MCP server integration session to every unit test run.
- Do not require network-heavy fresh npm installs inside the normal Vitest suite.
- Do not redesign MCP packaging or the tsdown build in this change.
- Use `smoke:pack` as the package script name.
- Work on PR branches; do not commit unrelated untracked scratch files.

---

## File Structure

- `packages/mcp/src/__tests__/package-runtime-deps.spec.ts`
  - Delete from #3113 because it is a hand-maintained guard that belongs in the stronger follow-up design, not in the urgent fix PR.

- `packages/mcp/src/__tests__/package-runtime-imports.spec.ts`
  - New follow-up PR Vitest file.
  - Owns source import discovery and manifest dependency assertions.
  - Uses TypeScript parsing instead of regex.
  - Runs quickly and does not build or install tarballs.

- `packages/mcp/scripts/smoke-packed-install.mjs`
  - New follow-up PR Node script.
  - Owns package build/pack invocation, fresh install directory setup, tarball install, `likec4-mcp --help` execution, and diagnostics.

- `packages/mcp/package.json`
  - In #3113: dependency/devDependency fix remains.
  - In follow-up PR: add `smoke:pack` script.

- `.github/workflows/checks.yaml`
  - Follow-up PR only.
  - Add MCP packed install smoke in `check-build` after `pnpm lint:package`.

- `docs/superpowers/specs/2026-07-21-mcp-package-runtime-deps-test-design.md`
  - Already committed.
  - Keep as design provenance for the split.

---

### Task 1: Refocus #3113 as the urgent #3112 fix

**Files:**

- Delete: `packages/mcp/src/__tests__/package-runtime-deps.spec.ts`
- Keep: `packages/mcp/package.json`
- Keep: `packages/mcp/src/prompts/applySemanticLayout.ts`
- Keep: `packages/mcp/src/tools/apply-semantic-layout.ts`
- Keep: `pnpm-lock.yaml`
- Keep: `.changeset/early-ravens-carry.md`
- Keep: `docs/superpowers/specs/2026-07-21-mcp-package-runtime-deps-test-design.md`

**Interfaces:**

- Consumes: existing branch `cgk/fix-3112-mcp-runtime-deps`.
- Produces: #3113 branch with only the urgent runtime dependency and ESM subpath fix plus design provenance.

- [ ] **Step 1: Confirm branch and diff scope**

```bash
git switch cgk/fix-3112-mcp-runtime-deps
git status -sb
gh pr diff 3113 --name-only
```

Expected: current branch is `cgk/fix-3112-mcp-runtime-deps`; unrelated scratch files may be untracked but must not be staged.

- [ ] **Step 2: Remove the hand-maintained test from #3113**

```bash
git rm packages/mcp/src/__tests__/package-runtime-deps.spec.ts
```

Expected: file is staged for deletion.

- [ ] **Step 3: Run the urgent PR validation**

```bash
pnpm --filter @likec4/mcp build
pnpm --filter @likec4/mcp test -- --no-isolate
pnpm --filter @likec4/mcp typecheck
pnpm exec dprint check \
  packages/mcp/package.json \
  packages/mcp/src/prompts/applySemanticLayout.ts \
  packages/mcp/src/tools/apply-semantic-layout.ts \
  .changeset/early-ravens-carry.md \
  docs/superpowers/specs/2026-07-21-mcp-package-runtime-deps-test-design.md
git diff --check
```

Expected: all commands pass. The MCP build may emit existing `node:path` externalization warnings but must exit 0.

- [ ] **Step 4: Re-run the manual packed fresh-install smoke for #3113**

```bash
packdir="/tmp/likec4-pack-3112-$(date +%s)-$$"
mkdir -p "$packdir"
cd packages/mcp
pnpm pack --pack-destination "$packdir"
pkg="$(ls -1 "$packdir"/*.tgz | head -n 1)"
testdir="/tmp/likec4-3112-install-$(date +%s)-$$"
mkdir -p "$testdir"
cd "$testdir"
npm init -y >/dev/null
npm install "$pkg" >/tmp/likec4-3112-install.log 2>&1
timeout 20 npx likec4-mcp --help
```

Expected: `likec4-mcp --help` prints CLI usage and exits 0. If `npm install` fails, inspect `/tmp/likec4-3112-install.log`.

- [ ] **Step 5: Commit and push #3113 cleanup**

```bash
cd /home/ckeller/src/likec4
git status -sb
git add -u packages/mcp/src/__tests__/package-runtime-deps.spec.ts
git commit -m "test: defer MCP package smoke checks"
git push
```

Expected: #3113 updates with the test deletion and remains focused on the urgent fix.

- [ ] **Step 6: Update #3113 PR description**

Use `gh pr edit` so the validation list no longer claims the deleted test file exists.

```bash
gh pr view 3113 --json body --jq .body > /tmp/pr-3113-body.md
```

Edit `/tmp/pr-3113-body.md`:

- Remove `pnpm --filter @likec4/mcp exec vitest run src/__tests__/package-runtime-deps.spec.ts --no-isolate`.
- Keep the manual packed fresh-install smoke evidence.
- Add one sentence: `Automated package-boundary checks are split into a follow-up PR so this PR stays focused on the urgent runtime fix.`

Then apply:

```bash
gh pr edit 3113 --body-file /tmp/pr-3113-body.md
```

Expected: PR body matches the new split.

---

### Task 2: Create the follow-up branch and source import guard

**Files:**

- Create: `packages/mcp/src/__tests__/package-runtime-imports.spec.ts`

**Interfaces:**

- Consumes: #3113 branch after Task 1.
- Produces: `collectRuntimeImportsFromFile(filePath: string): RuntimeImport[]` and Vitest assertions that direct runtime package imports are declared in `dependencies`.

- [ ] **Step 1: Create the stacked follow-up branch**

```bash
git switch cgk/fix-3112-mcp-runtime-deps
git pull --ff-only
git switch -c cgk/mcp-package-boundary-checks
```

Expected: new branch is based on the #3113 fix branch. The eventual PR should target `cgk/fix-3112-mcp-runtime-deps` while #3113 is open.

- [ ] **Step 2: Add the failing source-import guard test**

Create `packages/mcp/src/__tests__/package-runtime-imports.spec.ts` with this content:

```ts
// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { readdirSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'

type RuntimeImport = {
  file: string
  packageName: string
  specifier: string
}

const packageDir = fileURLToPath(new URL('../..', import.meta.url))
const srcDir = fileURLToPath(new URL('..', import.meta.url))

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map(moduleName => `node:${moduleName}`),
])

function isRuntimeSourceFile(fileName: string): boolean {
  return fileName.endsWith('.ts')
    && !fileName.endsWith('.d.ts')
    && !fileName.endsWith('.spec.ts')
    && !fileName.endsWith('.test.ts')
    && !fileName.endsWith('.int.spec.ts')
}

function sourceFiles(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '__tests__') {
      return []
    }
    const child = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      return sourceFiles(child)
    }
    return isRuntimeSourceFile(entry.name) ? [child] : []
  })
}

function packageNameFromSpecifier(specifier: string): string | null {
  if (specifier.startsWith('.') || specifier.startsWith('/') || nodeBuiltins.has(specifier)) {
    return null
  }
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0] ?? null
}

function hasRuntimeImport(importClause: ts.ImportClause | undefined): boolean {
  if (!importClause) {
    return true
  }
  if (importClause.isTypeOnly) {
    return false
  }
  if (importClause.name) {
    return true
  }
  const namedBindings = importClause.namedBindings
  if (!namedBindings) {
    return false
  }
  if (ts.isNamespaceImport(namedBindings)) {
    return true
  }
  if (namedBindings.elements.length === 0) {
    return true
  }
  return namedBindings.elements.some(element => !element.isTypeOnly)
}

function runtimeImport(filePath: string, specifier: string): RuntimeImport | null {
  const packageName = packageNameFromSpecifier(specifier)
  if (!packageName) {
    return null
  }
  return {
    file: relative(packageDir, filePath),
    packageName,
    specifier,
  }
}

function collectRuntimeImportsFromSource(sourceText: string, filePath: string): Array<RuntimeImport> {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports: Array<RuntimeImport> = []

  function addSpecifier(specifier: string) {
    const importInfo = runtimeImport(filePath, specifier)
    if (importInfo) {
      imports.push(importInfo)
    }
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (hasRuntimeImport(node.importClause)) {
        addSpecifier(node.moduleSpecifier.text)
      }
    }
    if (
      ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      addSpecifier(node.moduleSpecifier.text)
    }
    if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length === 1
      && ts.isStringLiteral(node.arguments[0])
    ) {
      addSpecifier(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return imports
}

function collectRuntimeImportsFromFile(filePath: string): Array<RuntimeImport> {
  return collectRuntimeImportsFromSource(readFileSync(filePath, 'utf8'), filePath)
}

function uniqueRuntimeImports(): Array<RuntimeImport> {
  const seen = new Set<string>()
  return sourceFiles(srcDir)
    .flatMap(collectRuntimeImportsFromFile)
    .filter(importInfo => {
      const key = `${importInfo.file}:${importInfo.specifier}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

describe('@likec4/mcp runtime package imports', () => {
  it('extracts only runtime package imports from TypeScript source', () => {
    const imports = collectRuntimeImportsFromSource(
      [
        'import type { TypeOnly } from \'type-only-package\'',
        'import { value, type ValueType } from \'@scope/runtime/value\'',
        'import defaultValue from \'default-runtime\'',
        'import * as namespaceValue from \'namespace-runtime\'',
        'import {} from \'empty-runtime\'',
        'import \'side-effect-runtime\'',
        'import { readFileSync } from \'node:fs\'',
        'import { local } from \'./local\'',
        'export { runtimeExport } from \'export-runtime\'',
        'export type { ExportType } from \'export-type-only\'',
        'async function load() { return import(\'dynamic-runtime\') }',
      ].join('\n'),
      `${packageDir}/synthetic.ts`,
    )

    expect(imports.map(({ packageName, specifier }) => [packageName, specifier])).toEqual([
      ['@scope/runtime', '@scope/runtime/value'],
      ['default-runtime', 'default-runtime'],
      ['namespace-runtime', 'namespace-runtime'],
      ['empty-runtime', 'empty-runtime'],
      ['side-effect-runtime', 'side-effect-runtime'],
      ['export-runtime', 'export-runtime'],
      ['dynamic-runtime', 'dynamic-runtime'],
    ])
  })

  it('declares direct runtime package imports as dependencies', () => {
    const dependencies = new Set(Object.keys(packageJson.dependencies ?? {}))
    const devDependencies = new Set(Object.keys(packageJson.devDependencies ?? {}))

    const missingDependencies = uniqueRuntimeImports()
      .filter(({ packageName }) => !dependencies.has(packageName))
      .map(({ file, packageName, specifier }) => `${file} imports ${specifier} from ${packageName}`)

    const misplacedDependencies = uniqueRuntimeImports()
      .filter(({ packageName }) => devDependencies.has(packageName))
      .map(({ file, packageName, specifier }) => `${file} imports ${specifier} from ${packageName}`)

    expect(missingDependencies).toEqual([])
    expect(misplacedDependencies).toEqual([])
  })

  it('uses Node-resolvable runtime MCP SDK subpaths', () => {
    const unresolved = uniqueRuntimeImports()
      .filter(({ specifier }) => specifier.startsWith('@modelcontextprotocol/sdk/'))
      .flatMap(({ file, specifier }) => {
        try {
          import.meta.resolve(specifier)
          return []
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          return [`${file} imports ${specifier}: ${message}`]
        }
      })

    expect(unresolved).toEqual([])
  })
})
```

Expected: test file exists but has not been run yet.

- [ ] **Step 3: Run the focused test**

```bash
pnpm --filter @likec4/mcp exec vitest run src/__tests__/package-runtime-imports.spec.ts --no-isolate
```

Expected: PASS. If it fails because a real runtime import is missing from `dependencies`, fix `packages/mcp/package.json` and `pnpm-lock.yaml` before continuing. Do not add an allowlist for actual runtime package imports.

- [ ] **Step 4: Commit the source import guard**

```bash
git add packages/mcp/src/__tests__/package-runtime-imports.spec.ts
git commit -m "test: derive MCP runtime package imports"
```

Expected: one commit containing only the new Vitest guard.

---

### Task 3: Add the packed install smoke script

**Files:**

- Create: `packages/mcp/scripts/smoke-packed-install.mjs`
- Modify: `packages/mcp/package.json`

**Interfaces:**

- Consumes: package tarballs produced by `pnpm turbo run pack --filter=@likec4/mcp...`.
- Produces: package script `smoke:pack` that verifies the packed MCP tarball can be installed and executed in a fresh npm project.

- [ ] **Step 1: Create the smoke script**

Create `packages/mcp/scripts/smoke-packed-install.mjs` with this content:

```js
#!/usr/bin/env node

// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = resolve(packageDir, '../..')
const runOnWindowsShell = process.platform === 'win32'

function run(command, args, options = {}) {
  const cwd = options.cwd ?? repoRoot
  console.log(`$ ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      CI: 'true',
    },
    encoding: 'utf8',
    shell: runOnWindowsShell,
    stdio: options.capture ? 'pipe' : 'inherit',
  })

  if (options.capture) {
    return result
  }

  if (result.status !== 0) {
    throw new Error(`Command failed with exit ${result.status ?? result.signal}: ${command} ${args.join(' ')}`)
  }
  return result
}

function packageTarballs() {
  const packagesDir = join(repoRoot, 'packages')
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(packagesDir, entry.name, 'package.tgz'))
    .filter(existsSync)
}

function cleanPackageTarballs() {
  for (const tarball of packageTarballs()) {
    rmSync(tarball)
  }
}

const tempRoot = mkdtempSync(join(tmpdir(), 'likec4-mcp-pack-smoke-'))
const installDir = join(tempRoot, 'install')
const installLog = join(tempRoot, 'npm-install.log')

mkdirSync(installDir)

console.log(`Smoke workspace: ${tempRoot}`)
cleanPackageTarballs()
run('pnpm', ['turbo', 'run', 'pack', '--filter=@likec4/mcp...'])

const tarballs = packageTarballs()
const mcpTarball = join(packageDir, 'package.tgz')

if (!existsSync(mcpTarball)) {
  throw new Error(`Expected MCP tarball was not created: ${mcpTarball}`)
}
if (!tarballs.includes(mcpTarball)) {
  tarballs.push(mcpTarball)
}

writeFileSync(
  join(installDir, 'package.json'),
  `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
)

const install = run('npm', ['install', ...tarballs], { cwd: installDir, capture: true })
writeFileSync(installLog, `${install.stdout ?? ''}${install.stderr ?? ''}`)

if (install.status !== 0) {
  console.error(`npm install failed. Log: ${installLog}`)
  process.stdout.write(install.stdout ?? '')
  process.stderr.write(install.stderr ?? '')
  throw new Error(`npm install failed with exit ${install.status ?? install.signal}`)
}

run('npx', ['likec4-mcp', '--help'], { cwd: installDir })
console.log(`MCP packed install smoke passed. Tarball: ${mcpTarball}`)
```

Expected: script is created and has the NVIDIA header.

- [ ] **Step 2: Add the package script**

Modify `packages/mcp/package.json` scripts block to include `smoke:pack` after `pack`:

```json
{
  "scripts": {
    "typecheck": "tsc -b --verbose",
    "build": "tsdown",
    "preinspector": "tsdown",
    "inspector": "DANGEROUSLY_OMIT_AUTH=1 LIKEC4_WORKSPACE=../../examples pnpx @modelcontextprotocol/inspector node bin/likec4-mcp.mjs",
    "pack": "pnpm pack",
    "smoke:pack": "node scripts/smoke-packed-install.mjs",
    "postpack": "likec4ops postpack",
    "clean": "likec4ops clean",
    "test": "vitest run --no-isolate",
    "vitest:ui": "vitest --no-isolate --ui",
    "test:watch": "vitest"
  }
}
```

Expected: JSON remains sorted consistently with the surrounding scripts and has no trailing semicolons.

- [ ] **Step 3: Run the smoke script**

```bash
pnpm --filter @likec4/mcp run smoke:pack
```

Expected: script builds/packs the MCP dependency closure, installs local tarballs into a temp npm project, runs `npx likec4-mcp --help`, and exits 0.

- [ ] **Step 4: Commit the smoke script**

```bash
git add packages/mcp/scripts/smoke-packed-install.mjs packages/mcp/package.json
git commit -m "test: smoke MCP packed install"
```

Expected: one commit containing the smoke script and package script.

---

### Task 4: Wire the packed smoke into CI

**Files:**

- Modify: `.github/workflows/checks.yaml`

**Interfaces:**

- Consumes: `pnpm --filter @likec4/mcp run smoke:pack` from Task 3.
- Produces: CI package-boundary coverage in the existing `check-build` job.

- [ ] **Step 1: Add the workflow step**

Modify `.github/workflows/checks.yaml` in the `check-build` job after `pnpm lint:package`:

The snippet is shown without the parent `steps:` indentation:

```yaml
- name: ⚙️ MCP packed install smoke
  run: pnpm --filter @likec4/mcp run smoke:pack
```

Expected surrounding section:

The snippet is shown without the parent `steps:` indentation:

```yaml
- name: ⚙️ lint:package
  run: |
    pnpm lint:package

- name: ⚙️ MCP packed install smoke
  run: pnpm --filter @likec4/mcp run smoke:pack

- name: Upload artifact
  uses: actions/upload-artifact@v7
```

- [ ] **Step 2: Run local validation for CI-related files**

```bash
pnpm exec dprint check .github/workflows/checks.yaml packages/mcp/package.json packages/mcp/scripts/smoke-packed-install.mjs packages/mcp/src/__tests__/package-runtime-imports.spec.ts
git diff --check
```

Expected: both commands pass.

- [ ] **Step 3: Commit CI wiring**

```bash
git add .github/workflows/checks.yaml
git commit -m "ci: smoke MCP packed install"
```

Expected: one commit containing only workflow wiring.

---

### Task 5: Final validation and PR creation

**Files:**

- No new source files beyond Tasks 2-4.
- Pull request metadata for the follow-up PR.

**Interfaces:**

- Consumes: commits from Tasks 2-4 on `cgk/mcp-package-boundary-checks`.
- Produces: stacked follow-up PR targeting `cgk/fix-3112-mcp-runtime-deps`.

- [ ] **Step 1: Run full follow-up validation**

```bash
pnpm --filter @likec4/mcp exec vitest run src/__tests__/package-runtime-imports.spec.ts --no-isolate
pnpm --filter @likec4/mcp build
pnpm --filter @likec4/mcp test -- --no-isolate
pnpm --filter @likec4/mcp typecheck
pnpm --filter @likec4/mcp run smoke:pack
pnpm exec dprint check \
  .github/workflows/checks.yaml \
  packages/mcp/package.json \
  packages/mcp/scripts/smoke-packed-install.mjs \
  packages/mcp/src/__tests__/package-runtime-imports.spec.ts
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Confirm follow-up branch diff is scoped**

```bash
git status -sb
git diff --stat cgk/fix-3112-mcp-runtime-deps...HEAD
git diff --name-only cgk/fix-3112-mcp-runtime-deps...HEAD
```

Expected changed files:

```text
.github/workflows/checks.yaml
packages/mcp/package.json
packages/mcp/scripts/smoke-packed-install.mjs
packages/mcp/src/__tests__/package-runtime-imports.spec.ts
```

- [ ] **Step 3: Push and create the stacked follow-up PR**

```bash
git push -u origin cgk/mcp-package-boundary-checks
gh pr create \
  --draft \
  --base cgk/fix-3112-mcp-runtime-deps \
  --head cgk/mcp-package-boundary-checks \
  --title "test: add MCP package boundary smoke checks" \
  --body-file - <<'EOF'
Follow-up to #3113.

## What changed

- Adds a derived source-import guard for `@likec4/mcp` runtime package dependencies.
- Verifies runtime `@modelcontextprotocol/sdk/*` subpaths are Node-resolvable.
- Adds `pnpm --filter @likec4/mcp run smoke:pack` to build, pack, install, and execute the MCP package from a fresh npm project.
- Wires the packed install smoke into the build/package CI job.

## Why

#3112 exposed a package-boundary regression: the published MCP package installed but failed at runtime because the packed artifact referenced packages that were not installed by `npx`. #3113 fixes the immediate runtime dependency issue. This follow-up adds checks that exercise the same boundary so future regressions are caught in CI.

## Validation

- `pnpm --filter @likec4/mcp exec vitest run src/__tests__/package-runtime-imports.spec.ts --no-isolate`
- `pnpm --filter @likec4/mcp build`
- `pnpm --filter @likec4/mcp test -- --no-isolate`
- `pnpm --filter @likec4/mcp typecheck`
- `pnpm --filter @likec4/mcp run smoke:pack`
- `pnpm exec dprint check .github/workflows/checks.yaml packages/mcp/package.json packages/mcp/scripts/smoke-packed-install.mjs packages/mcp/src/__tests__/package-runtime-imports.spec.ts`
- `git diff --check`
EOF
```

Expected: a draft stacked PR is created and points at #3113’s branch.

- [ ] **Step 4: Update #3113 with the follow-up link**

Read the current branch PR number and add a short comment to #3113:

```bash
follow_up_pr="$(gh pr view --json number --jq .number)"
gh pr comment 3113 --body "Follow-up package-boundary checks PR: #${follow_up_pr}"
```

Expected: #3113 has a visible link to the follow-up PR.
