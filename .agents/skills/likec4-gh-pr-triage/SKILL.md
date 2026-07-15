---
name: likec4-gh-pr-triage
description: Use when checking LikeC4 GitHub issues, mentions, PR status, review comments, CodeRabbit feedback, reviewer requests, or terse status follow-ups with `gh`.
---

# LikeC4 GitHub PR Triage

Use `gh` and local git as the source of truth. Browser automation is a fallback only when explicitly requested or `gh` cannot answer.

## Ground rules

- Re-check live state before reporting readiness, mergeability, reviews, or comments.
- Keep `status` replies compact: PR number, checks, review state, blocker.
- Do not post comments, mark ready, request reviewers, close issues, or merge unless the user explicitly asks.
- Preserve unrelated local files. In mixed worktrees, stage explicit paths only.

## Identify the active PR

```bash
git status -sb
git branch --show-current
gh pr view "$(git branch --show-current)" --repo likec4/likec4 \
  --json number,title,url,headRefName,baseRefName,state,isDraft,reviewDecision,mergeStateStatus,reviewRequests
```

If the current branch has no PR, ask whether to inspect a specific PR number or create one.

## Check assigned issues and mentions

Set the target login from the request or live GitHub context. Do not hard-code personal usernames.

```bash
GITHUB_LOGIN=<github-login>
REPO=likec4/likec4

gh api -X GET search/issues --paginate \
  --raw-field q="repo:${REPO} is:issue assignee:${GITHUB_LOGIN}" \
  --raw-field per_page=100
gh api -X GET search/issues --paginate \
  --raw-field q="repo:${REPO} is:issue mentions:${GITHUB_LOGIN}" \
  --raw-field per_page=100
gh api -X GET search/issues --paginate \
  --raw-field q="repo:${REPO} is:issue is:open mentions:${GITHUB_LOGIN}" \
  --raw-field per_page=100
```

Use `gh api 'notifications?...'` only for the authenticated user; notifications do not answer arbitrary-login mention searches.

For exact context:

```bash
gh issue view ISSUE --repo likec4/likec4 --comments
gh api repos/likec4/likec4/issues/ISSUE/timeline --paginate
```

Search issue bodies, comments, and timeline entries for exact mention locations.

## Check PR health

```bash
gh pr view PR --repo likec4/likec4 \
  --json number,title,url,isDraft,reviewDecision,mergeStateStatus,reviewRequests,statusCheckRollup,latestReviews
gh pr checks PR --repo likec4/likec4 --watch=false
```

`REVIEW_REQUIRED` means human review still blocks. `BLOCKED` with green checks usually means required review or branch protection.

## Check review comments

```bash
gh pr view PR --repo likec4/likec4 --comments
gh api repos/likec4/likec4/pulls/PR/comments --paginate
```

Filter by reviewer or bot only after resolving the current login from PR comments or review metadata.

If counts disagree with GitHub UI, inspect review threads with GraphQL; resolved/outdated line comments may not show in simple comment views.

## Common requested actions

- Trigger CodeRabbit only when requested by posting a PR comment such as `@coderabbitai review`.
- Mark ready only when requested and after checking branch state and validation.
- Add reviewers only when requested, for example:

```bash
gh pr edit PR --repo likec4/likec4 --add-reviewer REVIEWER_LOGIN
```

## Reporting format

For status:

```text
PR #NNNN: checks pass/fail, review state, merge state. Open blocker: ...
```

For comment triage:

```text
Open comments:
- reviewer: actionable summary, file/path if known
No action needed:
- reviewer: reason
```

For mention triage:

```text
LOGIN is mentioned in <total> issue(s); <open_count> remain open.
- #NNNN <title> — mentioned in <body/comment/timeline>; current action/blocker; URL
```
