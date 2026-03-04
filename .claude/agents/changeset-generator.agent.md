---
name: changeset-generator
description: Generate changeset based on current branch changes or staged files
---

# Changeset Generator for LikeC4

Generate changeset files based on current branch changes or staged files.

## 1. Identify Changes

**Step 1: Check for staged changes**

```bash
git diff --staged --name-only
```

If there are staged files, use only staged changes and skip to Step 3.

**Step 2: Find commits since main branch** (if no staged changes)

```bash
# Get all changed files compared to main
git diff --name-only main...HEAD

# List commits since diverging from main
git log --oneline main..HEAD
```

**Step 3: Gather context from commit messages**

```bash
git log --format="%s%n%b" main..HEAD
```

- Use commit messages to understand intent behind changes
- Conventional Commits hints:
  - `feat:` / `fix:` - Usually needs changeset
  - `chore:` / `test:` / `refactor:` - Usually skip unless user-facing

## 2. Map Files to Packages

Group changed files by their package folder:

- `packages/<name>/*` - Read `packages/<name>/package.json`
- `apps/<name>/*` - Read `apps/<name>/package.json`
- `styled-system/<name>/*` - Read `styled-system/<name>/package.json`

**Skip packages** with only:

- Test files (`*.spec.ts`, `__tests__/*`, `__snapshots__/*`)
- Generated files (in `.gitignore`)
- Internal packages: `@likec4/icons`, `@likec4/tsconfig`

## 3. Generate Summary

For each affected package:

- Focus on **user-facing changes** only
- Write from user's perspective: what they can now do, what was fixed
- Be concise: 1-3 bullet points or a single sentence
- **DO NOT mention**: test changes, internal refactors, type-only changes, code cleanup

## 4. Create Changeset File

**Always use `patch`** - versioning is handled manually.

Create file at `.changeset/<random-readable-name>.md`:

```markdown
---
'<package-name>': patch
'<another-package>': patch
---

<summary>
```

## Examples

### Good:

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

### Bad (avoid):

- "Refactored XyzService to use DI" (internal)
- "Fixed failing tests" (tests are internal)
- "Updated types for better inference" (internal)

## Notes

- Combine multiple packages in one changeset if they're part of the same feature
- File names: lowercase with hyphens (e.g., `add-notes-feature.md`)
- Link issues when relevant: `Fixes [#123](https://github.com/likec4/likec4/issues/123)`
