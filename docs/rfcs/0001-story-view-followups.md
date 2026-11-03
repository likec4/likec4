# RFC 0001 — follow-up debt from the POC implementation

Triage of the 18 minor findings raised across 14 task reviews. None block the POC. Grouped by whether
they are worth acting on, with the reasoning kept so nobody has to re-derive it.

## Worth fixing first

**`align.spec.ts` cannot distinguish centroid alignment from a naive single-pair offset.**
The multi-element test uses a _uniform_ translation — both shared nodes move by exactly `(-100,-50)`
— so it passes identically whether `calcSceneOffset` computes a centroid or just grabs any one shared
pair's difference. `align.ts` is the only novel geometry in the POC, which already makes this the
weakest-guarded important code.

Task 13's measurements make it materially more important than when it was first raised: the
`cloud_legacy → dynamic-view-1` transition showed a shared element travelling _further_ under
`anchored` (328px) than `independent` (243px), because centroid alignment minimises mean squared
displacement across all shared elements rather than each one. That per-element behaviour is precisely
what the current test cannot see.

Fix: give one shared node a different incoming offset from the other, then assert the centroid
result — which will differ from any single pair's difference. A few lines.

**`becomes` rules are silently dropped when malformed.**
`ViewsParser.ts:731` routes them through `tryMap`, so a `becomes` rule that trips its `invariant` is
caught, logged, and dropped from the scene's array. The story renders with the correspondence missing
and no diagnostic.

This is the same class of bug as the forward-referenced-scene drop that was treated as a correctness
defect during implementation. The difference is provenance: this one is inherited codebase-wide
architecture — `parseDynamicViewRule` errors are swallowed the same way today — so fixing it means
touching `Base.ts` or `validation/`, which is a design change rather than a minor fix. Recorded here
rather than hidden.

## Cheap polish, worth batching if anything is touched

| Finding                                                                                | Location                             |
| -------------------------------------------------------------------------------------- | ------------------------------------ |
| Unnecessary `as` cast; cast-free equality chain exists at `dynamic-view.ts:65-66`      | `validation/story-view.ts:189`       |
| "not yet supported" test loop omits `'parallel'` (logic handles it; coverage gap only) | `validation/story-view.spec.ts:126`  |
| JSDoc overstates the check — it only rejects `StoryView` targets                       | `validation/story-view.ts:192`       |
| Rounding test asserts only `Number.isInteger`, never the value                         | `story/align.spec.ts:71`             |
| No explicit test for `sceneLayout: 'unified'`                                          | `story/align.spec.ts`                |
| `try`/`catch`/`finally` non-admission has no committed regression test                 | `model/__tests__/story-view.spec.ts` |
| `aiLayout()`'s story bypass has no dedicated test; only `layout()` is exercised        | `graphviz/story-view.spec.ts`        |
| No zero-scenes edge case for `firstScene()`/`lastScene()`                              | `types/view-story-flow.spec.ts`      |
| Inner-step cursor descent has no visual highlighting of the active step                | `story/` + panel                     |

## Deliberately no action

- **`storyGuards.isSubflow` matches by exclusion** (`_type !== 'alt'`). Correct today, and `StoryTry`
  is deliberately absent from `AnyStoryStatement`. Revisit only if that changes.
- **No unit tests for `storyGuards`** — matches the `stepGuards` precedent, which also has none and
  is exercised transitively.
- **`Story*` grammar rules split the `DynamicView` rule family.** Cosmetic, and caused by the plan's
  own wording.
- **`view-story-flow.ts` import order** puts a value import before type imports — matches
  `view-dynamic-flow.ts` and no lint rule enforces it.
- **`parseStoryCorrespondence` invariant messages omit scene context** — matches sibling convention
  in the same file.
- **`layout()`/`aiLayout()` lack method-level JSDoc** — pre-existing, not introduced here.
- **`node.id as string` in `resolveScene.ts:989`** — probably droppable since `NodeId` is
  `Tagged<string>`, but cosmetic.
- **`machine.spec.ts` duplicates test helpers** from `machine.state.navigating.spec.ts`. Real, but the
  fix is a shared test-util module, which was outside the task's file scope.
- **`packages/vite-plugin/src/ai/tools.ts` has an unwidened contract for story views.** Confirmed
  _not_ a compile error — an API-surface gap, genuinely optional for a POC.
- **`model-builder.ts:257` sets `hasManualLayout` from the unfiltered record** a few lines before
  `excludeStoryManualLayouts()` runs. Unreachable today: the layouter bypass means nothing ever
  writes a story manual layout. Worth knowing if `ViewManualLayoutSnapshotPerType` is ever formalised
  for story.
- **`ViewManualLayoutSnapshotPerType` has no `'story'` variant.** Correct by construction — a story
  owns no geometry, so it cannot drift. Enforced by filtering at the boundary; verified that both
  `calcDriftsFromSnapshot` and `applyManualLayout` gate on a snapshot that stories never get.

## Known limitations, by design

- `sceneLayout unified` is unimplemented.
- `navigateTo` a story **from a relation or dynamic-view step** is cut — two bare cross-reference
  alternatives are not disambiguable in Langium. Element-level `navigateTo` → story works. The
  working fix (`value=ViewRef` plus a narrowing validation pass) is recorded in RFC 0001's deferred
  table.
- Stories have no generator or export support; both are explicit RFC non-goals.
- No end-to-end Playwright coverage.
