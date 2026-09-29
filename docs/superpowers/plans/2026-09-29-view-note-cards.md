# View Note Cards Implementation Plan

Status: Implemented and reviewed locally; release validation pending. The task checkboxes below preserve the original implementation plan. They do not claim that every listed test or interim commit was run.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show full view-scoped notes as warm paper cards beside elements and relationship edges in regular diagrams, with clear dashed leaders and complete PNG/JPG exports.

**Architecture:** Reuse computed `notes`. A diagram-owned overlay measures cards, places them in flow coordinates after Graphviz, and reports combined bounds. Existing fit actions and export/embed hosts consume those bounds. No grammar, RPC, or saved card positions are added.

**Tech Stack:** TypeScript, React, XYFlow, XState, Panda CSS, Vitest, Playwright export.

## Global Constraints

- Work in `/home/ckeller/src/likec4-worktrees/note-callouts`; preserve the untracked `.superpowers/` visual companion.
- Follow `AGENTS.md`: imports flow upward, update core manual-layout behavior for view changes, run `pnpm generate` after checkout, and create patch changesets for user-facing packages.
- Use the existing `.c4` view `with { notes ... }` value. Do not add model notes, position syntax, Graphviz nodes, an XYFlow architecture node, RPC, or a new actor.
- Cards replace the folded control only in regular diagrams. Dynamic sequence behavior stays as it is. Fixed card width is 240 diagram units; height grows with full content.
- Full SPA/VS Code views, full-size embed, and PNG/JPG export show cards. Thumbnails remain off. `LikeC4View` and `StaticLikeC4Diagram` keep their default-off note switch and support explicit opt-in.
- The final deliverable includes a read-only `$cgk-multi-agent-review` on the implemented diff, then fixes for verified major findings.

---

## File map

- `packages/core/src/manual-layout/applyManualLayout.ts` and its spec: clear removed edge notes without changing card persistence.
- `packages/diagram/src/likec4diagram/notes/geometry.ts` and spec: pure candidate placement, anchors, leaders, and bounds union.
- `packages/diagram/src/likec4diagram/notes/NoteCard.tsx` and `NoteLayer.tsx`: theme-aware card, Markdown measurement, visible target anchors, and ready/bounds callback.
- `packages/diagram/src/likec4diagram/DiagramXYFlow.tsx`, `custom/nodes/nodes.tsx`, and `custom/nodes/toolbar/ElementToolbar.tsx`: mount note layer, remove regular folded control, remove its toolbar spacing.
- `packages/diagram/src/likec4diagram/state/machine.setup.ts`, `machine.ts`, `utils.ts`, `base/BaseXYFlow.tsx`, and `DiagramXYFlow.tsx`: keep transient combined bounds and route all full-view fit actions through them.
- `packages/diagram/src/LikeC4Diagram.props.ts`, `LikeC4Diagram.tsx`, `LikeC4View.tsx`, `StaticLikeC4Diagram.tsx`: present `{viewId,bounds,ready}` to hosts and preserve component defaults.
- `packages/likec4-spa/src/pages/EmbedPage.tsx`, `ExportPage.tsx`, `packages/likec4/src/cli/export/png/takeScreenshot.ts`: resize full-size embed and exports from measured content, and wait for a committed export-ready marker.
- `.changeset/visible-view-note-cards.md`: patch changeset describing the visible card behavior.

### Task 1: Correct saved edge-note removal

**Files:** Modify `packages/core/src/manual-layout/applyManualLayout.ts`; test `packages/core/src/manual-layout/applyManualLayout.spec.ts`.

**Interfaces:** The current computed edge's `notes` is authoritative. The resulting manual-layout edge keeps the existing `notes-changed` drift signal for presence changes.

- [ ] Write a regression beside the existing edge-note auto-apply test: put `{ txt: 'Old note' }` on the saved edge and remove `notes` on the new edge; assert `result.edges` has no note and reports `notes-changed`.
- [ ] Run `pnpm --filter @likec4/core test -- applyManualLayout.spec.ts`; expect the new assertion to fail because `next.notes ?? edge.notes` retains the old note.
- [ ] Replace the fallback with `if (next.notes == null) delete draft.notes; else draft.notes = next.notes` inside the existing changed branch. Keep the presence-drift check.
- [ ] Run the same focused test; expect pass. Commit `fix: clear removed relationship notes in manual layouts`.

### Task 2: Pure note geometry

**Files:** Create `packages/diagram/src/likec4diagram/notes/geometry.ts` and `geometry.spec.ts`.

**Interfaces:** Export `type NoteTarget = { id: string; kind: 'node' | 'edge'; anchor: {x:number;y:number}; box?: BBox; width:number; height:number }`, `type PlacedNote = { id:string; box:BBox; leader:{from:XYPosition;to:XYPosition} }`, `placeNotes(targets, obstacles): PlacedNote[]`, and `contentBounds(base, placed): BBox`.

- [ ] Write tests with fixed dimensions: an unobstructed node chooses the right-hand candidate, two close cards choose stable different candidates, and an all-overlap fixture still returns one leader per note. Add an edge-path anchor test and a bounds-union test.
- [ ] Run `pnpm --filter @likec4/diagram test -- geometry.spec.ts`; expect missing-module failure.
- [ ] Implement eight node candidates and six edge candidates at a 24-unit gap. Score the tuple `(overlapArea, nonTargetCrossings, leaderLength, candidateIndex)` and process node IDs before edge IDs. Connect the nearest card-boundary point to the supplied anchor; for a node, move the anchor to its box boundary. Use `BBox.merge` for extents.
- [ ] Run the focused test; expect pass. Commit `feat: place view note cards beside rendered targets`.

### Task 3: Render regular-diagram cards

**Files:** Create `packages/diagram/src/likec4diagram/notes/NoteCard.tsx` and `NoteLayer.tsx`; modify `DiagramXYFlow.tsx`, `custom/nodes/nodes.tsx`, and `custom/nodes/toolbar/ElementToolbar.tsx`.

**Interfaces:** `NoteLayer` receives `onContentBoundsChange?: (value: {viewId:string; bounds:BBox; ready:boolean}) => void`. It reads visible XYFlow nodes/edges and `enableNotes`, renders through `ViewportPortal`, sends `{type:'notes.bounds',bounds}` to the diagram, and reports measurement readiness. `NoteCard` renders `Markdown value={RichText.from(notes)}` at 240 flow units.

- [ ] Add a renderer test/fixture with one element note and one relationship note. Assert two cards, full text, dashed leader, and no folded-paper control. Verify `enableNotes=false` and dynamic sequence retain their current behavior.
- [ ] Run the focused diagram test; expect it to fail before the new layer is mounted.
- [ ] Build `NoteCard` with warm paper CSS, dark variant, folded corner, `nopan nodrag nowheel`, accessible target name, and image `maxWidth: '100%'`. Stop pointer/click propagation without blocking text selection or link clicks.
- [ ] Build `NoteLayer`: read current visible nodes/edges, measure card refs with `ResizeObserver`, use `document.fonts.ready` and image load/error to update sizes, derive node bounds from XYFlow absolute positions, and read relationship anchor from the existing `.likec4-edge-middle-point[data-edge-id]` marker. Render cards initially hidden, then call `placeNotes` and show them. Draw straight dashed SVG leaders with a target dot in the viewport portal. Recompute on view/note/target/measurement changes. Send null bounds when disabled or in sequence mode.
- [ ] Mount the layer inside `LikeC4DiagramXYFlow` and remove `NodeNotes` from regular element/deployment renderers, leaving `SequenceActorNode` unchanged. Remove the old toolbar offset. Run the focused test and diagram typecheck; expect pass. Commit `feat: render visible note cards in regular diagrams`.

### Task 4: Fit and public bounds callback

**Files:** Modify `packages/diagram/src/likec4diagram/state/machine.setup.ts`, `machine.ts`, `utils.ts`, `packages/diagram/src/base/BaseXYFlow.tsx`, `DiagramXYFlow.tsx`, `LikeC4Diagram.props.ts`, and `LikeC4Diagram.tsx`; test fit behavior in existing state/diagram specs.

**Interfaces:** Add transient `noteBounds: BBox | null` and event `{type:'notes.bounds';bounds:BBox|null;viewId:ViewId}` to the existing diagram machine. `viewBounds` merges `pickViewBounds(view,variant)` with `noteBounds` only for the active regular view. The component callback reports `{viewId,bounds,ready}`.

- [ ] Add a fit regression: after `notes.bounds` extends beyond `view.bounds`, a full-view fit uses the union; a stale view ID cannot change bounds; disabling notes or switching to sequence restores the architecture bound.
- [ ] Run the focused state test; expect failure before the context/event exists.
- [ ] Add the context field/event and reset it on view or variant changes. Refitting after measurement must run only when the viewport has not been moved manually. Route the toolbar and keyboard reset through `xyflow.fitDiagram` or the same combined-bounds helper instead of XYFlow's node-only `fitView`.
- [ ] Add the callback prop, pass it to `NoteLayer`, and keep the callback in diagram presentation code. Run the fit tests and typecheck; expect pass. Commit `feat: include note cards in diagram fit bounds`.

### Task 5: Size embeds and exports, then gate capture

**Files:** Modify `packages/diagram/src/LikeC4View.tsx`, `StaticLikeC4Diagram.tsx`, `packages/likec4-spa/src/pages/EmbedPage.tsx`, `ExportPage.tsx`, and `packages/likec4/src/cli/export/png/takeScreenshot.ts`; test `packages/likec4-spa/src/pages/export-layout.spec.ts` and an export browser fixture.

**Interfaces:** The host callback receives the combined bound in diagram coordinates and `ready`. `ExportPage` sets `data-likec4-export-ready="true"` only after container dimensions and transform have committed. CLI waits for that exact marker with its existing timeout.

- [ ] Add a browser export fixture with a long relationship note outside original layout bounds. Assert final PNG/JPG dimensions cover card and leader. Add an image-bearing note to assert capture waits for image settling.
- [ ] Run the export fixture; expect clipping or early capture before the changes.
- [ ] Let `StaticLikeC4Diagram` accept an explicit `enableNotes` prop, defaulting false. Set it true only in `EmbedPage`; use callback bounds for its aspect ratio and size. Keep thumbnail callers unchanged. When `LikeC4View` opts into notes, use callback bounds for `keepAspectRatio`; keep its default false.
- [ ] In `ExportPage`, use the callback bound for `computeExportPageLayout`, update its viewport translation after bounds change, remove the fixed 500 ms download timer, and set the ready marker after a committed frame when the callback says ready. In CLI `takeScreenshot`, wait for this marker before bounding-box resize and screenshot. On timeout, surface an export error.
- [ ] Run export and embed checks; expect no clipping, correct note visibility, and no marker race. Commit `feat: include note cards in embeds and PNG/JPG exports`.

### Task 6: Release validation and review council

**Files:** Create `.changeset/visible-view-note-cards.md`; update only feature files implicated by verified review findings.

**Interfaces:** Patch changeset for `@likec4/diagram` and `likec4`, describing visible notes and enlarged fit/export bounds from the user's perspective.

- [ ] Run `pnpm generate` after checkout/setup, then focused core/diagram/SPA tests, `pnpm typecheck`, and `pnpm lint`. Record exact results. Run a visual light/dark and dense-view check. Do not broaden tests once required risks are covered.
- [ ] Write the patch changeset and run `git diff --check`. Commit `docs: note visible view cards in release changeset`.
- [ ] Run `$cgk-multi-agent-review` as `diff-review` against `origin/main` using a fresh immutable packet of the completed diff. Include CodeRabbit, Claude, two Cursor slices, Pi, and parent verification; mark any unavailable slice explicitly.
- [ ] Verify every material reviewer finding against current code. Fix confirmed major issues one at a time, rerun the affected tests, and commit the fixes. Report final coverage and any remaining risks.
