# Story Containment Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pull `story` out of the `ParsedView`/`ComputedView`/`LayoutedView` unions (and the langium `LikeC4View` AST union), per RFC 0002's Candidate B recommendation, giving it a parallel `stories` registry at every model stage, a sibling top-level `stories { }` DSL block, real push-navigation routing (`/project/$projectId/story/$storyId/view/$viewId`), and full dev-mode HMR parity.

**Architecture:** `ComputedStoryView`/`LayoutedStoryView` extend `BaseViewProperties<A>` directly (like `ComputedProjectsView` already does) instead of the geometry-bearing supertypes. `LikeC4Model` gains a `_stories` map alongside `_views`, populated the same way. The DSL gets a new top-level `stories { story <id> { ... } }` block, structurally identical to how `views { }` already sits beside `model { }` in the grammar. Routing becomes real: a story is a layout route that mounts `<LikeC4Diagram>` once; a scene is a nested leaf route that swaps the `view` prop, reusing the diagram's existing `update.view` transition path — no `story.scene` event, no story-specific XState actor, no in-memory cursor. Next/Prev becomes `StoryFlow.prevAndNext(currentSceneId)` (a pure lookup) driving the diagram's *existing* `onNavigateTo` callback. This eliminates `packages/diagram/src/story/actor.ts`, `packages/core/src/story/cursor.ts`, `activeStoryCursor`, and the `story.scene` event entirely — none of that machinery is needed once the URL itself is the cursor.

**Tech Stack:** Langium (grammar), TypeScript, XState v5, TanStack Router (file-based routes), Vite (virtual modules over HMR), Vitest.

**Reference documents:** `docs/rfcs/0001-story-view.md` (original spec), `docs/rfcs/0002-story-containment-investigation.md` (the investigation this plan implements — read its §1-§6 for the full "why").

**Architecture note for whoever reviews this plan before execution begins:** RFC 0002 assumed the story actor/cursor "survive verbatim" and only flagged push-vs-replace history as an open question. Once push-based real navigation was chosen (this plan's Global Constraint below), the actor's entire reason for existing — owning cursor state an XState machine could reach without React/router access — evaporates: the route's `$viewId` param *is* the cursor. This plan deletes the actor rather than rewiring its input, which is a larger but strictly simpler change than RFC 0002 sketched. Similarly, "full RPC/HMR parity" turns out to need no new virtual module: once `stories` is a field on `LayoutedLikeC4ModelData` (Task 1), it already flows through the *existing* `likec4:model` module's `$likec4data` blob with zero plugin changes — Task 8 only polishes HMR diff granularity and adds type declarations. If either simplification looks wrong once real code is in front of you, stop and flag it rather than pushing through.

## Global Constraints

- Branch: continue directly on `story-view-implementation` (no new worktree) — this is the same branch the story-view POC was built on, and the operational constraints already established for that work still apply:
  - `origin` is upstream `likec4/likec4` — **never push there**. The fork remote is `fork` (`git@github.com:jasondamour/likec4.git`). Do not push at all unless the user explicitly asks.
  - Stage explicit paths only — never `git add -A`.
  - Do not touch `packages/icons/` or any `generated/` directory. `packages/language-server/src/generated/` is gitignored; do not commit it.
  - Do not run `pnpm generate` and then commit `packages/vscode/src/meta.ts` — it re-bumps the version every run; revert it if it changes.
  - No changesets (this is an unpublished, unreleased POC branch).
- DSL shape: `story <id> { ... }` moves from inside `views { }` to a new sibling top-level block: `stories { story <id> { ... } }`. `views { }` returns to its pre-POC 3-member shape (`view`/`dynamic view`/`deployment view`).
- Navigation: Next/Prev and `navigateTo`-into-a-scene are real router navigations that **push** browser history (TanStack Router's default — do not pass `replace: true`).
- Dev-mode parity: stories must live-reload via HMR when the underlying `.c4` file changes, matching ordinary views. Task 1 makes this structurally automatic (see architecture note above); Task 8 finishes the job.
- After any grammar change: run `pnpm generate`, then verify `packages/vscode/src/meta.ts` is unchanged (revert if not).
- After any `packages/core` type change: run `pnpm exec tsc --build` before touching downstream packages (`AGENTS.md`'s composite-project gotcha — downstream packages read `.d.ts` from `packages/core/lib/`, not source).
- After grammar keyword changes: update TextMate grammars in `packages/vscode/likec4.tmLanguage.json`, `apps/playground/likec4.tmLanguage.json`, `apps/docs/likec4.tmLanguage.json` (Task 4).
- Each task must leave `pnpm exec tsc --build` (or package-local `tsc --noEmit` where noted) clean and its package's relevant test suite green before moving to the next task — this migration's tasks are ordered so each one leaves the tree compiling, per RFC 0002's migration sketch.
- Commit after each task. Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

---

### Task 1: Core — parallel `stories` registry (types, compute, `LikeC4Model`)

**Files:**
- Modify: `packages/core/src/types/view-computed.ts` (`ComputedStoryView`, lines 188-199)
- Modify: `packages/core/src/types/view-layouted.ts` (`LayoutedStoryView`, lines 220-231)
- Modify: `packages/core/src/types/view.ts` (`ParsedView`/`ComputedView`/`LayoutedView`/`AnyView` unions, lines 24-72; `isStoryView`, lines 137-139)
- Modify: `packages/core/src/types/model-data.ts` (all three interfaces)
- Modify: `packages/core/src/compute-view/story-view/compute.ts` (`computeStoryView`, final object literal at lines 104-116)
- Modify: `packages/core/src/compute-view/compute-view.ts` (`computeParsedModelData`, lines 71-88)
- Modify: `packages/core/src/model/LikeC4Model.ts` (`_views` map area, lines 86, 267-284, 500-531)
- Create: `packages/core/src/model/story/LikeC4StoryModel.ts`
- Test: `packages/core/src/compute-view/story-view/compute.spec.ts` (extend or create)
- Test: `packages/core/src/model/LikeC4Model.spec.ts` (extend, or wherever `findView`/`views()` are already tested)

**Interfaces:**
- Produces: `AnyStoryView<A> = ParsedStoryView<A> | ComputedStoryView<A> | LayoutedStoryView<A>` (new, exported from `packages/core/src/types/view.ts` and the package barrel).
- Produces: `LikeC4Model<A>.stories(): IteratorLike<LikeC4StoryModel<A>>`, `LikeC4Model<A>.story(id): LikeC4StoryModel<A>`, `LikeC4Model<A>.findStory(id): LikeC4StoryModel<A> | null` — mirrors `views()`/`view()`/`findView()` exactly.
- Produces: `LikeC4StoryModel<A>` class with getters `id`, `title`, `description`, `tags`, `links`, `order`, `sceneLayout`, `scenes`, `storyFlow`, `$view` (the raw `AnyStoryView<A>`), `projectId`. **Not** a subclass of `LikeC4ViewModel` — no `nodes()`/`edges()`/`findNode()`/etc, because none of that is meaningful for a story (RFC 0002 §6).
- Consumes: `ComputedStoryScene<A>` (unchanged, `view-computed.ts:167-186`), `StorySceneLayout`/`AnyStoryStatement` (unchanged, `view-parsed.story.ts`).

**Step 1: Fix `ComputedStoryView`'s and `LayoutedStoryView`'s supertype**

In `packages/core/src/types/view-computed.ts`, change:
```ts
export interface ComputedStoryView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'story'
  readonly sceneLayout: StorySceneLayout
  readonly scenes: ReadonlyArray<ComputedStoryScene<A>>
  readonly storyFlow: ReadonlyArray<AnyStoryStatement<A>>
}
```
to:
```ts
export interface ComputedStoryView<A extends AnyAux = AnyAux> extends BaseViewProperties<A> {
  readonly [_type]: 'story'
  readonly [_stage]: 'computed'
  readonly sceneLayout: StorySceneLayout
  readonly scenes: ReadonlyArray<ComputedStoryScene<A>>
  readonly storyFlow: ReadonlyArray<AnyStoryStatement<A>>
}
```
Import `BaseViewProperties` and `_stage` if not already imported in this file (`_stage` is used elsewhere in the file for `BaseComputedViewProperties`, so it's already imported). Mirror the identical change in `packages/core/src/types/view-layouted.ts` for `LayoutedStoryView` (extend `BaseViewProperties<A>`, add `[_stage]: 'layouted'` directly — **do not** add `bounds`/`nodes`/`edges`/`autoLayout`/`hasLayoutDrift`/`drifts`, since none of those exist on `BaseViewProperties` and none should be fabricated).

This matches the precedent in `packages/core/src/compute-view/projects-view/_types.ts:34-48` (`ComputedProjectsView extends BaseViewProperties<any>`) exactly.

**Step 2: Remove `story` from the three view unions, add `AnyStoryView`**

In `packages/core/src/types/view.ts`:
```ts
export type ParsedView<A extends Any = Any> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  // ParsedStoryView removed — see AnyStoryView below

export type ComputedView<A extends Any = Any> =
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  // ComputedStoryView removed

export type LayoutedView<A extends Any = Any> =
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>
  // LayoutedStoryView removed

export type AnyStoryView<A extends Any = Any> =
  | ParsedStoryView<A>
  | ComputedStoryView<A>
  | LayoutedStoryView<A>
```
Update `AnyView<A>` (lines 60-72) to drop the three Story members it flattened in (it should now only flatten the 3×3 = 9 remaining view variants). `isStoryView` (lines 137-139) changes its parameter type from `AnyView<any>` to `AnyStoryView<any>` (it now only ever receives a story-shaped value; there is no longer a shared supertype where a "view" might turn out to be a story):
```ts
export function isStoryView<V extends AnyStoryView<any>>(view: V): view is V {
  return view[_type] === 'story'
}
```
Search the whole repo for call sites of `isStoryView(x)` where `x` was previously typed `AnyView`/`ComputedView`/`LayoutedView` (e.g. `packages/layouts/src/graphviz/GraphvizLayoter.ts`, `packages/language-server/src/model/model-builder.ts`) — those call sites are being deleted in Tasks 2 and 3 respectively, not fixed here; do not touch them in this task. Grep first to confirm the full list so Tasks 2/3 know what they're deleting.

**Step 3: Add `stories` to `model-data.ts`**

In `packages/core/src/types/model-data.ts`, add a `stories` field to all three stage interfaces, parallel to `views`:
```ts
export interface ParsedLikeC4ModelData<A extends AnyParsed = UnknownParsed> extends BaseLikeC4ModelData<A> {
  [_stage]: 'parsed'
  views: Record<aux.ViewId<A>, ParsedView<A>>
  stories: Record<aux.ViewId<A>, ParsedStoryView<A>>
}

export interface ComputedLikeC4ModelData<A extends AnyComputed = UnknownComputed> extends BaseLikeC4ModelData<A> {
  [_stage]: 'computed'
  views: Record<aux.ViewId<A>, ComputedView<A>>
  stories: Record<aux.ViewId<A>, ComputedStoryView<A>>
  manualLayouts?: Record<scalar.ViewId, ViewManualLayoutSnapshot>
}

export interface LayoutedLikeC4ModelData<A extends AnyLayouted = UnknownLayouted> extends BaseLikeC4ModelData<A> {
  [_stage]: 'layouted'
  views: Record<aux.ViewId<A>, LayoutedView<A>>
  stories: Record<aux.ViewId<A>, LayoutedStoryView<A>>
  manualLayouts?: Record<scalar.ViewId, ViewManualLayoutSnapshot>
}
```
Story ids reuse the `aux.ViewId<A>` scalar (same branded type views use) — stories are just tracked in a separate `Record`, not a separate id namespace. This is a **required, non-optional** field (unlike `manualLayouts`) so every producer of these interfaces must supply it, even if `{}` — this is intentional: it forces every construction site to make an explicit decision rather than silently omitting stories. Grep for every object literal that currently satisfies `ParsedLikeC4ModelData`/`ComputedLikeC4ModelData`/`LayoutedLikeC4ModelData` (test fixtures, `Builder.build()`, `LikeC4Model.create()` defaults, etc.) and add `stories: {}` (or wire the real value) at each — this will surface as `tsc` errors; fix every one found, do not suppress with `as any`.

**Step 4: Remove the fabricated geometry tail from `computeStoryView`**

In `packages/core/src/compute-view/story-view/compute.ts`, change the final return (lines 104-116):
```ts
const { sceneLayout = 'anchored', statements, docUri: _docUri, ...props } = parsed // exclude docUri

return calcViewLayoutHash({
  ...props,
  [_stage]: 'computed',
  [_type]: 'story',
  sceneLayout,
  scenes,
  storyFlow: statements,
  nodes: [],
  edges: [],
  autoLayout: { direction: 'TB' },
}) as ComputedStoryView<A>
```
to:
```ts
const { sceneLayout = 'anchored', statements, docUri: _docUri, ...props } = parsed // exclude docUri

return {
  ...props,
  [_stage]: 'computed',
  [_type]: 'story',
  sceneLayout,
  scenes,
  storyFlow: statements,
} as ComputedStoryView<A>
```
Drop the `calcViewLayoutHash({...})` wrapper too — that function computes a geometry hash (`ViewWithHash`), which `BaseViewProperties` doesn't require and a story has no geometry to hash. Confirm `calcViewLayoutHash`'s return type was the only reason `ComputedStoryView` had a `hash` field via `ViewWithHash` (inherited through the old `BaseComputedViewProperties`) — it no longer does, per Step 1.

Also in this file: the `invariant(referencedView[_type] !== 'story', ...)` guard (lines 51-62 per the research) becomes a genuine runtime-only safety net now, not dead code — a scene's `view` reference is still resolved from `likec4model.$data.views[statement.view]` at the parsed stage, and since Task 3 (language-server) removes `StoryView` from the langium `[LikeC4View]` reference type, this invariant should become unreachable *after* Task 3 lands. Leave it in place in this task (Task 1 runs before Task 3); revisit removing it as part of Task 3's own cleanup, not here.

**Step 5: Add the parallel "compute stories" loop**

In `packages/core/src/compute-view/compute-view.ts`, `computeParsedModelData` (lines 71-88):
```ts
export function computeParsedModelData<A extends AnyParsed, B extends aux.toComputed<A> = aux.toComputed<A>>(
  parsed: ParsedLikeC4ModelData<A>,
): ComputedLikeC4ModelData<B> {
  const likec4model = LikeC4Model.create(parsed)
  let {
    views: _views,
    stories: _stories,
    _stage: __omitted,
    ...rest
  } = parsed as unknown as ComputedLikeC4ModelData<B>

  const views = mapValues(_views as unknown as Record<string, ParsedView<B>>, v => unsafeComputeView(v, likec4model))
  const stories = mapValues(
    _stories as unknown as Record<string, ParsedStoryView<B>>,
    s => computeStoryView(likec4model, s),
  )

  return {
    [_stage]: 'computed',
    ...rest,
    views: views as unknown as Record<ViewId<B>, ComputedView<B>>,
    stories: stories as unknown as Record<ViewId<B>, ComputedStoryView<B>>,
  }
}
```
Check `computeStoryView`'s actual current signature in `packages/core/src/compute-view/story-view/compute.ts` before wiring this call — the research shows it takes `(likec4model, parsed)`-shaped arguments; match whatever the real signature is (it may already be exactly this, since `unsafeComputeView`'s existing dispatch already called it this way for the `views`-embedded case being removed here). Delete the `isStoryView(viewsource) → computeStoryView(...)` branch from `unsafeComputeView`'s switch (same file, lines 35-51) since a story entry can never appear in `_views` anymore (typed out in Step 2) — replace with a `nonexhaustive`-friendly exhaustive switch over the 3 remaining view kinds.

**Step 6: Add `LikeC4StoryModel` and wire it into `LikeC4Model`**

Create `packages/core/src/model/story/LikeC4StoryModel.ts`:
```ts
import type { AnyAux } from '../../types'
import type { AnyStoryView } from '../../types/view'
import type { LikeC4Model } from '../LikeC4Model'

export class LikeC4StoryModel<A extends AnyAux = AnyAux> {
  constructor(
    private readonly model: LikeC4Model<A>,
    private readonly story: AnyStoryView<A>,
  ) {}

  get id() { return this.story.id }
  get title() { return this.story.title }
  get description() { return this.story.description }
  get order() { return this.story.order }
  get tags() { return this.story.tags ?? [] }
  get links() { return this.story.links ?? [] }
  get projectId() { return this.model.projectId }
  get $view() { return this.story }

  get sceneLayout() {
    return '[_type]' in this.story && (this.story as any).sceneLayout
  }
  get scenes() {
    return (this.story as any).scenes ?? []
  }
  get storyFlow() {
    return (this.story as any).storyFlow ?? []
  }
}
```
(Adjust the `sceneLayout`/`scenes`/`storyFlow` getters once you've confirmed the exact narrowed type — `AnyStoryView<A>` is a union of Parsed/Computed/Layouted variants, and only Computed/Layouted have `scenes`/`storyFlow`/`sceneLayout`; the Parsed variant has `statements` instead per `ParsedStoryView` in `view-parsed.story.ts:89-93`. Use a type guard or an overload so `LikeC4StoryModel` built from a Computed/Layouted model has these fields safely typed, not `any` — the `any` casts above are a placeholder for you to replace with a real discriminated-union narrowing, following whatever pattern `LikeC4ViewModel` itself uses for its own Parsed-vs-Computed-vs-Layouted narrowing, e.g. `LikeC4ViewModel.ts`'s use of `$ViewModel<A>`/generic constraints.)

In `packages/core/src/model/LikeC4Model.ts`:
- Add `protected readonly _stories = new Map<aux.ViewId<A>, LikeC4StoryModel<A>>()` beside line 86.
- In the constructor, beside the `_views` population loop (lines 267-279), add a parallel loop: `for (const story of Object.values($data.stories ?? {})) { this._stories.set(story.id, new LikeC4StoryModel(this, story)) }`.
- Add `stories()`/`story()`/`findStory()` beside `views()`/`view()`/`findView()` (lines 500-531), mirroring their exact shape:
```ts
public stories(): IteratorLike<LikeC4StoryModel<A>> {
  return this._stories.values()
}

public story(storyId: aux.ViewId<A> | { id: scalar.ViewId<aux.ViewId<A>> }): LikeC4StoryModel<A> {
  const id = getId(storyId)
  return nonNullable(this._stories.get(id), `Story ${id} not found`)
}

public findStory(storyId: aux.LooseViewId<A>): LikeC4StoryModel<A> | null {
  return this._stories.get(storyId as aux.ViewId<A>) ?? null
}
```

**Step 7: Update the package barrel**

`packages/core/src/index.ts` and/or `packages/core/src/types/index.ts` (wherever `ComputedStoryView`/`isStoryView`/etc are currently re-exported) — add `AnyStoryView`, `LikeC4StoryModel`. Do not remove `calcSceneOffset` (still needed, Task 6) or the `story/cursor.ts` exports yet (`cursorAtScene`, `firstCursor`, `nextCursor`, `nextSceneCursor`, `prevCursor`, `ResolveSceneView`, `StoryCursor`) — those are deleted in Task 6, once their last consumer (the diagram actor) is gone. Deleting them now would break `packages/diagram` before Task 6 runs.

**Step 8: Build and test**

Run `pnpm exec tsc --build` from repo root (per the composite-project gotcha — downstream packages read stale `.d.ts` otherwise). Fix every compile error inside `packages/core` only — do not fix errors surfacing in `packages/language-server`, `packages/layouts`, `packages/diagram`, `packages/likec4-spa`, `packages/mcp`, or `packages/generators` in this task; those are Tasks 2-8's job and are *expected* to be red until their own task lands (this is the "known transient breakage" pattern the original story-view POC plan used — record every site you see break outside `packages/core` in your task report so the next task's implementer isn't surprised).

Run `pnpm --filter @likec4/core test` (or the repo's equivalent Vitest filter). Update/extend `compute.spec.ts` and `LikeC4Model.spec.ts` (or wherever equivalent fixtures live) so at least one test:
1. Builds a `ComputedLikeC4ModelData` with a non-empty `stories` record and asserts `LikeC4Model.create(data).findStory(id)` returns a `LikeC4StoryModel` with the right `scenes`.
2. Asserts `ComputedStoryView` no longer has `nodes`/`edges`/`autoLayout` fields (a type-level assertion is fine — e.g. `expectTypeOf<ComputedStoryView>().not.toHaveProperty('nodes')`, or simply confirm removing them didn't require any fixture to still pass a value for them).

**Step 9: Commit**

```bash
git add packages/core
git commit -m "refactor(core): pull story out of the view unions into a parallel stories registry"
```

---

### Task 2: Layouts — parallel stories layout pass

**Files:**
- Modify: `packages/layouts/src/graphviz/GraphvizLayoter.ts` (`isStoryView` bypasses, `zeroBounds`)
- Modify: `packages/layouts/src/graphviz/layout-model.ts` (`layoutLikeC4Model`)
- Test: wherever `layoutLikeC4Model`/`GraphvizLayoter` already has spec coverage (grep `*.spec.ts` in `packages/layouts/src/graphviz/`)

**Interfaces:**
- Consumes: `LikeC4Model<A>.asComputed.stories()` (Task 1), `ComputedStoryView`/`LayoutedStoryView` (Task 1, now `BaseViewProperties`-shaped, no geometry).
- Produces: `LayoutedLikeC4ModelData.stories` populated (Task 1's field).

**Step 1: Delete the `isStoryView` bypasses and `zeroBounds`**

In `packages/layouts/src/graphviz/GraphvizLayoter.ts`:
- Delete the `case isStoryView(view): throw new Error(...)` branch from `getPrinter` (lines 42-58) — a story can no longer reach `getPrinter` at all once it's routed through a separate pipeline (Step 2), so this becomes genuinely unreachable, not just defense-in-depth. Since `getPrinter`'s parameter type will no longer admit a story-shaped `view` after Task 1 (its type comes from the narrowed `ComputedView`/`LayoutedView` unions), this branch will already fail to type-check unless removed — delete it and let the switch narrow to exactly `isDynamicView | isDeploymentView | isElementView`.
- Delete `const zeroBounds: BBox = { x: 0, y: 0, width: 0, height: 0 }` (line 78) if nothing else in the file uses it after Step 2.
- Delete the `isStoryView` bypass in `layout()` (lines 153-164) and the identical one in `aiLayout()` (lines 202-213) — both become unreachable for the same reason as `getPrinter`'s branch.

**Step 2: Add the parallel stories pass**

In `packages/layouts/src/graphviz/layout-model.ts`, `layoutLikeC4Model` currently:
```ts
export async function layoutLikeC4Model<A extends Any>(
  model: LikeC4Model<A>,
  options?: ConstructorParameters<typeof QueueGraphvizLayoter>[0],
): Promise<LikeC4Model.Layouted<A>> {
  if (model.isLayouted()) {
    return Promise.resolve(model.asLayouted)
  }
  invariant(model.isComputed(), 'Model is not computed')
  const layouter = new QueueGraphvizLayoter(options)
  const styles = model.$styles
  const layoutResult = await layouter.batchLayout({
    batch: [...model.asComputed.views()].map(view => ({
      view: view.$view,
      styles,
    })),
  })
  return LikeC4Model.create({
    ...model.asLayouted.$data,
    [_stage]: 'layouted',
    views: mapToObj(layoutResult, ({ diagram }) => [diagram.id, diagram]),
  }) as any
}
```
Add a parallel, synchronous stamping pass for stories (no Graphviz call needed — a story has no geometry to lay out; "layouting" a story is just relabeling its stage):
```ts
export async function layoutLikeC4Model<A extends Any>(
  model: LikeC4Model<A>,
  options?: ConstructorParameters<typeof QueueGraphvizLayoter>[0],
): Promise<LikeC4Model.Layouted<A>> {
  if (model.isLayouted()) {
    return Promise.resolve(model.asLayouted)
  }
  invariant(model.isComputed(), 'Model is not computed')
  const layouter = new QueueGraphvizLayoter(options)
  const styles = model.$styles
  const layoutResult = await layouter.batchLayout({
    batch: [...model.asComputed.views()].map(view => ({
      view: view.$view,
      styles,
    })),
  })
  const layoutedStories = mapValues(
    model.asComputed.$data.stories,
    (story) => ({ ...story, [_stage]: 'layouted' as const }),
  )
  return LikeC4Model.create({
    ...model.asLayouted.$data,
    [_stage]: 'layouted',
    views: mapToObj(layoutResult, ({ diagram }) => [diagram.id, diagram]),
    stories: layoutedStories,
  }) as any
}
```
(Import `mapValues` from wherever the file already imports helper utilities — check existing imports at the top of `layout-model.ts`; `remeda` is used elsewhere in this codebase per `AGENTS.md`'s conventions and is likely already the source.) Verify `model.asComputed.$data.stories` is the correct accessor path once Task 1 lands (it should be, since `$data` is the raw `ComputedLikeC4ModelData` and Task 1 added `stories` to it).

**Step 3: Build and test**

`pnpm exec tsc --build`, fix errors inside `packages/layouts` only. Run `packages/layouts`' test suite; add or extend a test asserting a `ComputedLikeC4ModelData` with a non-empty `stories` record survives `layoutLikeC4Model` and comes out with `[_stage]: 'layouted'` stories, unchanged otherwise (no `bounds`/`nodes`/`edges` fabricated).

**Step 4: Commit**

```bash
git add packages/layouts
git commit -m "refactor(layouts): delete story geometry bypasses, add a parallel stories stamping pass"
```

---

### Task 3: Language-server — sibling `stories { }` block

**Files:**
- Modify: `packages/language-server/src/like-c4.langium` (entry rule ~lines 10-20, `ModelViews`/`LikeC4ViewRule`/`LikeC4View` ~lines 311-323, `Id` rule ~lines 1234-1249)
- Modify: `packages/language-server/src/ast.ts` (`ViewOps`, `LikeC4DocumentProps.c4Views`/new `c4Stories`)
- Modify: `packages/language-server/src/model/parser/ViewsParser.ts` (`parseViews`, lines 35-77)
- Modify: `packages/language-server/src/model/model-locator.ts` (`locateViewAst`, `ViewLocateResult`; new `locateStoryAst`)
- Modify: `packages/language-server/src/model/model-builder.ts` (wherever `ParsedLikeC4ModelData` is assembled from `doc.c4Views` — search for where `views:` is built in the returned object; add a `stories:` line from the new `doc.c4Stories`; delete `excludeStoryManualLayouts`, line 54-70 and its call site line 272 — deferred to Task 5, do **not** delete it here, since `manualLayouts?.views` still needs whatever safety the current code provides until Task 5's cleanup pass confirms it's dead. **Skip this deletion in this task.**)
- Modify: `packages/language-server/src/model-change/changeElementStyle.ts` (line ~71), `changeViewLayout.ts` (line ~23), `viewChange.ts` (lines ~19-58)
- Modify: 3× TextMate grammar — **deferred to Task 4**, do not touch here.
- Modify: `examples/cloud-system/story.c4` — update to the new `stories { }` syntax.
- Test: `packages/language-server/src/model/parser/model-parser.spec.ts` (or wherever `ViewsParser`/story parsing already has coverage), `packages/language-server/src/validation/story-view.spec.ts` if it exists (grep to confirm), plus whatever test currently exercises `NonStoryLikeC4View`/the `invariant` guards being deleted.

**Interfaces:**
- Consumes: `ParsedLikeC4ModelData.stories` field (Task 1).
- Produces: `doc.c4Stories: ParsedAstStoryView[]` on `ParsedLikeC4LangiumDocument`; `ModelLocator.locateStoryAst(storyId, projectId?): StoryLocateResult | null`.

**Step 1: Grammar**

In `packages/language-server/src/like-c4.langium`:

Add `stories+=ModelStories` to the entry rule (currently lines 10-20):
```
entry LikeC4Grammar:
  (
    imports+=ImportsFromPoject |
    specifications+=SpecificationRule |
    models+=Model  |
    views+=ModelViews |
    stories+=ModelStories |
    globals+=Globals |
    deployments+=ModelDeployments  |
    likec4lib+=LikeC4Lib
  )*
;
```

Add a new rule mirroring `ModelViews` (currently lines 311-323), but simpler — no `folder`, no `styles` (stories carry no view-rule styling per RFC 0001):
```
ModelStories:
  name='stories' '{' (stories+=StoryView)* '}';
```

Remove `StoryView` from the `LikeC4View` type alias and `LikeC4ViewRule`:
```
type LikeC4View = ElementView | DynamicView | DeploymentView;
LikeC4ViewRule returns LikeC4View:
  DynamicView |
  DeploymentView |
  ElementView;
```

In the `Id` rule's reserved-keyword list (currently lines 1234-1249), add `'stories'` alongside the existing `'story' | 'scene' | 'sceneLayout' | 'becomes'`:
```
  // Allow reserved keywords as Id
  'element' | 'model' | 'group' | 'node' | 'deployment' | 'instance' | 'relationship' |
  'story' | 'stories' | 'scene' | 'sceneLayout' | 'becomes';
```
(`story` was already reserved for the POC; `stories` needs the same treatment now that it's a real top-level keyword, unlike `view`/`views`, which were deliberately left unreserved. Keep `story` reserved for consistency with the POC's existing choice — do not attempt to un-reserve it in this task, that's out of scope.)

Run `pnpm generate`. Verify `packages/vscode/src/meta.ts` is unchanged (revert if `pnpm generate` touched it, per Global Constraints).

**Step 2: `ast.ts`**

`ViewOps.writeId`/`readId` (currently typed on `ast.LikeC4View`) needs to also accept `ast.StoryView`, since `parseStoryView` (in `ViewsParser.ts`) still calls `ViewOps.writeId(storyAstNode, id)` and `storyAstNode` is no longer assignable to `ast.LikeC4View`. Widen:
```ts
export const ViewOps = {
  writeId<T extends ast.LikeC4View | ast.StoryView>(node: T, id: c4.ViewId): T {
    node[idattr] = id
    return node
  },
  readId(node: ast.LikeC4View | ast.StoryView): c4.ViewId | undefined {
    return node[idattr]
  },
}
```
Add a `c4Stories?: ParsedAstStoryView[]` field to `LikeC4DocumentProps` (currently lines 258-271), alongside `c4Views`. Leave `ParsedAstStoryView`/`ParsedAstView` themselves unchanged (`ast.ts:204-224`) — `ParsedAstStoryView` is not part of `ParsedAstView` conceptually going forward (it now has its own sink), but you do not need to remove it from the `ParsedAstView` union type declaration in this task if doing so cascades into unrelated breakage — check whether anything besides `doc.c4Views`'s type still relies on `ParsedAstView` including `ParsedAstStoryView`; if `doc.c4Views: ParsedAstView[]` is changed to no longer receive story entries (Step 3), it is safe (and preferred, for exhaustiveness downstream) to also narrow `ParsedAstView` to drop `ParsedAstStoryView`, and introduce `doc.c4Stories: ParsedAstStoryView[]` as its own array with its own element type. Do this narrowing if it doesn't cascade unmanageably; if it does, leave `ParsedAstView` as today's 4-member union and just stop *pushing* story entries into `c4Views` — document which choice you made in your task report.

**Step 3: `ViewsParser.ts`**

Currently, `parseViews()` (lines 35-77) has one loop over `this.doc.parseResult.value.views` (i.e. `ModelViews[]`), dispatching `ast.isStoryView(view)` into `this.doc.c4Views`. Split this into two independent loops:
1. The existing loop, with the `case ast.isStoryView(view):` branch **removed** (it's now dead — `viewBlock.views` can never contain a `StoryView` node after Step 1's grammar change) and the switch's `nonexhaustive(view)` default kept for the remaining 3-way exhaustiveness check.
2. A new loop over `this.doc.parseResult.value.stories` (the new `ModelStories[]` field), iterating each block's `stories` array (`StoryView[]`), calling the existing `parseStoryView(view)` (unaffected by containment, per RFC 0002 §5) and pushing into `this.doc.c4Stories` (initialize this array before the loop, same pattern as `c4Views`).

The `folder`-title-prefixing logic tied to `viewBlock.folder` (inside the first loop) is `views`-block-specific — `ModelStories` has no `folder` property (Step 1 deliberately omitted it), so the second loop has no equivalent and needs none.

**Step 4: `model-locator.ts`**

Add `locateStoryAst`, mirroring `locateViewAst` (lines 187-210) but reading `doc.c4Stories` and returning a story-shaped result type:
```ts
export type StoryLocateResult = {
  doc: ParsedLikeC4LangiumDocument
  story: ParsedAstStoryView
  storyAst: ast.StoryView
}

public locateStoryAst(
  storyId: c4.ViewId,
  projectId?: c4.ProjectId | undefined,
): null | StoryLocateResult {
  const project = this.projects.ensureProjectId(projectId)
  for (const doc of this.documents(project)) {
    const story = doc.c4Stories?.find(r => r.id === storyId)
    if (!story) {
      continue
    }
    const storyAst = this.services.workspace.AstNodeLocator.getAstNode(
      doc.parseResult.value,
      story.astPath,
    )
    if (ast.isStoryView(storyAst)) {
      return { doc, story, storyAst }
    }
  }
  return null
}
```
Do **not** widen `locateViewAst`'s existing `ast.isLikeC4View(viewAst)` gate — leave it as-is. Since `doc.c4Views` never receives story entries after Step 3, `locateViewAst` will simply never be asked to find one; there is nothing to widen.

**Step 5: Delete the `NonStoryLikeC4View` / `isStoryView` guards**

In `packages/language-server/src/model-change/viewChange.ts`: `type NonStoryLikeC4View = Exclude<ast.LikeC4View, ast.StoryView>` is now a no-op alias (`ast.LikeC4View` never included `ast.StoryView` since Step 1) — replace every use of `NonStoryLikeC4View` with plain `ast.LikeC4View` and delete the type alias and its explanatory comment. Delete the `invariant(!ast.isStoryView(lookup.viewAst), ...)` in `preparePayload` (lines ~44-48) — `lookup.viewAst` is `ast.LikeC4View`-typed from `locateViewAst`, which structurally excludes `StoryView` now; the invariant can never fire and the `ast.isStoryView` import becomes unused (remove it if so).

In `packages/language-server/src/model-change/changeElementStyle.ts` (line ~71) and `changeViewLayout.ts` (line ~23): delete the `invariant(!ast.isStoryView(viewAst), ...)` lines and their explanatory comments — same reasoning, `viewAst: ast.LikeC4View` can no longer be a story.

**Step 6: `model-builder.ts` — assemble `parsed.stories`**

Find where `ParsedLikeC4ModelData` is assembled from the parsed document (search for the object literal that sets `views: ...` from `doc.c4Views`, likely in the same function/area that eventually calls `excludeStoryManualLayouts` at line 272). Add a sibling `stories: mapToObj(doc.c4Stories ?? [], s => [s.id, toParsedStoryView(s)])`-shaped line — inspect exactly how `views:` is currently built from `c4Views` (it's presumably a similar `mapToObj`/reduce converting each `ParsedAstView` into a `ParsedView`) and mirror that conversion for `ParsedAstStoryView → ParsedStoryView`. If a conversion helper already exists for views (e.g. a function that strips `astPath`/adds `[_stage]: 'parsed'`), check whether `ParsedAstStoryView`'s shape already matches `ParsedStoryView` closely enough to reuse it, or whether a small dedicated mapper is needed — `ParsedAstStoryView` (`ast.ts:204-218`) and `ParsedStoryView` (`view-parsed.story.ts:89-93`) look nearly identical already (`id`, `title`, `description`, `order`, `tags`, `links`, `sceneLayout`, and `statements`/`props+statements` — verify the exact field-name mapping before assuming a 1:1 spread works).

**Step 7: Duplicate-id validation audit**

Find whatever validation currently rejects two views sharing the same id (grep `validation/index.ts` and sibling files for something like a document-wide or workspace-wide duplicate-`ViewId` check — it may be Langium's default same-scope name-uniqueness check, or a custom LikeC4 validation). Determine: does it operate over `doc.c4Views` (and would therefore silently stop catching a `view foo`/`story foo` collision once story moves to its own array), or does it use Langium's built-in AST-scope uniqueness (which may or may not span two different top-level rule types)? If it's the former, extend it to check across `doc.c4Views` and `doc.c4Stories` together. If it's Langium's built-in scoping and it turns out `ModelViews`/`ModelStories` are different enough rule types that Langium's default scope no longer catches the collision, add an explicit validation for it (register in `validation/index.ts` similarly to how `storyViewChecks` etc. are registered at lines 204-207). Write a test: a document with `view foo { }` and, in a separate `stories { }` block, `story foo { }` — assert a validation error is now reported for the collision (or explicitly assert the decision to allow it, if you determine after investigation that allowing distinct namespaces is actually fine — state your reasoning in the task report either way, since this was flagged as unresolved by RFC 0002).

**Step 8: Update the example**

`examples/cloud-system/story.c4` currently has (from the earlier POC) a `views { story migration { ... } }`-shaped block. Move the `story migration { ... }` block out into a sibling `stories { }` block at the top level of the file, leaving `views { }` containing only its ordinary view entries.

**Step 9: Build and test**

`pnpm exec tsc --build`, fix errors inside `packages/language-server` only. Run `packages/language-server`'s test suite (`model-parser.spec.ts`, `model-builder.spec.ts`, `validation` specs, and whatever specs reference `viewChange.ts`/`changeElementStyle.ts`/`changeViewLayout.ts`). Update any fixture `.c4` strings in these specs that use the old `views { story ... }` placement to the new `stories { }` block.

**Step 10: Commit**

```bash
git add packages/language-server examples/cloud-system/story.c4
git commit -m "feat(language-server): move story to a sibling stories { } block"
```

---

### Task 4: TextMate grammar updates

**Files:**
- Modify: `packages/vscode/likec4.tmLanguage.json`
- Modify: `apps/playground/likec4.tmLanguage.json`
- Modify: `apps/docs/likec4.tmLanguage.json`

**Interfaces:** None — presentation-only, no code depends on these.

**Step 1: Add `stories` to the top-level-block keyword pattern**

In `packages/vscode/likec4.tmLanguage.json` and the identical pattern in `apps/playground/likec4.tmLanguage.json`, find the top-level-block pattern (currently `"match": "\\b(specification|model|views)\\b"`) and add `stories`:
```json
{ "match": "\\b(specification|model|views|stories)\\b" }
```

**Step 2: Add story keywords to the general keyword pattern**

In the same two files' catch-all keyword pattern (the long `\b(alt|and|as|...)\b` alternation), add `story`, `stories`, `scene`, `sceneLayout`, `becomes` in alphabetical position, matching the file's existing alphabetical convention. Note `alt` is already present (reused from dynamic views).

In `apps/docs/likec4.tmLanguage.json`, which uses a single combined keyword pattern instead of a separate top-level-block pattern, add the same six keywords (`stories`, `story`, `scene`, `sceneLayout`, `becomes`, and confirm `alt` is present — it already is) to its one alternation, in alphabetical position.

**Step 3: Verify and commit**

Confirm each file is still valid JSON (`pnpm exec node -e "JSON.parse(require('fs').readFileSync('packages/vscode/likec4.tmLanguage.json'))"` or equivalent for each file). No automated test covers TextMate grammars in this repo; this is a manual-inspection-only step. If there's a way to open a `.c4` file with a story block in VSCode/the playground to visually confirm highlighting, do so — otherwise note in your report that this was verified by inspection only.

```bash
git add packages/vscode/likec4.tmLanguage.json apps/playground/likec4.tmLanguage.json apps/docs/likec4.tmLanguage.json
git commit -m "chore(vscode): highlight story/stories/scene/sceneLayout/becomes keywords"
```

---

### Task 5: Delete dead defensive code (MCP, generators, aichat, manual-layout filter)

**Files:**
- Modify: `packages/mcp/src/tools/_common.ts` (lines 111, 260-269)
- Modify: `packages/mcp/src/tools/read-project-summary.ts` (line 154)
- Modify: `packages/mcp/src/tools/read-view.ts` (line 123)
- Modify: `packages/generators/src/likec4/operators/views.ts` (lines 487-518, the `storyView`/`anyView` functions)
- Modify: `packages/likec4-spa/src/aichat/useChat.tsx` (lines 72-77)
- Modify: `packages/language-server/src/model/model-builder.ts` (`excludeStoryManualLayouts`, lines 54-70, and its call site line 272)
- Test: whichever spec files cover each of the above (grep for `'story'` across each package's `*.spec.ts`)

**Interfaces:** None new — this task only removes code made dead by Tasks 1-3.

**Step 1: MCP enum widening → revert**

In `packages/mcp/src/tools/_common.ts` line 111 and line 260 (`includedInViewsSchema`), and `read-project-summary.ts` line 154, and `read-view.ts` line 123: change `z.enum(['element', 'deployment', 'dynamic', 'story'])` back to `z.enum(['element', 'deployment', 'dynamic'])`. Confirm no MCP tool actually branches on `'story'` (the research found none — these were pure enum widenings with no story-specific logic) before reverting; if you find one, stop and report it rather than silently deleting behavior.

**Step 2: Generator stub → revert to exhaustive 3-way switch**

In `packages/generators/src/likec4/operators/views.ts`: delete the `storyView` operator function (lines ~487-500, the one that throws `"Story views are not supported by this generator"`). In `anyView` (the dispatcher, ~lines 502-518), delete the `if (ctx._type === 'story') { return exec(ctx, storyView()) }` branch, restoring the pre-POC 3-way `element`/`deployment`/`dynamic` exhaustive dispatch (with `nonexhaustive(ctx)` as the final fallback, unchanged). This is now correct rather than a stub: `ctx` here is typed from `ComputedView`/whatever the generator's own view union is, and after Task 1 that union no longer includes `story` — so the `'story'` branch is unreachable code, not merely undesired.

**Step 3: Aichat guard → delete**

In `packages/likec4-spa/src/aichat/useChat.tsx` lines 72-77: delete the `if (view._type === 'story') { throw new Error(...) }` block. Confirm `view` at that point is typed from `LayoutedView`/`ComputedView` (whatever `useChat.tsx`'s "current view" type is) — after Task 1, that type structurally excludes `'story'`, so the guard is unreachable and the `throw` line can be deleted along with its explanatory comment.

**Step 4: Manual-layout filter → delete**

In `packages/language-server/src/model/model-builder.ts`: delete the `excludeStoryManualLayouts` function (lines 54-70) and change its call site (line 272) from `manualLayouts: excludeStoryManualLayouts(manualLayouts?.views)` to `manualLayouts: manualLayouts?.views`. This is safe once you've confirmed (from Task 3's work) that `manualLayouts?.views` — which is keyed off `LayoutedView`, the same union Task 1 narrowed — can structurally never contain a story entry anymore. If any doubt remains, add a one-line comment stating why this is now safe rather than defensively re-adding the filter.

**Step 5: Build and test**

`pnpm exec tsc --build`. Run each touched package's test suite (`packages/mcp`, `packages/generators`, `packages/likec4-spa`, `packages/language-server`). Update/delete any test that specifically asserted the old defensive behavior (e.g. a test asserting the generator throws for a story view, or that MCP's schema includes `'story'`) — these assertions are now testing removed behavior and should be deleted, not left red.

**Step 6: Commit**

```bash
git add packages/mcp packages/generators packages/likec4-spa/src/aichat packages/language-server/src/model/model-builder.ts
git commit -m "refactor: delete dead story-defensive code made unreachable by the containment redesign"
```

---

### Task 6: Diagram + Core — delete the story actor/cursor, add a `story` prop

**Files:**
- Delete: `packages/diagram/src/story/actor.ts`, `packages/diagram/src/story/actor.spec.ts`
- Delete: `packages/diagram/src/story/resolveSceneView.ts`, `packages/diagram/src/story/resolveSceneView.spec.ts`
- Delete: `packages/core/src/story/cursor.ts`, `packages/core/src/story/cursor.spec.ts`
- Move: `packages/diagram/src/story/resolveScene.ts`'s pure functions (`positionsOf`, `applyOffset`, and a simplified `resolveScene`) into `packages/core/src/story/resolveScene.ts` — delete `resolveCurrentScene` (cursor-based, no longer needed) rather than moving it. Delete the diagram-side file and its spec after moving; create the core-side file and a matching spec.
- Modify: `packages/core/src/index.ts` — remove `cursorAtScene`/`firstCursor`/`nextCursor`/`nextSceneCursor`/`prevCursor`/`ResolveSceneView`/`StoryCursor` exports (Task 1 deferred this deletion to here); add the moved `resolveScene`/`positionsOf`/`applyOffset` exports.
- Modify: `packages/diagram/src/likec4diagram/state/machine.ts` (delete root `entry:` story-actor spawn, lines 49-74; delete `story.scene` handler, lines 114-133)
- Modify: `packages/diagram/src/likec4diagram/state/machine.setup.ts` (delete `resolve` from `Input`/`Context`, lines 87-101, 112, 183; delete `activeStoryCursor`, lines 166-172, 212; delete `story.scene` from `Events`, lines 253-269; add `story: AnyStoryView<A> | null` to `Input`/`Context` instead)
- Modify: `packages/diagram/src/likec4diagram/state/machine.state.navigating.ts` (delete `syncStoryActor`, lines 20-76; the `context.view._type === 'story'` workaround it existed to avoid no longer applies once `context.view` can never be story-shaped)
- Modify: `packages/diagram/src/likec4diagram/state/DiagramActorProvider.tsx` (delete `useOptionalResolveSceneView()` usage and `input.resolve`, lines 58-64, 87; delete `StoryCursorSync`, lines 207-296; thread a new `story` prop into `input.story` instead — see `LikeC4Diagram.props.ts` below)
- Modify: `packages/diagram/src/likec4diagram/state/diagram-api.ts` (delete the `findSceneForView`/`storyActorRef` interception in `navigateTo`, lines 96-124 — restore it to a plain `this.send({ type: 'navigate.to', ... })` call with no story branch; see Task 7 for where this logic re-appears, in the SPA)
- Modify: `packages/diagram/src/LikeC4Diagram.props.ts` — add `story?: AnyStoryView<A> | null` prop, imported type-only from `@likec4/core/types`
- Modify: `packages/diagram/src/index.ts` — export the `story` prop type if not already covered by the existing props export
- Modify: `packages/diagram/src/navigationpanel/walkthrough/StoryControls.tsx` — re-derive current scene/prev/next from `context.story` + `context.view.id` (a plain lookup) instead of `storyActor.send(...)`; call the diagram's existing `onNavigateTo`-emitting path (send `{ type: 'navigate.to', viewId: targetSceneViewId }`, the same event `diagram-api.ts`'s plain `navigateTo` now sends) for Next/Prev instead of an actor `send`
- Modify: `packages/diagram/src/navigationpanel/NavigationPanelControls.tsx` (`isStoryView` derivation, currently from `context.activeStoryCursor !== null`, lines ~39-47) — change to `context.story != null`
- Test: `packages/diagram/src/navigationpanel/walkthrough/*.spec.ts` if present; `packages/diagram/src/likec4diagram/state/*.spec.ts` covering `machine.ts`/`machine.setup.ts`; `packages/core/src/story/resolveScene.spec.ts` (moved/rewritten)

**Interfaces:**
- Consumes: `LikeC4Model<A>.findStory(id)` (Task 1), `AnyStoryView<A>` (Task 1).
- Produces: `LikeC4DiagramProps.story?: AnyStoryView<A> | null` — the new addressable input a consumer (the SPA, Task 7) supplies alongside `view`, mirroring how `view` itself is supplied. `context.story` on the diagram machine (replaces `context.activeStoryCursor`).
- Consumes (moved): `packages/core/src/story/resolveScene.ts`'s `resolveScene(model, scene, previous, sceneLayout): DiagramView` — a pure function taking the model, the target scene's `ComputedStoryScene`, the previously-shown `DiagramView | null`, and the story's `sceneLayout`, returning an offset-applied `DiagramView` ready to hand to `<LikeC4Diagram view={...}>`. (Confirm the exact current signature of `resolveScene`/`positionsOf`/`applyOffset` in the diagram-side file before moving — preserve behavior exactly, only relocate.)

**Step 1: Move `resolveScene.ts`'s pure functions into core**

Read `packages/diagram/src/story/resolveScene.ts` in full. It should export `positionsOf`, `applyOffset`, `resolveScene` (pure, model + geometry) and `resolveCurrentScene` (cursor-based wrapper). Create `packages/core/src/story/resolveScene.ts` containing `positionsOf`, `applyOffset`, and `resolveScene` verbatim (adjust imports to core-relative paths — it likely already imports `calcSceneOffset` from `./align`, which is already in `packages/core/src/story/`, so this move should reduce cross-package import distance, not increase it). Do **not** move `resolveCurrentScene` — it took a `StoryCursor` as input, which is being deleted; its only job (resolve "the scene the cursor currently points to") is superseded by Task 7's routing-driven approach (the SPA already knows which scene it's on, from the URL — it doesn't need to ask a cursor). Delete `packages/diagram/src/story/resolveScene.ts` and `resolveScene.spec.ts` after porting their non-cursor tests to a new `packages/core/src/story/resolveScene.spec.ts`.

Export `resolveScene` (and `positionsOf`/`applyOffset` if anything outside this file needs them — check call sites first) from `packages/core/src/index.ts`.

**Step 2: Delete `resolveSceneView.ts` and `cursor.ts`**

Delete `packages/diagram/src/story/resolveSceneView.ts` and its spec — its only consumer was `DiagramActorProvider.tsx`'s `input.resolve` wiring for the actor (Step 5), which no longer exists. Delete `packages/core/src/story/cursor.ts` and its spec — confirm zero remaining references first (`grep -rn "firstCursor\|nextCursor\|cursorAtScene\|nextSceneCursor\|prevCursor\|StoryCursor\b" packages/` after Steps 3-6 below are done; if anything still references these, finish deleting that consumer first). Remove the corresponding barrel exports from `packages/core/src/index.ts` (Task 1 left these in place deliberately for this task to remove).

Delete `packages/diagram/src/story/actor.ts` and `actor.spec.ts` in full, including the `findSceneForView` export (its replacement lives in the SPA per Task 7, built directly from `StoryFlow`/`story.scenes`, not from this file).

**Step 3: Add the `story` prop**

In `packages/diagram/src/LikeC4Diagram.props.ts`, add (near wherever `view` itself is declared as a prop):
```ts
/**
 * The story this view is currently a scene of, if any. `null`/`undefined` when
 * the view is being shown standalone. Supplied by the consumer (the routing
 * layer) — `packages/diagram` has no way to look this up itself.
 */
story?: AnyStoryView<A> | null
```
Import `AnyStoryView` type-only from `@likec4/core/types`. Thread it through to `DiagramActorProvider` (wherever `view` is threaded today — likely `LikeC4Diagram.tsx` passing props down) and into `machine.setup.ts`'s `Input`/`Context` as `story: AnyStoryView<A> | null` (default `null`), replacing the deleted `resolve`/`activeStoryCursor` fields. Add an `update.inputs`-style handling if `story` can change after mount without a full remount (mirror however `view` itself is updated — likely its own `update.view`-adjacent path, or folded into the existing `update.view` event's payload if that's simpler; check how `zoomable`/`pannable`/etc, the other props threaded via `update.inputs` in `DiagramActorProvider.tsx` lines 104-111, are handled, and follow that pattern for `story` too).

**Step 4: Delete the actor spawn and `story.scene` machinery**

In `machine.ts`: delete the root `entry:` block (lines 49-74) that spawns the `'story'` child actor from `context.view`. In `machine.state.navigating.ts`: delete `syncStoryActor` (lines 20-76) entirely — there is no child actor to spawn/stop anymore, and the `context.view._type === 'story'` staleness problem it worked around cannot recur (`context.view` is now always an ordinary view, by construction, since a story is never assigned to it — Task 1 ensures `story` can never appear in `ComputedView`/`LayoutedView`). In `machine.setup.ts`: delete the `story.scene` event from `Events` (lines 253-269) and its handler in `machine.ts` (lines 114-133); delete `activeStoryCursor` from `Context` (lines 166-172, 212).

**Step 5: Simplify `DiagramActorProvider.tsx`**

Delete `useOptionalResolveSceneView()` and its use in `input.resolve` (lines 58-64, 87). Delete the entire `StoryCursorSync` component (lines 207-296) and its rendering in the provider's JSX (line 130). Add `story` to the `input` object passed to `useActorRef` (alongside `view`, per Step 3).

**Step 6: Simplify `diagram-api.ts`'s `navigateTo`**

Restore `navigateTo` (lines 96-124) to:
```ts
navigateTo(viewId: ViewId<A>, fromNode?: NodeId, focusOnElement?: Fqn<A>): void {
  this.send({
    type: 'navigate.to',
    viewId: viewId as any,
    ...(fromNode && { fromNode }),
    ...(focusOnElement && { focusOnElement: focusOnElement as any }),
  })
}
```
Delete the `findSceneForView`/`storyActorRef`/`typedSystem(...)` lookup entirely — there is no story actor to look up, and the "should this redirect within the story" decision moves to the SPA (Task 7), which is the only layer with both router access and story-scene knowledge.

**Step 7: Rewire `StoryControls.tsx`**

Read the current file in full. Replace its `storyActor?.send({ type: 'prev' | 'next' })` calls with: derive `currentSceneIndex` from `context.story.scenes.findIndex(s => s.view === context.view.id)`, compute `prevScene = context.story.scenes[currentSceneIndex - 1]` / `nextScene = context.story.scenes[currentSceneIndex + 1]` (bounds-checked), and on click, call `diagram.navigateTo(prevScene.view)` / `diagram.navigateTo(nextScene.view)` — reusing the exact same `DiagramApi.navigateTo` method Step 6 simplified, which already emits the `navigateTo` event that `PropagateDiagramActorEvents` forwards to the consumer's `onNavigateTo` callback (`DiagramActorProvider.tsx` lines 181-205, unchanged by this task). This is the mechanism that lets the SPA (Task 7) turn Next/Prev into a real, pushed route change with zero new plumbing inside `packages/diagram`.

Keep whatever scene-title/notes rendering already exists in this file, just re-sourcing the data from `context.story` (a plain prop-derived value) instead of the deleted actor's snapshot.

**Step 8: Fix `NavigationPanelControls.tsx`'s `isStoryView`**

Change the `isStoryView` derivation (currently `context.activeStoryCursor !== null`, ~lines 39-47) to `context.story != null`.

**Step 9: Build and test**

`pnpm exec tsc --build`, fix errors inside `packages/core` and `packages/diagram` only (this task spans both). Run `pnpm --filter @likec4/core test` and `pnpm --filter @likec4/diagram test`. Rewrite `actor.spec.ts`'s test intent (advancing a story scene-by-scene, boundary behavior at first/last scene) as tests against the new plain derivation logic in `StoryControls.tsx` (or extract that derivation into a small pure helper function you can unit-test directly, e.g. `packages/diagram/src/navigationpanel/walkthrough/storyScenePosition.ts` exporting `currentSceneIndex(story, currentViewId)`/`prevScene(...)`/`nextScene(...)` — this is more testable than testing through the React component, and mirrors how `resolveScene` itself is a pure, directly-testable function).

**Step 10: Commit**

```bash
git add packages/core packages/diagram
git commit -m "refactor(diagram): delete the story actor/cursor — the route is now the cursor"
```

---

### Task 7: SPA — story routes, hooks, and nested-vs-flat navigation

**Files:**
- Create: `packages/likec4-spa/src/routes/project.$projectId/story.$storyId.tsx` (layout route)
- Create: `packages/likec4-spa/src/routes/project.$projectId/story.$storyId.view.$viewId.tsx` (leaf route)
- Create: `packages/likec4-spa/src/pages/StoryReact.tsx`
- Modify: `packages/likec4-spa/src/hooks.ts` — add `useCurrentStoryId()`, `useCurrentStory()`
- Modify: `packages/likec4-spa/src/pages/ViewReact.tsx` — no change expected (verify `<NotFound/>` still fires correctly for a story id visited at the old flat `/view/$viewId` route — this should already work with zero code changes, per RFC 0002 §4; write a test confirming it rather than assuming)
- Test: whatever the SPA's existing route/page test coverage looks like (grep for `*.spec.ts`/`*.spec.tsx` under `packages/likec4-spa/src/routes/` and `src/pages/` — if none exist for `view.$viewId`/`ViewReact.tsx` either, match that precedent and rely on the manual dev-server smoke check in Task 9 instead of inventing new test infrastructure)

**Interfaces:**
- Consumes: `LikeC4Model.findStory(id)` (Task 1), `LikeC4Diagram`'s new `story`/`view` props (Task 6), `resolveScene` (moved to `@likec4/core`, Task 6).
- Produces: `useCurrentStoryId(): ViewId` (mirrors `useCurrentViewId`), `useCurrentStory(): LikeC4StoryModel | null`.

**Step 1: `story.$storyId.tsx` — the layout route**

Mirror `view.$viewId.tsx` (`<Outlet/>` + `<Header/>`) but add a `beforeLoad` redirect to the first scene when no `$viewId` is given yet, mirroring `projects.tsx`'s `beforeLoad`-throws-`redirect` pattern (lines 15-21):
```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/project/$projectId/story/$storyId')({
  component: StoryLayout,
  errorComponent: ErrorComponent,
})

function StoryLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
```
The redirect-to-first-scene behavior belongs on the *index* of this route (visiting `/story/$storyId` with no `view` segment), not this layout — TanStack Router's file-based routing needs a `story.$storyId.index.tsx` for that redirect (mirroring how `view.$viewId.index.tsx` is the leaf that actually renders content, while `view.$viewId.tsx` is pure layout). Create `story.$storyId.index.tsx`:
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'

export const Route = createFileRoute('/project/$projectId/story/$storyId/')({
  beforeLoad: async ({ params }) => {
    const likec4model = await loadModel(params.projectId as any)
    const model = likec4model.$likec4model.get()
    const story = model.findStory(params.storyId as any)
    const firstScene = story?.scenes[0]
    if (!firstScene) {
      throw notFound()
    }
    throw redirect({
      to: '/project/$projectId/story/$storyId/view/$viewId',
      params: { ...params, viewId: firstScene.view },
    })
  },
})
```
(Verify the exact `loadModel`/`$likec4model` access pattern against `route.tsx`'s existing loader, Step-for-step — this may need to reuse the already-loaded model from the parent route's context instead of calling `loadModel` again; check whether `beforeLoad`/`loader` context composition in this router setup lets a child route read the parent's already-resolved `$likec4model` via `context` rather than re-fetching. Prefer reusing context if available — do not double-load the model if there's already a documented way to inherit it.)

**Step 2: `story.$storyId.view.$viewId.tsx` — the scene leaf**

This is the page that actually mounts `<LikeC4Diagram>`. It needs to:
1. Resolve the current scene's view via `useCurrentView()` (unchanged — a scene target is always an ordinary view id, so this hook needs no changes, per RFC 0002 §4).
2. Resolve the current story via a new `useCurrentStory()` hook (Step 4).
3. Apply the scene-offset alignment (`resolveScene` from `@likec4/core`, Task 6) using the *previous* scene's already-rendered view as the alignment target — this requires tracking "the previously shown scene's view" across navigations, which `StoryCursorSync` used to do with a `useRef`. Do the same here, but keyed off route changes instead of actor cursor changes: a `useRef<DiagramView | null>(null)` that updates after each render, reset to `null` when `storyId` changes (a fresh story session has nothing to align against).
4. Pass `story={story.$view}` and `view={offsetView}` to `<LikeC4Diagram>`, and an `onNavigateTo` handler that decides nested-vs-flat (Step 3).

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { isRpcAvailable } from 'likec4:rpc'
import { StoryEditor } from '../../pages/StoryEditor' // if a dev/editor variant is needed — check whether stories support in-editor mutation at all (Task 1/RFC 0001 say no: "a story owns no geometry and no view rules"); if there is nothing to edit, StoryReact may be the only variant needed for both dev and prod, unlike ViewReact/ViewEditor's split
import { StoryReact } from '../../pages/StoryReact'

export const Route = createFileRoute('/project/$projectId/story/$storyId/view/$viewId')({
  component: StoryReact,
})
```
(Confirm during implementation whether a story ever needs an "editor" variant distinct from `StoryReact` — per Task 1/RFC 0001, stories have no geometry and no view rules to edit, so `changeElementStyle`/`changeViewLayout` are invariant-guarded against them (Task 3 deleted the invariants because they're now *structurally* impossible, not because editing became supported) — there is likely no `StoryEditor` needed at all; if so, use `StoryReact` unconditionally for this route's `component` and delete the `isRpcAvailable` branch/import from this file. Only keep the `ViewEditor`/`ViewReact`-style split if you find a concrete reason stories need dev-only interactive behavior beyond ordinary HMR data refresh — HMR refresh itself does not require an editor component, just a live-updating hook, which `StoryReact` already gets "for free" per this plan's architecture note.)

**Step 3: `StoryReact.tsx`**

```tsx
import { useRef } from 'react'
import { LikeC4Diagram } from '@likec4/diagram'
import { resolveScene } from '@likec4/core'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useCallbackRef } from '../hooks/useCallbackRef' // or wherever this repo's existing callback-ref helper lives — reuse, don't reinvent
import { useCurrentStory } from '../hooks'
import { useCurrentView } from '../hooks'
import { NotFound } from '../components/NotFound'

export function StoryReact() {
  const navigate = useNavigate()
  const { storyId } = useParams({ from: '/project/$projectId/story/$storyId/view/$viewId' })
  const story = useCurrentStory()
  const [view] = useCurrentView()
  const previousRef = useRef<typeof view>(null)

  if (!story || !view) {
    return <NotFound />
  }

  const currentScene = story.scenes.find(s => s.view === view.id)
  const resolved = currentScene
    ? resolveScene({ model: /* pass whatever resolveScene needs */, scene: currentScene, previous: previousRef.current, sceneLayout: story.sceneLayout })
    : view
  previousRef.current = resolved

  const onNavigateTo = useCallbackRef((targetViewId: string) => {
    const isOwnScene = story.scenes.some(s => s.view === targetViewId)
    if (isOwnScene) {
      void navigate({
        to: '/project/$projectId/story/$storyId/view/$viewId',
        params: current => ({ ...current, viewId: targetViewId }),
      })
    } else {
      void navigate({
        to: '/project/$projectId/view/$viewId',
        params: current => ({ projectId: current.projectId, viewId: targetViewId }),
      })
    }
  })

  return <LikeC4Diagram view={resolved} story={story.$view} onNavigateTo={onNavigateTo} />
}
```
(This is a sketch — reconcile the exact `resolveScene` signature against what Task 6 actually produced, the exact `useCurrentView`/`useCurrentStory` return shapes, and whatever this repo's actual "stable callback ref" utility is called — check `ViewReact.tsx`'s own `onNavigateTo` for the pattern it already uses, since it likely already solves "stable callback that reads fresh closure state," and copy that exact utility rather than introducing a new one.) Neither `navigate(...)` call passes `replace: true` — per the Global Constraints, Next/Prev/scene navigation pushes history by default.

**Step 4: `useCurrentStoryId()` / `useCurrentStory()`**

In `packages/likec4-spa/src/hooks.ts`, add, mirroring `useCurrentViewId`/`useCurrentView` exactly:
```ts
export function useCurrentStoryId(): ViewId {
  const storyId = useParams({
    select: params => params.storyId,
    strict: false,
  })
  return storyId as ViewId
}

export function useCurrentStory() {
  const storyId = useCurrentStoryId()
  const model = useLikeC4Model() // or useLikeC4ModelAtom-backed equivalent, matching useCurrentView's pattern
  return model.findStory(storyId)
}
```
(Match whichever model-access hook `useCurrentView` actually uses — the research shows it uses `useLikeC4ModelAtom()` plus a manual subscribe/`useState` for live updates; if `useCurrentStory` needs the same live-update behavior once Task 8 improves HMR diffing for stories, give it the same subscribe/`useState` shape as `useCurrentView`, not a naive one-shot `.get()`.)

**Step 5: Build and test**

`pnpm exec tsc --build`. Confirm `routeTree.gen.ts` regenerates when you run `pnpm dev` in `packages/likec4-spa` (it's git-tracked and auto-generated by the TanStack Router Vite plugin on file changes — the research confirmed no manual registration step is needed; just create the route files and let the dev server pick them up, then commit the regenerated `routeTree.gen.ts` alongside your route files since it's tracked, not gitignored). Manually smoke-test: start the dev server, visit `/project/cloud-system/story/migration`, confirm it redirects to `/project/cloud-system/story/migration/view/<first-scene-view-id>`, confirm Next/Prev buttons change the URL and push history (browser back button steps backward through scenes), confirm clicking a node that navigates to a view outside the story's scene list lands on the flat `/project/cloud-system/view/<id>` route.

**Step 6: Commit**

```bash
git add packages/likec4-spa
git commit -m "feat(likec4-spa): add nested story/scene routes with real push navigation"
```

---

### Task 8: Vite-plugin — HMR diff quality and type declarations for `stories`

**Files:**
- Modify: `packages/vite-plugin/src/internal.ts` (`createHooksForModel`'s `updateModel`)
- Modify: `packages/vite-plugin/src/modules.d.ts` (`likec4:model/*` ambient declaration)

**Interfaces:**
- Produces: `createHooksForModel`'s `updateModel` now diffs `data.stories` per-story (identity-preserving, like it already does for `data.views`), so HMR updates to a story's DSL don't force-remount subscribers unnecessarily. Also exposes `useLikeC4Story(storyId)` mirroring `useLikeC4View(viewId)`, if useful to `packages/likec4-spa`'s `useCurrentStory()` (Task 7) — check whether Task 7 already gets everything it needs from `useLikeC4Model().findStory(id)` directly (it likely does, since `LikeC4Model` itself has `findStory` per Task 1) before adding a redundant hook here.

**Step 1: Confirm the "already free" finding before changing anything**

Before writing any code, verify directly: does `packages/vite-plugin/src/virtuals/model.ts`'s generated code already ship `stories` for free? It calls `likec4.layoutedModel(project.id)` and serializes `model.$data` (the full `LayoutedLikeC4ModelData`) via `JSON5.stringify`. After Task 1/2, `model.$data.stories` should already exist and be populated. Add a temporary `console.log` (or a quick manual dev-server check) confirming `$likec4data.get().stories` is non-empty for a project with a story, then remove the temporary logging. If this does *not* hold — if `stories` is somehow empty or missing at this point — stop and report it as a blocker; something in Task 1/2/3's wiring is incomplete, and this task cannot proceed until that's fixed (do not paper over it with a new virtual module; that would contradict this plan's architecture note and reintroduce the cost RFC 0002 flagged as avoidable).

**Step 2: Extend `updateModel`'s diffing to `stories`**

In `packages/vite-plugin/src/internal.ts`, `createHooksForModel`'s `updateModel` currently only preserves per-view identity:
```ts
function updateModel(data: LayoutedLikeC4ModelData) {
  const current = $atom.get()
  const next = {
    ...data,
    views: mapValues(data.views, (next) => {
      const currentView = current.views[next.id]
      return deepEqual(currentView, next) ? currentView : next
    }),
  }
  if (shallowEqual(next.views, current.views) && deepEqual(next, current)) {
    return
  }
  $atom.set(next as LayoutedLikeC4ModelData)
}
```
Extend it to treat `stories` identically:
```ts
function updateModel(data: LayoutedLikeC4ModelData) {
  const current = $atom.get()
  const next = {
    ...data,
    views: mapValues(data.views, (next) => {
      const currentView = current.views[next.id]
      return deepEqual(currentView, next) ? currentView : next
    }),
    stories: mapValues(data.stories, (next) => {
      const currentStory = current.stories[next.id]
      return deepEqual(currentStory, next) ? currentStory : next
    }),
  }
  if (
    shallowEqual(next.views, current.views) &&
    shallowEqual(next.stories, current.stories) &&
    deepEqual(next, current)
  ) {
    return
  }
  $atom.set(next as LayoutedLikeC4ModelData)
}
```
Add `useLikeC4Story(storyId: string)` mirroring `useLikeC4View(viewId: string)` only if Step 1's investigation shows `packages/likec4-spa` genuinely needs it beyond what `useLikeC4Model().findStory(id)` already provides — check Task 7's `useCurrentStory()` implementation and skip this if it's redundant.

**Step 3: `modules.d.ts`**

In `packages/vite-plugin/src/modules.d.ts`, the `declare module 'likec4:model/*'` block (lines 125-140) already types `$likec4data: Atom<LayoutedLikeC4ModelData<Types>>` — since `LayoutedLikeC4ModelData` now includes `stories` (Task 1), this ambient declaration needs **no changes** for `$likec4data.stories` to be correctly typed; TypeScript picks up the new field automatically through the existing type reference. Add `useLikeC4Story` to this block only if Step 2 added it.

**Step 4: Build and test**

`pnpm exec tsc --build`. Run `packages/vite-plugin`'s test suite if one exists covering `createHooksForModel`. Manually smoke-test: with the dev server running (Task 7's smoke test), edit `examples/cloud-system/story.c4`'s story title text while a story-scene page is open, confirm the title updates via HMR without a full page reload.

**Step 5: Commit**

```bash
git add packages/vite-plugin
git commit -m "feat(vite-plugin): diff stories per-item on HMR update, matching views"
```

---

### Task 9: Docs — record the implementation, verify end-to-end

**Files:**
- Modify: `docs/rfcs/0002-story-containment-investigation.md` — append a short "Implementation record" section
- Verify: `examples/cloud-system/story.c4` end-to-end via the dev server

**Step 1: Append an implementation record to RFC 0002**

Add a section after "Open questions" recording: which of the "Open questions" got resolved and how (push history — resolved, chose push; DSL placement — resolved, sibling `stories { }` block; dev-mode RPC parity — resolved, turned out to need no new virtual module because `stories` rides the existing `likec4:model` module once it's a field on `LayoutedLikeC4ModelData`). Note the one deviation from the RFC's own migration sketch: the story actor/cursor were deleted rather than rewired, because push-based real navigation made the cursor concept itself redundant (the route is the cursor) — cite Task 6 of `docs/superpowers/plans/2026-08-03-story-containment-redesign.md` as where this happened.

**Step 2: End-to-end verification**

Start the dev server (`pnpm --filter @likec4/likec4-spa dev` or whatever the repo's existing "start dev server for demo" command is — check `AGENTS.md`/prior session commands if unsure). Visit `/project/cloud-system/story/migration`, confirm:
1. Redirects to the first scene's URL.
2. Next/Prev buttons change the URL and the diagram content, pushing browser history (back button steps backward one scene at a time).
3. The `anchored`/`independent` `sceneLayout` still visibly differs (compare the same measurement RFC 0001's POC took: `dynamic-view-1 → cloud_next` and `cloud_legacy → dynamic-view-1` centroid displacement) — confirm the numbers are unchanged from the POC's original finding (207px/240px and 328px/243px respectively), since Task 6 only relocated `resolveScene`/`calcSceneOffset`, it should not have changed their output.
4. Editing `examples/cloud-system/story.c4`'s story content while the dev server is running triggers an HMR update on the open story-scene page (Task 8's smoke test, repeated here as a final end-to-end check alongside everything else).
5. Visiting the old flat `/project/cloud-system/view/migration` URL now 404s (`<NotFound/>`) rather than crashing or showing stale content.

**Step 3: Full-repo verification**

Run `pnpm exec tsc --build` (clean, repo-wide), `pnpm test` (or `pnpm test --no-typecheck` if faster and typecheck was just verified separately), `pnpm lint`. Fix anything still red.

**Step 4: Commit**

```bash
git add docs/rfcs/0002-story-containment-investigation.md
git commit -m "docs: record the containment redesign's implementation outcome in RFC 0002"
```

---

## Self-Review Notes (for whoever executes this plan)

- **Task 1 and Task 3 both touch "what does `ParsedLikeC4ModelData.stories` look like."** Task 1 defines the type; Task 3 populates it from the parser. If Task 3's implementer finds the shape Task 1 defined doesn't match what the parser naturally produces, that's a real finding — surface it rather than forcing a mismatched cast.
- **Task 6 is the highest-risk task** — it deletes the most code and makes the biggest architectural bet (no actor needed once navigation is real). If the implementer finds a reason the actor *is* still needed (e.g., some animation/transition timing requirement this plan didn't anticipate), stop and report rather than forcing the deletion through.
- **Task 7's `StoryReact.tsx` sketch is deliberately incomplete** (marked "reconcile... against what Task 6 actually produced") — Tasks 6 and 7 are sequential specifically so Task 7's implementer has real, not speculative, signatures to work from.
- **Task 8 depends on a finding, not just a type change** — if Step 1's verification fails, Task 8 cannot proceed as written; it would need to fall back to RFC 0002's original "new virtual module" design instead, which is a materially bigger task. Flag this immediately if it happens rather than silently building the bigger version.
