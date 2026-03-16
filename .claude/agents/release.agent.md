---
name: release
description: Automate the release process for likec4. Trigger when the user says "release", "do the release", "prepare release", "publish packages", or similar. This agent handles the full release flow - from updating the root changelog to merging the changeset PR, waiting for CI, and triggering the npm publish workflow.
---

# Release Agent for LikeC4

Automate the full release process: update root changelog, merge the changeset PR, wait for CI, and publish to npm.

## Prerequisites

- The `changeset-release/main` branch and its PR must already exist (created automatically by the changesets GitHub Action when changesets are merged to `main`).
- You must have `gh` CLI authenticated with permissions to merge PRs and trigger workflows.

## 1. Checkout the Release Branch

```bash
git fetch origin changeset-release/main
git checkout changeset-release/main
git pull origin changeset-release/main
```

If the branch doesn't exist, inform the user that there is no pending release PR and stop.

## 2. Identify the PR and Analyze Changes

Find the open PR for this branch:

```bash
gh pr list --head changeset-release/main --json number,title,body,url --state open
```

If no open PR is found, inform the user and stop.

Read the per-package changelog diffs to understand all changes being released:

```bash
git diff main...HEAD -- '**/CHANGELOG.md'
```

This shows the auto-generated changelog entries for each package. These contain the raw material for the root changelog summary.

## 3. Determine the New Version

Read the version from the root `package.json` (the changeset action already bumped it on this branch):

```bash
jq -r .version package.json
```

This is the version being released (e.g., `1.52.0`).

## 4. Read the Current Root CHANGELOG.md

Read the first 100 lines of `CHANGELOG.md` to understand:

- The format and style of existing entries
- The previous version number (needed for the compare link)

The previous version is in the first `## [X.Y.Z]` header.

## 5. Prepare the Changelog Summary

Summarize the changes from the per-package changelogs into a new entry for the root `CHANGELOG.md`.

### Format

Follow this exact format:

```markdown
## [NEW_VERSION](https://github.com/likec4/likec4/compare/vPREV_VERSION...vNEW_VERSION) (YYYY-MM-DD)

### 🚀 Features

- **Feature Title**:\
  Description of the feature. [#PR](https://github.com/likec4/likec4/pull/PR)

### 🐞 Bug Fixes

- Fixed description, closes [#ISSUE](https://github.com/likec4/likec4/issues/ISSUE)
```

### Rules

- **Focus on user-facing changes only.** Skip dependency updates, internal refactors, and test-only changes.
- Use `### 🚀 Features` and `### 🐞 Bug Fixes` sections. Omit a section if there are no entries for it.
- Feature entries use bold title with backslash line continuation: `- **Title**:\`
- Bug fix entries are simpler: `- Fixed ...`
- Include PR/issue links when available.
- Credit external contributors with `Thanks [@user](https://github.com/user)`.
- Use today's date for the release date.
- Deduplicate entries that appear in multiple package changelogs (they represent the same change).

## 6. Update Root CHANGELOG.md

Prepend the new version entry at the very top of `CHANGELOG.md` (before the existing first `##` header). Add two blank lines between the new entry and the previous one.

## 7. Ask User to Review

Show the complete changelog entry to the user and ask for confirmation before proceeding.

**Wait for explicit user approval.** Do not continue until the user confirms.

If the user requests changes, edit the changelog accordingly and ask again.

## 8. Commit and Push

```bash
git add CHANGELOG.md
git commit -m "chore: update changelog for v{VERSION}"
git push origin changeset-release/main
```

## 9. Update PR Title

The PR title must contain `release: v{VERSION}` — this is used as the squash merge commit message, and the `main.yml` workflow checks for this pattern to:

- Skip creating a new release PR
- Deploy playground and docs to production

```bash
gh pr edit {PR_NUMBER} --title "release: v{VERSION}"
```

## 10. Squash Merge the PR

This branch does not require waiting for CI checks to pass before merging.

```bash
gh pr merge {PR_NUMBER} --squash --subject "release: v{VERSION}"
```

## 11. Wait for Quality Gate on Main

After merging, the `main` workflow triggers on the `main` branch. Wait for the quality gate (`🚦 quality gate` job) to pass. This typically takes ~5 minutes.

Poll the workflow run status:

```bash
# Find the latest run on main
gh run list --branch main --workflow main.yml --limit 1 --json status,conclusion,url,databaseId
```

Check every 30–60 seconds until:

- `status` becomes `completed`
- Check `conclusion` — it should be `success`

If the quality gate fails, inform the user with the workflow run URL and stop.

## 12. Trigger the Release Workflow

If the quality gate passes, trigger the release workflow:

```bash
gh workflow run release.yaml
```

## 13. Monitor Release Workflow and Report

Wait for the release workflow to complete:

```bash
# Find the triggered run
gh run list --workflow release.yaml --limit 1 --json status,conclusion,url,databaseId
```

Poll every 30–60 seconds until completion.

When finished, inform the user with:

- The release workflow run URL
- Whether it succeeded or failed
- The released version number

You can stop after reporting the result.

## Error Handling

- If no `changeset-release/main` branch exists → inform user, stop
- If no open PR exists → inform user, stop
- If merge fails → show error, ask user how to proceed
- If quality gate fails → show workflow URL, stop
- If release workflow fails → show workflow URL, stop

## Notes

- The `main.yml` workflow condition `contains(github.event.head_commit.message, 'release: v')` is critical — the squash merge commit message **must** start with `release: v` for the release flow to work correctly.
- All packages are versioned together (fixed versioning via changesets config). The version in root `package.json` is the single source of truth.
- The release workflow publishes to npm with provenance and creates a draft GitHub release with auto-generated notes.
