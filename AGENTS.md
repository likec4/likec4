# Agent Guidelines for LikeC4 Repository

This document provides guidelines for AI agents working on the LikeC4 codebase.

## Repository Structure

This is a **forked repository**:
- **Upstream**: `likec4/likec4` (read-only, DO NOT modify)
- **Fork**: `Jrakru/likec4` (our working repository)
- **Main branch**: `main` (synced with upstream)
- **Feature branches**: Where all development happens

## Critical Rules

### ❌ NEVER Modify Upstream
- **DO NOT** create PRs against `likec4/likec4`
- **DO NOT** push branches to `likec4/likec4`
- **DO NOT** comment on `likec4/likec4` issues/PRs
- **DO NOT** make any changes to upstream without explicit user permission

### ✅ Always Work in Fork
- All PRs target branches in `Jrakru/likec4`
- All commits go to `Jrakru/likec4`
- All feature branches live in `Jrakru/likec4`

## Workflow

### 1. Branch Strategy
```
main (synced with upstream)
  └── feat/[feature-name] (integration branch)
        ├── copilot-review/[sub-feature-1] (PR to integration)
        └── copilot-review/[sub-feature-2] (PR to integration)
```

### 2. Creating Features
1. Create feature branch from `main`
2. Create review branches for sub-features
3. Open PRs to the feature branch (NOT main)
4. After merge, feature branch can be PR'd upstream (with permission)

### 3. PR Guidelines
- **Target**: Always feature branches in `Jrakru/likec4`
- **Size**: Max 10 files per PR (preferred)
- **Tests**: All tests must pass before PR
- **Coverage**: Aim for 90%+ test coverage

## Current Work

### Active Feature: Alternate/Parallel Paths
- **Integration branch**: `feat/alternate-parallel-full`
- **PR #2**: Core implementation (20 files)
- **PR #3**: Test suite (5 files)

### Branch Naming Convention
- Feature branches: `feat/[feature-name]`
- Review branches: `copilot-review/[feature-name]` or `copilot-review/apf-##-[name]`
- Fix branches: `fix/[issue-description]`

## Git Operations

### Syncing with Upstream
```bash
# Fetch upstream changes
git fetch upstream

# Update main
git checkout main
git merge upstream/main --ff-only
git push origin main

# Rebase feature branch
git checkout feat/[feature-name]
git rebase main
```

### Creating PRs
```bash
# Always specify the fork repository
gh pr create \
  --repo Jrakru/likec4 \
  --base [target-branch] \
  --head [source-branch] \
  --title "[Title]" \
  --body-file [description.md]
```

### NEVER Do This
```bash
# ❌ DO NOT push to upstream
git push upstream [branch]

# ❌ DO NOT create PR to upstream without permission
gh pr create --repo likec4/likec4 ...

# ❌ DO NOT comment on upstream PRs
gh pr comment [number] --repo likec4/likec4 ...
```

## Testing

### Before Any PR
```bash
# Run full test suite
npm test

# Check for type errors
npm run typecheck

# Verify all tests pass
# Expected: 1,433+ tests passing
```

### Test Coverage Goals
- Feature flags: 95%+
- Core logic: 85%+
- Parser/Grammar: 90%+
- Overall: 90%+

## Code Review

### CodeRabbit Configuration
- Configured via `.coderabbit.yaml`
- Auto-reviews enabled on feature branches
- Trigger manually: `@coderabbitai review` (in fork only)

### Manual Review Checklist
- [ ] All tests pass
- [ ] No type errors
- [ ] Test coverage adequate
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Commit messages clear

## File Organization

### Max Files Per PR
- Preferred: <10 files
- Acceptable: <20 files (if atomic/cannot be split)
- Document reason if >10 files

### Test Files
- Unit tests: `__tests__/*.spec.ts` or `*.test.ts`
- Integration tests: `__test__/*.spec.ts`
- Test coverage: Co-located with source

## Communication

### User Permission Required For
- Creating upstream PRs
- Pushing to any upstream remote
- Making comments on upstream issues/PRs
- Force-pushing to shared branches
- Deleting branches

### Safe Operations (No Permission Needed)
- Working in fork branches
- Running tests locally
- Creating PRs within fork
- Committing to feature branches (after user reviews changes)

## Emergency Rollback

If something goes wrong:

```bash
# Rollback local changes
git reset --hard origin/[branch-name]

# Force-push to fix remote (fork only!)
git push origin [branch-name] --force-with-lease
```

**NEVER** force-push to:
- `main` branch
- Upstream repository
- Shared branches (without permission)

## Resources

- **Fork**: https://github.com/Jrakru/likec4
- **Upstream**: https://github.com/likec4/likec4
- **PR #2**: https://github.com/Jrakru/likec4/pull/2
- **PR #3**: https://github.com/Jrakru/likec4/pull/3

## Summary

**Golden Rule**: When in doubt, ask the user before:
- Pushing anything
- Creating PRs
- Making comments
- Modifying upstream

**Safe Default**: All work stays in `Jrakru/likec4` until explicitly told otherwise.
