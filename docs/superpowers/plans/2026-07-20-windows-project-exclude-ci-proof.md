# Windows Project Exclude CI Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stacked, test-only PR proving project `exclude: ["test.c4"]` fails on real Windows CI before #3107 and passes on top of #3107.

**Architecture:** The follow-up PR adds one Windows-only Vitest regression in `packages/language-server/src/workspace/ProjectsManager.spec.ts`. The test uses actual Windows path input (`c:\...`) through `URI.file` on a `windows-latest` runner and verifies the excluded document is blocked at the project-document boundary and from computed model views. Red/green proof comes from running the same test-only commit once against `origin/main` and once on the stacked branch.

**Tech Stack:** TypeScript, Vitest, Langium test services, `vscode-uri`, GitHub Actions `windows-latest`, `gh`.

## Global Constraints

- Base branch for the real PR is `cgk/fix-windows-project-excludes`.
- Real branch is `cgk/windows-project-exclude-ci-proof`.
- The real PR is test-only unless Windows CI exposes a defect in #3107.
- The temporary repro branch is based on `origin/main` and is used only to capture failing Windows CI evidence.
- The real PR title is `test(lsp): prove project excludes on Windows paths`.
- The real PR body must include "Follow-up to #3107" and "References #2546".
- Do not add a changeset for this test-only follow-up.
- Do not stage unrelated scratch files: `.playwright-mcp/`, `.superpowers/`, `.worktrees/`, `0`, `likec4-relationship-dom.json`, `network-likec4-virtuals.md`, `relationship-export-initial.md`.
- Use `gh`, not a browser, for GitHub PR and CI operations.

---

### Task 1: Add the Windows-only regression test

**Files:**

- Modify: `packages/language-server/src/workspace/ProjectsManager.spec.ts`

**Interfaces:**

- Consumes: `createMultiProjectTestServices({})` from `packages/language-server/src/test/testServices.ts`.
- Consumes: `projectsManager.registerProject({ config, folderUri })`.
- Consumes: `projectsManager.isExcluded(projectId, doc)`, `projectsManager.isIncluded(projectId, doc)`, `projectsManager.ownerProjectId(doc)`.
- Consumes: `services.shared.workspace.LangiumDocumentFactory.fromString(input, uri)`.
- Consumes: `services.shared.workspace.LangiumDocuments.projectDocuments(projectId)`.
- Consumes: `buildModel(projectId)` from the multi-project fixture.
- Produces: A committed Windows-only regression test that fails on `origin/main` and passes on top of #3107.

- [ ] **Step 1: Insert the failing Windows regression test**

Add this test inside the existing `describe.runIf(process.platform === 'win32')('On Windows', () => { ... })` block in `packages/language-server/src/workspace/ProjectsManager.spec.ts`, after `should handle folder URIs` and before the existing `it.todo('should exclude node_modules', ...)`.

```ts
it('should exclude same-directory files from project config on real Windows paths', async ({ expect }) => {
  const { projectsManager, services, validateAll, buildModel } = await createMultiProjectTestServices({})

  const projectRoot = 'c:\\likec4-repro\\architecture'
  const modelDocUri = URI.file(`${projectRoot}\\model.c4`)
  const excludedDocUri = URI.file(`${projectRoot}\\test.c4`)

  const project = await projectsManager.registerProject({
    config: {
      name: 'architecture-repository',
      title: 'Repozytorium architektury',
      exclude: ['test.c4'],
      implicitViews: false,
      landingPage: {
        redirect: true,
      },
    },
    folderUri: projectRoot,
  })

  const modelDoc = services.shared.workspace.LangiumDocumentFactory.fromString(
    `
        specification {
          element component
        }

        model {
          component app
        }

        views {
          view included {
            title 'Included'
            include *
          }
        }
        `,
    modelDocUri,
  )
  const excludedDoc = services.shared.workspace.LangiumDocumentFactory.fromString(
    `
        views {
          view test {
            title '!TEST!'
            include *
          }
        }
        `,
    excludedDocUri,
  )

  services.shared.workspace.LangiumDocuments.addDocument(modelDoc)
  services.shared.workspace.LangiumDocuments.addDocument(excludedDoc)

  expect(projectsManager.ownerProjectId(modelDoc)).toBe(project.id)
  expect(projectsManager.ownerProjectId(excludedDoc)).toBe(project.id)
  expect(projectsManager.isExcluded(project.id, excludedDoc)).toBe(true)
  expect(projectsManager.isExcluded(excludedDoc)).toBe(true)
  expect(projectsManager.isIncluded(project.id, excludedDoc)).toBe(false)

  const projectDocs = services.shared.workspace.LangiumDocuments.projectDocuments(project.id)
    .toArray()
    .map(doc => doc.uri.toString())

  expect(projectDocs).toContain(modelDocUri.toString())
  expect(projectDocs).not.toContain(excludedDocUri.toString())

  const { errors } = await validateAll()
  expect(errors).toEqual([])

  const model = await buildModel(project.id)
  const viewTitles = Object.values(model.views).map(view => view.title)

  expect(viewTitles).toContain('Included')
  expect(viewTitles).not.toContain('!TEST!')
  expect(model.views).not.toHaveProperty('test')
})
```

- [ ] **Step 2: Run the focused test locally on Linux**

Run:

```bash
pnpm --filter @likec4/language-server exec vitest run --no-isolate src/workspace/ProjectsManager.spec.ts -t "same-directory files"
```

Expected on Linux:

```text
Test Files  1 passed
Tests  1 skipped
```

This proves the test is syntactically loadable while explicitly waiting for Windows CI to exercise behavior.

- [ ] **Step 3: Run focused package tests locally**

Run:

```bash
pnpm --filter @likec4/language-server exec vitest run --no-isolate src/workspace/ProjectsManager.spec.ts
```

Expected:

```text
Test Files  1 passed
```

The Windows-only test is skipped on Linux; all non-Windows tests in this file should pass.

- [ ] **Step 4: Run formatting and staged diff checks**

Run:

```bash
pnpm exec dprint check packages/language-server/src/workspace/ProjectsManager.spec.ts docs/superpowers/plans/2026-07-20-windows-project-exclude-ci-proof.md docs/superpowers/specs/2026-07-20-windows-project-exclude-ci-proof-design.md
git diff --check
```

Expected:

```text
No formatting errors.
No whitespace errors.
```

- [ ] **Step 5: Commit the test**

Run:

```bash
git add packages/language-server/src/workspace/ProjectsManager.spec.ts docs/superpowers/plans/2026-07-20-windows-project-exclude-ci-proof.md
git commit -m "test(lsp): prove project excludes on Windows paths"
```

Expected: one commit containing only the test and plan file.

---

### Task 2: Publish stacked PR and collect CI proof

**Files:**

- Read: `packages/language-server/src/workspace/ProjectsManager.spec.ts`
- Read: `docs/superpowers/specs/2026-07-20-windows-project-exclude-ci-proof-design.md`
- Read: `docs/superpowers/plans/2026-07-20-windows-project-exclude-ci-proof.md`

**Interfaces:**

- Consumes: committed test from Task 1.
- Consumes: current branch `cgk/windows-project-exclude-ci-proof`.
- Consumes: base branch `cgk/fix-windows-project-excludes`.
- Produces: a temporary main-based repro branch and PR/check run with failing Windows CI evidence.
- Produces: a stacked draft PR from `cgk/windows-project-exclude-ci-proof` to `cgk/fix-windows-project-excludes`.

- [ ] **Step 1: Verify GitHub CLI access**

Run:

```bash
gh --version
gh auth status
```

Expected: `gh` is installed and authenticated for `github.com`.

- [ ] **Step 2: Push the real stacked branch**

Run:

```bash
git status --short
git push -u origin cgk/windows-project-exclude-ci-proof
```

Expected: only known unrelated scratch files are untracked; branch pushes successfully.

- [ ] **Step 3: Create the stacked draft PR**

Create `/tmp/likec4-windows-exclude-ci-proof-pr.md` with this body:

```markdown
## Summary

Follow-up to #3107.

References #2546.

Adds a Windows-only regression test for the reporter's simple project config case:

- `exclude: ["test.c4"]`
- `test.c4` in the same folder as the project config
- excluded file defines a visible view titled `!TEST!`

The test uses real Windows path input on `windows-latest` and verifies that the excluded file is not included in project documents and does not contribute the `!TEST!` view to the computed model.

## CI evidence

- Red repro on `main`: pending, temporary branch/PR will be linked after the failing Windows run is captured.
- Green fixed run on this stacked PR: pending.

## Validation

- `pnpm --filter @likec4/language-server exec vitest run --no-isolate src/workspace/ProjectsManager.spec.ts -t "same-directory files"`
- `pnpm --filter @likec4/language-server exec vitest run --no-isolate src/workspace/ProjectsManager.spec.ts`
- `pnpm exec dprint check packages/language-server/src/workspace/ProjectsManager.spec.ts docs/superpowers/plans/2026-07-20-windows-project-exclude-ci-proof.md docs/superpowers/specs/2026-07-20-windows-project-exclude-ci-proof-design.md`
- `git diff --check`
```

Run and capture the PR URL:

```bash
STACKED_PR_URL=$(gh pr create \
  --draft \
  --base cgk/fix-windows-project-excludes \
  --head cgk/windows-project-exclude-ci-proof \
  --title "test(lsp): prove project excludes on Windows paths" \
  --body-file /tmp/likec4-windows-exclude-ci-proof-pr.md)
STACKED_PR_NUMBER=${STACKED_PR_URL##*/}
printf '%s\n' "$STACKED_PR_URL"
```

Expected: GitHub creates a draft PR stacked on #3107.

- [ ] **Step 4: Create the temporary main-based repro branch**

Record the Task 1 commit SHA:

```bash
TEST_COMMIT=$(git log --format=%H --grep="test(lsp): prove project excludes on Windows paths" -n 1)
```

Create and push a temporary branch based on `origin/main`:

```bash
git fetch origin
git switch -c cgk/repro-windows-project-exclude-ci origin/main
git cherry-pick "$TEST_COMMIT"
git push -u origin cgk/repro-windows-project-exclude-ci
```

Expected: temporary branch contains the test-only commit on top of current `origin/main`.

- [ ] **Step 5: Create the temporary repro draft PR**

Create `/tmp/likec4-windows-exclude-main-repro-pr.md` with this body:

```markdown
## Summary

Temporary CI repro for #2546.

This branch intentionally adds only the Windows regression test from the stacked follow-up PR, but does not include the fix from #3107.

Expected result: `checks / ⊞ windows build` fails because `exclude: ["test.c4"]` does not exclude the same-directory file on Windows paths before #3107.

This PR is only for red CI evidence and should be closed after the evidence is linked from the stacked follow-up PR.
```

Run and capture the PR URL:

```bash
REPRO_PR_URL=$(gh pr create \
  --draft \
  --base main \
  --head cgk/repro-windows-project-exclude-ci \
  --title "test(lsp): reproduce project exclude failure on Windows" \
  --body-file /tmp/likec4-windows-exclude-main-repro-pr.md)
REPRO_PR_NUMBER=${REPRO_PR_URL##*/}
printf '%s\n' "$REPRO_PR_URL"
```

Expected: GitHub creates a temporary draft PR against `main`.

- [ ] **Step 6: Wait for CI evidence**

For each PR number captured by the previous steps, run:

```bash
gh pr checks "$REPRO_PR_NUMBER" --watch
gh pr checks "$STACKED_PR_NUMBER" --watch
```

Expected:

- Temporary main repro PR: `checks / ⊞ windows build` fails.
- Stacked PR: `checks / ⊞ windows build` passes.

If full checks are skipped because the PR is draft, inspect `gh pr view "$REPRO_PR_NUMBER" --json statusCheckRollup,isDraft` and `gh pr view "$STACKED_PR_NUMBER" --json statusCheckRollup,isDraft`, then use push-triggered checks for the branch SHA as evidence.

- [ ] **Step 7: Update the stacked PR body with red/green links**

Run:

```bash
gh pr view "$STACKED_PR_NUMBER" --json body --jq .body > /tmp/likec4-windows-exclude-ci-proof-pr-current.md
```

Edit `/tmp/likec4-windows-exclude-ci-proof-pr-current.md` so the `CI evidence` section links:

- the failing `checks / ⊞ windows build` run from the temporary main repro branch/PR;
- the passing `checks / ⊞ windows build` run from the stacked PR.

Then run:

```bash
gh pr edit "$STACKED_PR_NUMBER" --body-file /tmp/likec4-windows-exclude-ci-proof-pr-current.md
```

Expected: stacked PR body contains explicit red and green CI evidence.

- [ ] **Step 8: Return to the real branch**

Run:

```bash
git switch cgk/windows-project-exclude-ci-proof
git status --short --branch
```

Expected: current branch is `cgk/windows-project-exclude-ci-proof`; only known unrelated scratch files are untracked.
