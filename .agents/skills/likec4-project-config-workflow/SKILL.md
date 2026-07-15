---
name: likec4-project-config-workflow
description: Use when changing or reviewing LikeC4 project discovery, `likec4.config` handling, include paths, excludes, workspace folders, document ownership, or `ProjectsManager` behavior. Trigger for bugs about multi-project workflows, excluded files, included external folders, default project ownership, or Windows path matching.
---

# LikeC4 Project Config Workflow

Project ownership and exclusion rules are subtle. Preserve the distinction between "which project owns this document" and "is this document included for this project".

## Ground rules

- Start in `packages/language-server/src/workspace/ProjectsManager.ts`.
- Check callers in `WorkspaceManager.ts`, `LangiumDocuments.ts`, and model parsing before changing semantics.
- Prefer focused `ProjectsManager.spec.ts` coverage before implementation.
- Keep Windows path behavior covered when touching path normalization or folder matching.

## Concepts to preserve

- A LikeC4 project is defined by config files such as `.likec4rc` or `likec4.config.*`.
- The nearest config normally determines project ownership.
- `include.paths` adds source roots for a project; paths are resolved relative to the project folder.
- Project-level `exclude` affects that project, but another project may still include the same physical file.
- Workspace-level excludes take precedence over project-level inclusion.
- Default excludes such as `node_modules` still apply where no explicit project rule overrides them.

Important distinction:

- `ownerProjectId(document)` answers ownership.
- `isExcluded(projectId, document)` answers exclusion for a specific project.
- `isExcluded(document)` answers whether the document should be skipped in the effective owner context.

## Regression matrix

Add or update tests for the relevant rows:

| Case                                                     | What to assert                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| nested projects                                          | nearest config wins                                            |
| sibling projects with similar prefixes                   | `qwe` does not own `qwe-qwe`                                   |
| include path outside project folder                      | included document participates in the including project        |
| document excluded by project A but included by project B | project-specific exclusion differs by project                  |
| shared include path                                      | deterministic owner and no duplicate document processing       |
| include path removed on reload                           | stale include ownership disappears                             |
| workspace startup scanning                               | include-path documents are loaded before project docs use them |
| workspace exclude                                        | excluded even if project config includes it                    |
| Windows paths                                            | drive and backslash paths match expected project               |

## Focused commands

```bash
pnpm --filter @likec4/language-server test -- ProjectsManager.spec.ts
pnpm --filter @likec4/language-server test -- WorkspaceManager.spec.ts
pnpm --filter @likec4/language-server typecheck
pnpm exec dprint check packages/language-server/src/workspace
git diff --check
```

If a unit test manually adds the document, also test the workspace-startup path. Manual document injection can pass while real include-path scanning still drops the file.

## PR evidence

Report:

- the reproduced project/include/exclude scenario
- the focused test name
- whether Windows path behavior was covered
- any intentionally unchanged behavior
