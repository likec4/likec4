# macOS ARM64 CI testing

Date: 2026-10-02
Status: Design approved; written spec awaiting user review.

## Purpose

Run the existing Vitest suite on macOS ARM64 to detect platform-specific test and dependency failures.

## Runner

Use the standard GitHub-hosted `macos-26` runner. This pins macOS 26 on Apple silicon ARM64.
GitHub updates the patch version and installed tools within this major version.
Record the actual OS version and architecture in the job log with `sw_vers` and `uname -m`.
Bootstrap installs the repository's Node and pnpm versions instead of relying on preinstalled versions.

GitHub sources checked during design:

- [Runner specifications](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- [Image mapping](https://github.com/actions/runner-images)
- [macOS 26 ARM64 image](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)

## Workflow

Add a job named `macOS ARM64 tests` with job ID `check-on-macos` in `.github/workflows/checks.yaml`.
The job runs in parallel with the existing platform test jobs whenever the reusable workflow runs.
It has a 20-minute timeout, matching the initial Windows test timeout.

Steps:

1. Check out the requested revision with the existing checkout action version.
2. Log the OS version and architecture.
3. Run the existing `.github/actions/bootstrap` action.
4. Run `pnpm ci:generate`.
5. Run `pnpm ci:test` with `NODE_ENV=test`.

The job inherits the workflow's environment and default `contents: read` permission.
It needs no secrets or artifact permissions. A setup, generation, or test failure fails the job.
Do not use `continue-on-error` or add automatic retries.

## Cache isolation

Change the shared bootstrap Turbo cache prefix to
`turbo_cache_${{ runner.os }}_${{ runner.arch }}`.
This separates macOS ARM64 cache entries from Linux ARM64 cache entries.
The prefix change also causes existing platform jobs to populate new cache entries on their next run.
Keep the existing pnpm cache setup.

## Scope

Add one macOS ARM64 test job and the shared cache prefix change.
Do not add Intel coverage, build checks, browser tests, screenshot updates, release changes, or changesets.
Do not change workflow triggers or branch protection settings.
The new job reports a failing CI check when tests fail; requiring that check for merging is a separate repository setting.

## Validation

Check workflow syntax, formatting, cache expressions, and the diff locally.
Review the workflow callers to verify that they include the new job through the shared workflow.
Use a GitHub Actions run of the final implementation revision to validate checkout, bootstrap, generation, and tests on macOS.
Confirm that the runner reports macOS 26 and ARM64 and that the new job passes.
Local Linux checks alone do not prove macOS compatibility.

## Acceptance criteria

- Shared CI includes one macOS ARM64 job with the sequence and timeout above.
- Turbo cache entries are separated by OS and architecture.
- Test failures fail the macOS job.
- A GitHub run of the final implementation revision confirms that the macOS job passes.
