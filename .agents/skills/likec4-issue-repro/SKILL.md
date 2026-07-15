---
name: likec4-issue-repro
description: Use when reproducing, diagnosing, or verifying a reported LikeC4 bug from a GitHub issue or user report. Trigger for tasks asking whether an issue can be reproduced, requesting a minimal repro, checking bug reports, or turning a reproduction into a focused regression test.
---

# LikeC4 Issue Reproduction

Reproduce with the smallest fixture that exercises the reported behavior, then give a direct yes/no with evidence.

## Ground rules

- Prefer live GitHub issue data from `gh issue view ISSUE --repo likec4/likec4 --comments`.
- Keep fixtures outside unrelated source changes, usually in a temp directory or a focused test fixture.
- Do not churn dependencies. If `pnpm` fails unexpectedly, check disk space before reinstalling.
- If reproduction is blocked, report the exact blocker and the next command that would prove it.

## Route the issue

Use the report symptoms to choose the likely code area:

| Symptom                                                     | Start here                                                        |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `likec4 gen`, exporters, `--outdir`, generated files        | `packages/likec4/src/cli/codegen`                                 |
| `likec4.config`, project discovery, include paths, excludes | `packages/language-server/src/workspace`                          |
| DSL parsing, validation, completions, imports               | `packages/language-server`                                        |
| computed views, predicates, relationships                   | `packages/core`                                                   |
| diagram rendering, browser behavior, embedded UI            | `packages/diagram`, `packages/likec4-spa`, `packages/vite-plugin` |

If the route is codegen or project config, also use the corresponding LikeC4 repo skill.

## Reproduction workflow

1. Capture the exact report:

```bash
gh issue view ISSUE --repo likec4/likec4 --comments
```

2. Build a minimal fixture:

- one `likec4.config.*` if project scope matters
- one `specification` block with only required kinds
- one `model` block with the smallest failing element or relationship shape
- one `views` block only if rendering or codegen needs it

3. Run the narrowest command that exercises the failure.

Examples:

```bash
pnpm --filter @likec4/language-server test -- ProjectsManager.spec.ts
pnpm --filter likec4 test -- codegen
pnpm --filter @likec4/core test -- relationship
pnpm --filter @likec4/diagram test -- path/to/spec
```

4. If reproducible, add or update a focused regression test before changing implementation.

5. Re-run the focused test, then expand only as risk requires:

```bash
pnpm --filter PACKAGE test -- SPEC_OR_PATTERN
pnpm --filter PACKAGE typecheck
pnpm exec dprint check CHANGED_FILES
git diff --check
```

## Evidence to report

Use this format:

```text
Reproduced: yes/no.
Fixture: path or short description.
Failing command: exact command and relevant failure.
Fix verification: exact command that passed.
Remaining risk: anything not covered.
```
