# 1. Generator conventions (`@likec4/generators`)

Status: Draft
Date: 2026-07-28

## Context

`@likec4/generators` converts a LikeC4 model into other formats — Mermaid, D2, PlantUML, DrawIO,
model typings. The existing generators already share a shape, but it is only implicit in the code.
Capturing it makes new exporters (e.g. a Markdown/GitHub-page generator) consistent and reviewable,
and records the one genuine fork: how a generating CLI command handles multiple projects.

## Decisions

1. **A generator is a pure function that returns a string.** No filesystem, no project iteration.
   A view-level generator takes a `LikeC4Vdid iewModel` (`generateMermaid`, `generateD2`,
   `generatePuml`); a whole-project generator takes a `LikeC4Model` (`generateLikeC4Model`). This
   keeps them deterministic and snapshot-testable.

2. **One module per format** under `packages/generators/src/<format>/`: `generate-<format>.ts` plus
   an `index.ts` that re-exports it, and the function is re-exported from `packages/generators/src/index.ts`.

3. **Build output with `langium/generate`** (`CompositeGeneratorNode`, `joinToNode`, `toString`),
   not string concatenation — for indentation-aware, deterministic results.

4. **Test with Vitest snapshots** in a co-located `*.spec.ts`, using the shared
   `__mocks__/data` fixtures.

5. **Reuse over reimplement.** A format that embeds another (e.g. Markdown embedding Mermaid) calls
   the existing generator rather than re-deriving its output, so the embedded result stays identical.

6. **The command layer owns project iteration and I/O, not the generator.** A generating CLI command
   defaults to **all projects** (one output each) and takes `--project` to restrict — following the
   `export png` handler. The older `ensureSingleProject()` path (`gen mermaid`/`d2`/`puml`) is not
   the pattern for new commands.

## Consequences

- New exporters are a single pure function + a snapshot spec; multi-project and file writing are
  added once, in the command layer.
- Adopting decision 6 for new commands leaves two project-handling patterns in the CLI until the
  older `gen` commands are (optionally, separately) aligned.
