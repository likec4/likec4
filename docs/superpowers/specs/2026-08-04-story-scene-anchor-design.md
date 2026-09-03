# Story scene anchor — design

**Status:** approved by user, ready for implementation planning
**Supersedes:** `sceneLayout: anchored | independent | unified` (RFC 0001 §"Diagram integration", implemented in `docs/superpowers/plans/2026-08-03-story-containment-redesign.md`)

## Motivation

`sceneLayout: anchored`'s implicit centroid alignment (`packages/core/src/story/align.ts`) has a real, user-confirmed bug: it translates only `node.x`/`node.y` when applying the computed offset (`applyOffset` in `packages/core/src/story/resolveScene.ts`), leaving `edges[].points`, control points, label boxes, and `view.bounds` in the original coordinate system. In the running dev server this shows up as edges visibly detached from the nodes they connect once a non-zero offset is applied.

Beyond the bug, the *design* has a second problem: which elements happen to share an id between two scenes is discovered automatically, so the author has no way to say "keep *this* element still" when the automatic choice isn't the one that matters narratively — the whole point of a scene transition is usually one specific piece of continuity, not an aggregate of everything that happens to overlap.

This design replaces the mechanism entirely rather than patching `applyOffset` to translate more fields.

## DSL and semantics

`sceneLayout` (the story-level `anchored | independent | unified` property) is removed. In its place, a scene can declare an anchor in its own body, reusing the `ElementRef` grammar `becomes` already uses:

```
scene cloud_next {
  anchor aurora.tblUsers
  cloud.legacy.backend.services becomes cloud.next.backend, cloud.next.graphql
}
```

- `anchor <ElementRef>` means: when this specific scene *occurrence* is entered, keep `<ElementRef>`'s screen position fixed relative to whatever was on screen a moment ago.
- No `anchor` on a scene is valid and means no continuity is attempted — the transition is a plain crossfade between two potentially unrelated views. This is the direct successor of today's `independent` behavior, now the default rather than an opt-in.
- `unified` (never implemented) is dropped, not carried forward as unimplemented vocabulary.
- Anchor is declared **per scene occurrence**, not per view. Traversal is depth-first over a flattened tree (`docs/rfcs/0001-story-view.md`, "Traversal is depth-first"): the same view referenced from two different `alt` branches produces two distinct `ComputedStoryScene` entries in the flattened `scenes` list, each with its own single predecessor. Declaring `anchor` on each occurrence's body therefore already gives per-branch anchor control — no "anchor when arriving from branch X" syntax is needed.

## Validation (language-server)

Two checks, both statically determinable at validation time (alongside the existing checks in `packages/language-server/src/validation/story-view.ts`):

1. **The anchor's element must be present in this scene's own view.** Same class of check other validations in this codebase already do against a view's resolved include-set.
2. **The anchor's element must be present in the scene's immediate predecessor's view.** The predecessor is found by depth-first-flattening the story's statement tree the same way `computeStoryView` already does — this is a structural walk over the AST, independent of view computation, so it's available at validation time.
3. **A scene with no predecessor (the first scene in the flattened order) that declares `anchor` is a validation error**, not a silent no-op. An anchor that can never have an effect is very likely an author mistake, and this design's whole premise is explicit configuration over implicit fallback — so this is enforced the same way, matching "must be present in both views."

A scene with a predecessor but no `anchor` declared is not an error — see "no anchor" above.

## Runtime mechanism

The offset-and-retransform pipeline is replaced by viewport (camera) panning, entirely inside `packages/diagram`, which already owns the ReactFlow/XYFlow viewport. Nothing about a scene's own node/edge/bounds geometry is touched.

**Deleted from `packages/core`:**
- `packages/core/src/story/align.ts` (`calcSceneOffset`) — no more centroid math.
- `packages/core/src/story/resolveScene.ts` (`resolveScene`, `applyOffset`, `positionsOf`) — no more geometry retransformation.
- `StorySceneLayout` type, `LikeC4StoryModel.sceneLayout` getter, `sceneLayout` field on `ComputedStoryView`/`LayoutedStoryView`.

**Added to `packages/core`:** `ComputedStoryScene` gains `anchor?: aux.StrictFqn<A>` — plain data carried from the parsed AST through compute, no computation involved.

**New, in `packages/diagram`:** the diagram's state machine already has both endpoints of a scene-to-scene transition for free, with no external tracking needed. `story.$storyId.tsx` (SPA layout route) mounts `<LikeC4Diagram>` once per story session; only the leaf route's `$viewId` changes as scenes advance, so the same XState actor persists and its `update.view` handler sees the outgoing view in `context.view` and the incoming view in `event.view` within the same transition, before `context.view` is overwritten. When:
- the incoming view is a scene of the current `story` prop with a declared `anchor`, and
- the outgoing view was *also* a scene of the same story (i.e., this is a scene-to-scene transition within one story session, not a fresh mount or a transition in from outside the story),

the machine looks up the anchor element's rendered node position in the outgoing view (still live in the XYFlow store — nothing unmounted) and its raw position in the incoming view's own layout, and solves for the viewport `(x, y)` that puts the incoming position at the same screen pixel the outgoing position occupied, holding zoom fixed (translation only, matching `align.ts`'s original design rationale for why scale/rotation were excluded). This replaces the ordinary fit-to-bounds path (`calcViewportForBounds` in `packages/diagram/src/likec4diagram/state/utils.ts`) for this one transition; every other transition (including a scene transition where the *incoming* scene declares no anchor) uses fit-to-bounds exactly as it does today for ordinary view-to-view navigation.

**`packages/likec4-spa` gets simpler:** `StoryReact.tsx` stops calling `resolveScene` and stops tracking `previousRef` across renders entirely. It passes the scene's own, unmodified `view` and the `story` prop straight through to `<LikeC4Diagram>`. This also removes the `useEffect`-vs-render-body StrictMode handling the prior design needed, since there is no pre-transform to commit.

## Edge cases

- **Anchor node not actually found in the outgoing render at runtime** (should not happen given validation, but the mechanism must not crash if it does — e.g. the outgoing scene's view changed via HMR since it was last rendered): fall back to the ordinary fit-to-bounds path for that one transition.
- **First mount of a story session** (landing directly on a scene via a bookmarked/deep-linked URL, including the story's actual first scene): there is no outgoing view in `context.view` at all yet, so no anchor logic runs regardless of what the incoming scene declares — same fallback as above. This is the same code path as "no predecessor," not a separate case.
- **Entering or leaving a story, or moving between two different stories**: the "outgoing view was also a scene of the *same* `story` prop" check (not just "was some scene of some story") is what actually guarantees anchor continuity never crosses a story boundary — this holds regardless of whether `<LikeC4Diagram>` happens to unmount at a story boundary (it does today, since a flat view route and a story route are different parent layout components per Task 7's routing) or whether a future routing change keeps it mounted across a `$storyId` change. The mechanism does not depend on the unmount assumption; it only depends on comparing story identity on both sides of the transition.
- **Scene is a dynamic view shown in sequence mode**: sequence-mode rendering isn't XYFlow free-form node positions (lifelines/messages instead), so an anchor element's "position" doesn't mean the same thing. MVP behavior: skip the anchor pan for a sequence-mode incoming scene (same fallback path) — a known limitation, not solved by this design.

## What this design does not change

- `becomes` correspondence rules — unrelated mechanism, no coupling to `anchor`.
- The story actor/cursor situation — already resolved (deleted) by the containment redesign; nothing here reintroduces state that needs to survive across renders.
- Dynamic-view-in-story controls and story walkthrough boundary-button visibility — separate, smaller UI fixes reported from dev-server testing, tracked alongside this design's implementation plan but not part of this spec.
