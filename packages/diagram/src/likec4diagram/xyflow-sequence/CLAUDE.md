# Sequence Layouter — dev workbench

This file is an intentional localized Claude Code memory. Root `AGENTS.md` remains the canonical shared repository instruction file; keep this file focused on the sequence layouter workbench.

This directory is a **development copy** of the sequence layouter from `@likec4/layouts`.
It lives here only to get Vite HMR while iterating on the layouter in the dev app.
The canonical, production implementation is `packages/layouts/src/sequence/`.

## How the two copies are used at runtime

- **Production** (`likec4 build`, exports): `GraphvizLayoter` (`packages/layouts/src/graphviz/GraphvizLayoter.ts`) calls `calcSequenceLayout(diagram)` and stores the result in `view.sequenceLayout`. The diagram package only reads it.
- **Dev**: `sequence-layout.ts` here detects `hasProp(view, 'flow')` and recomputes the layout on the fly via the local `calcSequenceLayout(view, flow)` — that's what makes HMR iteration possible.

If the copies drift, the dev preview silently differs from the production render.

## File map

Mirrored with `packages/layouts/src/sequence/` (keep in sync):

- `_types.ts`, `const.ts`, `layouter.ts`, `sequence-view.ts`, `utils.ts`, `utils.spec.ts`

Local to this directory — do **not** copy to layouts:

- `sequence-layout.ts` — `sequenceLayoutToXY()`, converts the computed layout into XYFlow nodes/edges (consumed by `../convert-to-xyflow.ts`). This is diagram-package glue, not layouter logic.
- `CLAUDE.md` (this file)

Local to the layouts side: `packages/layouts/src/sequence/index.ts` (public exports).

## Syncing rules

- Direction: iterate **here first**, then port stable changes to `packages/layouts/src/sequence/`.
- Syncing is **not a blind file copy**. The entry signature intentionally differs: here `calcSequenceLayout(view, flow)` (flow provided by the caller in `sequence-layout.ts`); in layouts `calcSequenceLayout(view)` (computes flow internally, matching the `GraphvizLayoter` call sites). Adapt the signature when porting.
- `const.ts` exports (`SeqZIndex`, `SeqParallelAreaColor`) are consumed only by the local `sequence-layout.ts`, but the file is mirrored — keep values consistent when syncing.
- Always `diff` the two directories before syncing — do not assume they are currently identical; work-in-progress changes may exist on either side.
- After porting, run tests in **both** packages (`utils.spec.ts` exists in each) and typecheck `packages/layouts`.
- Never import `@likec4/layouts` from `packages/diagram` — the duplication exists precisely to avoid that dependency.
