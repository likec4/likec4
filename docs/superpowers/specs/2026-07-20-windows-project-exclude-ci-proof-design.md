# Windows project exclude CI proof

## Context

Issue [#2546](https://github.com/likec4/likec4/issues/2546) reports that project-level
`exclude` entries in `likec4.config.json` do not exclude `.c4` files on Windows. The
current fix lives in PR #3107 and changes Language Server path matching so project and
workspace excludes are evaluated against decoded URI paths with normalized Windows drive
letters.

PR #3107 already has platform-independent regression tests using encoded Windows-drive
file URIs such as `file:///C%3A/repo/architecture/test.c4`. The missing evidence is a
real `windows-latest` CI run that exercises Windows path and URI behavior directly.

## Goal

Create a stacked follow-up PR on top of #3107 that proves two things:

1. The reporter's simple `exclude: ["test.c4"]` scenario fails against `main` on
   Windows CI when added as a regression test.
2. The same Windows regression test passes on top of #3107, showing that the fix is
   sound for real Windows runner path behavior.

## Scope

In scope:

- A test-only branch based on `cgk/fix-windows-project-excludes`.
- A Windows-only regression test in `packages/language-server`.
- A temporary repro branch based on `origin/main` with the same test only, used only to
  capture failing Windows CI evidence.
- A stacked draft PR that references issue #2546, PR #3107, the red repro CI run, and
  the green fixed CI run.

Out of scope:

- Additional production code changes, unless the Windows runner exposes a gap in #3107.
- Permanent new CI workflows.
- Changesets, because the stacked PR is test-only.
- Manual Windows desktop validation; CI is the required proof for this follow-up.

## Test design

Add a Windows-only Vitest case near the existing `ProjectsManager` project-exclude
tests. The test should use actual Windows path construction when `process.platform ===
"win32"` and should be skipped elsewhere.

The test scenario mirrors the issue comment:

- project root contains `likec4.config.json` semantics with `exclude: ["test.c4"]`;
- `test.c4` is in the same directory as the config;
- `test.c4` defines a visible view title such as `!TEST!`;
- the project should own the URI for scope purposes, but the document must be excluded
  from project documents and not contribute model/view data.

The preferred assertion stack is:

- `ProjectsManager.isExcluded(projectId, testDocUri)` is `true`;
- `ProjectsManager.isIncluded(projectId, testDocUri)` is `false`;
- `LangiumDocuments.projectDocuments(projectId)` does not contain `testDocUri`;
- if model parsing is practical in the existing fixture, computed/parsed view data does
  not include the `!TEST!` view.

If the existing fixture cannot cheaply compute the model from synthetic Windows paths,
keep the regression focused on ownership/exclusion/project-document membership. That is
still the path gate that determines whether the excluded file can feed later model
building.

## CI evidence flow

1. Create the test commit on the stacked branch and run the relevant test locally.
   On Linux, the Windows-only test will be skipped, so local validation mainly proves
   syntax/type safety.
2. Copy the same test-only commit to a temporary branch based on `origin/main`.
3. Push the temporary repro branch and open or trigger a draft PR/check run only long
   enough to capture the failing `windows-latest` CI evidence.
4. Push the stacked branch and open the follow-up draft PR against
   `cgk/fix-windows-project-excludes`.
5. Wait for `windows-latest` CI on the stacked PR and include the passing run in the PR
   description.

## PR shape

Branch: `cgk/windows-project-exclude-ci-proof`

Base: `cgk/fix-windows-project-excludes`

Title: `test(lsp): prove project excludes on Windows paths`

The PR body should be concise and include:

- "Follow-up to #3107";
- "References #2546";
- a short reproduction summary from the issue comment;
- red CI evidence from the temporary `main` repro branch;
- green CI evidence from the stacked PR;
- local validation commands.

## Risks and mitigations

- GitHub Actions may skip full CI for draft PRs depending on workflow conditions.
  Mitigation: inspect the actual check rollup and trigger the normal checks required by
  the repo before claiming proof.
- The Windows-only test may be skipped in local Linux validation. Mitigation: make the
  skip explicit via `it.runIf(process.platform === "win32")` and rely on the
  `windows-latest` job for the decisive signal.
- The temp repro PR/branch creates noise. Mitigation: name it clearly as CI evidence,
  link it in the stacked PR, then close/delete it after evidence is captured if no
  maintainer needs it preserved.
