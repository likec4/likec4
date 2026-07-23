---
name: likec4-cli-codegen-regression
description: Use when changing or reviewing LikeC4 CLI code generation, exporters, output file naming, include-path codegen behavior, or `likec4 gen` commands. Trigger for bugs around `--outdir`, generated files escaping output folders, dot/d2/mermaid/plantuml output, or external include-path views.
---

# LikeC4 CLI Codegen Regression

Protect `likec4 gen` output contracts with focused tests. The most important invariant is that multi-file generators write every emitted view under the requested output directory.

## Ground rules

- Start in `packages/likec4/src/cli/codegen`.
- Add a regression test before implementation when fixing a bug.
- Test every affected multi-file format, not only the format that exposed the issue.
- Treat external include-path views and Windows paths as first-class edge cases.

## Output-path invariants

For `likec4 gen dot`, `d2`, `mermaid` or `mmd`, and `plantuml`:

- `--outdir` or `-o` defines the containment root for all generated files.
- Source-relative view paths must never escape the output root.
- Absolute source paths, parent-relative paths, and Windows drive-root paths must not create files outside `--outdir`.
- A view coming from an external include path should still be emitted under `--outdir`.
- Define and assert the resulting output naming contract for escaped or external source paths; containment-only checks are not enough.
- Single-file generators such as model, react, or webcomponent should keep their existing `--outfile` behavior.

## Regression matrix

Cover the smallest matrix that proves the contract:

| Case                                      | Expected result                                             |
| ----------------------------------------- | ----------------------------------------------------------- |
| view in project folder                    | file under `--outdir`                                       |
| view in nested project folder             | nested file under `--outdir`                                |
| view from external include path           | file under `--outdir`, not beside the included source       |
| source path with `..` relation to project | sanitized or re-rooted under `--outdir`                     |
| Windows drive-style source path           | no drive-root escape such as `C:` output outside `--outdir` |
| absolute source path                      | no absolute-root escape outside `--outdir`                  |

Formats to consider:

- `.dot`
- `.d2`
- `.mmd`
- `.puml`

## Test shape

Use a temp workspace fixture:

```text
workspace/
  project-a/
    likec4.config.ts
    project-view.c4
  shared/
    included-view.c4
  out/
```

Configure `project-a` to include `../shared`. Run each generator with `--outdir workspace/out`.

Assert:

- expected files exist inside `workspace/out`
- escaped or external source paths use the explicitly chosen output naming contract
- no generated file exists under `project-a`, `shared`, or the temp workspace root outside `out`
- all generated paths pass an `isInside(outdir, filepath)` style check

If the real fixture cannot produce absolute or Windows drive-style `sourcePath` values, extract a small path-resolution helper and cover those cases with pure unit tests.

## Focused commands

```bash
pnpm --filter likec4 test -- codegen
pnpm --filter likec4 typecheck
pnpm exec dprint check packages/likec4/src/cli/codegen
git diff --check
```

If touching shared path utilities, also run the package tests that own those utilities.
