# Sequence layouter workbench

Canonical task guidance referenced by root AGENTS.md. Read the sections that apply to the task.

## Package-specific instructions

### packages/diagram/src/likec4diagram/xyflow-sequence

This directory is a development copy of the sequence layouter from `@likec4/layouts`. It exists only to get Vite HMR while iterating on the layouter in the dev app. The canonical production implementation is `packages/layouts/src/sequence/`.

Runtime use:

- Production (`likec4 build`, exports): `GraphvizLayoter` in `packages/layouts/src/graphviz/GraphvizLayoter.ts` calls `calcSequenceLayout(diagram)` and stores the result in `view.sequenceLayout`. The diagram package only reads it.
- Dev: `sequence-layout.ts` in this directory detects `hasProp(view, 'flow')` and recomputes layout on the fly via local `calcSequenceLayout(view, flow)`, enabling HMR iteration.

Mirrored with `packages/layouts/src/sequence/`; keep these files in sync:

- `_types.ts`
- `const.ts`
- `layouter.ts`
- `sequence-view.ts`
- `utils.ts`
- `utils.spec.ts`

Local to this directory; do not copy to layouts:

- `sequence-layout.ts`, which contains `sequenceLayoutToXY()` and converts computed layout into XYFlow nodes and edges consumed by `../convert-to-xyflow.ts`.

Local to the layouts side:

- `packages/layouts/src/sequence/index.ts`, which contains public exports.

Syncing rules:

- Iterate here first, then port stable changes to `packages/layouts/src/sequence/`.
- Syncing is not a blind file copy. The entry signature intentionally differs: here `calcSequenceLayout(view, flow)` receives flow from the caller in `sequence-layout.ts`; in layouts, `calcSequenceLayout(view)` computes flow internally to match `GraphvizLayoter` call sites.
- `const.ts` exports such as `SeqZIndex` and `SeqParallelAreaColor` are consumed only by local `sequence-layout.ts`, but the file is mirrored. Keep values consistent when syncing.
- Always diff the two directories before syncing; do not assume they are currently identical.
- After porting, run tests in both packages because `utils.spec.ts` exists in each.
- Typecheck `packages/layouts` after porting.
- Never import `@likec4/layouts` from `packages/diagram`.
