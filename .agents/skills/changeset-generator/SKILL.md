---
name: changeset-generator
description:
  Generates changeset files based on changes. Use when user asks to create a changeset or at the end of a feature implementation, when the user asks to wrap up or finalize changes
---

Generate changeset files based on current branch changes or staged files.

# 1. Identify Changes

## Step 1: Detect change source

Determine where to read changes from, in this priority order:

```bash
# First: check for staged changes
STAGED=$(git diff --staged --name-only)

if [ -n "$STAGED" ]; then
  echo "Using staged changes"
else
  # Second: check for branch changes vs main
  BRANCH_DIFF=$(git diff --name-only main...HEAD 2>/dev/null)

  if [ -n "$BRANCH_DIFF" ]; then
    echo "Using branch changes vs main"
  else
    # Third: check for uncommitted changes
    UNCOMMITTED=$(git diff --name-only)
    echo "Using uncommitted changes"
  fi
fi
```

Use whichever source has changes. If none have changes, tell the user and stop.

## Step 2: Gather context

For **staged changes:**

```bash
git diff --staged --name-only          # changed files
git diff --staged --stat               # change size overview
git diff --staged -- '*.ts' '*.tsx'    # actual code diff for key files
```

For **branch changes:**

```bash
git diff --name-only main...HEAD       # changed files
git log --oneline main..HEAD           # commit list
git log --format="%s%n%b" main..HEAD   # commit messages for intent
```

Read the actual diff for non-trivial files when commit messages are vague — file names alone are often insufficient for writing a good summary.

**Conventional Commits hints:**

- `feat:` / `fix:` — usually needs a changeset
- `chore:` / `test:` / `refactor:` — usually skip unless user-facing

# 2. Map Files to Packages

Group changed files by their package:

- `packages/<name>/*` → read `packages/<name>/package.json` for the package name
- `apps/<name>/*` → read `apps/<name>/package.json`
- `styled-system/<name>/*` → read `styled-system/<name>/package.json`

**Skip packages** where the only changes are:

- Test files (`*.spec.ts`, `__tests__/*`, `__snapshots__/*`)
- Generated files (anything in `.gitignore`)
- Internal packages that are never published: `@likec4/icons`, `@likec4/tsconfig`

If no packages remain after filtering, tell the user there are no user-facing changes and stop — do not create a changeset.

# 3. Generate Summary

Write from the **user's perspective** — what they can now do, what was fixed, what changed for them.

**Rules:**

- Be concise: 1–3 bullet points or a single sentence
- Focus on user-facing/public impact only
- Reference issues when relevant: `Fixes [#123](https://github.com/likec4/likec4/issues/123)`

**Do NOT mention:** test changes, internal refactors, config changes, code cleanup, dependency bumps.

# 4. Create Changeset File

**Always use `patch`** — versioning is handled manually by maintainers.

## File naming

Derive the filename from the summary — lowercase, hyphens, descriptive:

- `add-cloud-shape.md`
- `fix-diagram-zoom-reset.md`
- `element-notes-feature.md`

## File format

Create at `.changeset/<name>.md`:

```markdown
---
'<package-name>': patch
'<another-package>': patch
---

<summary>
```

## Validate before writing

Before creating the file, verify each package name exists:

```bash
# For each package in your changeset, confirm it's real
cat packages/<name>/package.json | grep '"name"'
```

If a package name doesn't match, fix it before writing the changeset.

# 5. Confirm with User

Show the user the changeset content and file path before or after writing. If something looks off, iterate.

# Examples

## Good:

```markdown
---
'@likec4/diagram': patch
---

Add reset manual layout button with tooltip guidance
```

```markdown
---
'@likec4/core': patch
'@likec4/diagram': patch
---

First iteration of element notes feature:

- Add notes property to elements
- Display visual indicator on diagrams
```

## Bad (avoid):

- "Refactored XyzService to use DI" — internal implementation detail
- "Fixed failing tests" — tests are not user-facing
- "Updated types for better inference" — internal improvement
- "Bumped dependencies" — maintenance, not a feature

# Notes

- Combine multiple packages in one changeset if they're part of the same feature
- If a branch has multiple independent features, suggest creating separate changesets for each
