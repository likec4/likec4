# RFC 0001 — Story views

- **Status**: draft, targeting a local proof-of-concept
- **Date**: 2026-07-30
- **Scope**: new `story` view type in the LikeC4 DSL, plus the rendering and navigation to make it legible

## Summary

A **story** is a view type that shows how an architecture _changes_, by playing an ordered
sequence of existing views. Where a `dynamic view` animates control flow across one static
picture, a story animates across _several_ pictures.

```likec4
story migration {
  title 'Migration to microservices'

  scene monolith
  scene strangler
  scene microservices
}
```

Stories reuse the dynamic-view walkthrough panel and its Next/Previous cursor. A scene may
itself be a dynamic view, in which case one cursor walks into that view's steps and back out.

## Motivation

LikeC4 describes architecture at rest. Explaining a _migration_ today means authoring several
views and asking the reader to click between them, which loses the two things that make a
migration comprehensible:

1. **Continuity** — which boxes are the same boxes, and which are new.
2. **Ordering** — that these pictures are consecutive states, not alternatives.

A story makes both explicit in the model rather than in a slide deck alongside it.

## Guide-level explanation

### A story is a view

`story` is declared inside `views { }` beside `view`, `dynamic view`, and `deployment view`.
It gets a `ViewId`, so it appears in search, in the navigation dropdown, and at the SPA route
`/view/$viewId` with no extra work.

A story owns **no geometry of its own**. Each scene names another view, and that view remains
the single source of truth for its own picture.

### Scenes

```likec4
views {
  view monolith      { title 'Before'; include * where tag is #monolith }
  view strangler     { title 'Facade in front' }
  view microservices { title 'After';  include * where tag is #microservice }

  dynamic view checkout_after {
    orders -> billing 'charge'
    billing -> ledger 'record'
  }

  story migration {
    title 'Migration to microservices'
    sceneLayout anchored

    scene monolith {
      notes 'Everything ships together. One database.'
    }

    scene strangler {
      title 'Introduce a facade'
      notes 'Traffic still terminates in the monolith.'
    }

    scene microservices {
      title 'Extract the services'
      monolith.api becomes orders.api, billing.api
    }

    scene checkout_after {
      notes 'The new checkout path, step by step.'
    }
  }
}
```

A scene's `title` and `notes` drive the walkthrough panel. Both reuse the existing
`ViewStringProperty` and `NotesProperty` grammar rules, so no new property machinery is needed.

The last scene is a dynamic view. Pressing Next at that scene descends into its steps; pressing
Next past its final step leaves the story (or advances to the following scene, if any).

### Correspondence: `becomes`

Between two scenes, the renderer matches elements by identity — a node's id _is_ its element FQN
(`packages/core/src/compute-view/utils/buildComputedNodes.ts:46`), so an element appearing in
both scenes is recognised automatically and keeps its on-screen identity.

`becomes` declares correspondence that identity cannot express: one element turning into several,
several collapsing into one, or a rename.

```likec4
scene microservices {
  monolith.api becomes orders.api, billing.api   // split
}

scene consolidated {
  orders.db, billing.db becomes shared.db        // merge
}

scene renamed {
  legacy.gateway becomes edge.gateway            // rename
}
```

One keyword covers N→M in both directions. `split` and `merge` were considered as separate
keywords and rejected as redundant.

### Branching

Branching reuses the dynamic-view `alt` / `when` / `else` blocks:

```likec4
story options {
  scene current
  alt {
    when 'Aggressive: full rewrite' {
      scene rewrite_phase1
      scene rewrite_phase2
    }
    else {
      scene hybrid
    }
  }
}
```

**Traversal is depth-first, matching dynamic views exactly.** `Next` walks
`current → rewrite_phase1 → rewrite_phase2 → hybrid`. It does _not_ prompt the viewer to choose
a branch. This is the existing semantics of `alt` in a dynamic view — "either of these happened"
— and stories inherit it unchanged. The walkthrough panel labels the active branch
("Aggressive: full rewrite — branch 1 of 2") so the viewer knows they are inside a hypothetical.

For genuinely mutually exclusive futures, author separate stories and link them with `navigateTo`:

```likec4
story aggressive_path { title 'If we rewrite'; scene current; scene rewrite_phase1 }
story hybrid_path     { title 'If we go hybrid'; scene current; scene hybrid }

view current {
  include decision_point with { navigateTo aggressive_path }
}
```

This is idiomatic rather than novel: LikeC4 already uses `navigateTo` on a relation to mean
"this step is elaborated in another dynamic view".

### Flow control beyond `alt` — speculative

`alt` is the only block the MVP implements, but it is one of eight `SubflowKind` keywords plus the
`try` / `catch` / `finally` chain. Because `StorySubflow` reuses `SubflowKind` wholesale, the
grammar admits all of them from day one at no cost. The question is which ones _mean_ anything for
a story, and that deserves an answer before any of them are wired up.

#### The semantic gap

Dynamic-view blocks describe **the control flow of a single interaction**: these two messages are
concurrent, this one is conditional, that one retries. Story blocks would describe **variation in a
narrative over architectural states**. Those are not the same kind of thing, and the keywords do
not all survive the translation.

The risk of adopting the full set uncritically is that it invites the reading that _a story is a
program_. It is not — it is a narrative over states. Every construct made available is a construct
authors will try to compute with.

So each keyword is assessed on one question: does it describe **narrative variation** (which a
story can express), or **execution semantics** (which it cannot)?

#### Survives translation

**`opt` — an optional stage.** Some readers of the story take this step; some skip it.

```likec4
story migration {
  scene monolith
  opt 'If you need read scaling first' {
    scene read_replicas
  }
  scene microservices
}
```

The strongest fit of the whole set, and the cheapest: existing machinery already does exactly this.
`collapsedSequenceFlows` lets a viewer collapse a subflow so the cursor skips it
(`packages/diagram/src/likec4diagram/state/machine.state.ready.walkthrough.ts:242`). "An optional
stage the viewer can skip" _is_ that affordance, applied to scenes.

**`loop` — an iterative stage.** The scenes inside represent one pass of something that repeats.

```likec4
story strangler {
  scene monolith
  loop 'for each remaining service' {
    scene extract_one
    scene verify_one
  }
  scene fully_decomposed
}
```

This matches the strangler-fig pattern directly, which is genuinely iterative rather than a
sequence of distinct states.

**One distinction is critical here.** `loop` as a _label_ — show the iteration once, annotate that
it repeats — is cheap and coherent. `loop` as _generative iteration_ — expand into one scene per
element of some set — is templating, an order of magnitude larger, and would need a way to
parameterise a view by element. Only the label reading is proposed. The generative reading is
explicitly out of scope and should not be inferred from the keyword.

#### Structurally sound, vocabulary mismatched

**`try` / `catch` / `finally` — rollback planning.** The structure maps unexpectedly well: a happy
path, a failure path, and a convergent end state reached either way. Migration plans really do have
rollback plans, and they are rarely documented alongside the architecture.

```likec4
story cutover {
  try 'Cut over to the new service' {
    scene traffic_shifted
  }
  catch 'If error rates spike' {
    scene rolled_back_to_monolith
  }
  finally {
    scene facade_decommissioned
  }
}
```

The _shape_ is worth supporting. The _vocabulary_ is borrowed from programming and reads oddly in a
change-management document — an author would write "rollback", not "catch". Story-native aliases
(`attempt` / `rollback` / `regardless`, or similar) would read better, at the cost of new `Id`
entries, new regression fixtures, and divergence from dynamic views. Unresolved; see
[Deferred decisions](#deferred-decisions).

#### Unresolved

**`par` / `parallel` — concurrent workstreams.** Real migrations do evolve two things at once —
splitting services while migrating the database. But a story cannot dodge the question this forces:
two concurrent scenes cannot both be _the_ frame. Three readings, none obviously correct:

1. **Narrative annotation.** Walk the branches sequentially, label them as concurrent. Cheapest and
   honest, but does not actually show concurrency — it only asserts it.
2. **Composite frame.** Render the union of the parallel branches' scenes as a single frame.
   Coherent, but arguably redundant: an author can already write one view containing both. It also
   revives the "whose layout wins when merging two scenes" problem — `sceneLayout unified` in
   miniature.
3. **Split screen.** Two viewports side by side. Most literal, genuinely new UI, most expensive.

**`break` — a terminal branch.** In a dynamic view, `break` exits the flow. The story reading is "this
path ends the story rather than rejoining the main line". That only becomes meaningful once
branching is a real choice: under depth-first traversal there is no rejoining to contrast against,
so `break` has nothing to say until fork-prompt navigation exists. Parked until then.

**`when` / `if` / `else`** are `alt`'s branch kinds rather than standalone blocks, and are already
covered by `alt`.

#### Recommended adoption order

| Order    | Keyword                     | Rationale                                                      |
| -------- | --------------------------- | -------------------------------------------------------------- |
| MVP      | `alt`, `when`, `if`, `else` | Needed for branching; traversal is free.                       |
| Next     | `opt`                       | Clearest narrative reading; reuses collapse-to-skip machinery. |
| Next     | `loop` (label only)         | Matches a real migration pattern; cheap as an annotation.      |
| Later    | `try` / `catch` / `finally` | Resolve the vocabulary question first.                         |
| Later    | `par` / `parallel`          | Resolve the rendering question first.                          |
| Deferred | `break`                     | Meaningless until fork prompts exist.                          |

**Grammar admits every `SubflowKind`, validation gates the rest.** `StorySubflow` accepts any
`SubflowKind` — `opt`, `par`, `parallel`, `loop`, `break`, `when`, `if`, `else` — from the start,
and validation rejects the not-yet-implemented kinds with an explicit "not yet supported in
stories" diagnostic. This is deliberate: speculative syntax from this RFC can be typed into a
`.c4` file today and get a meaningful error rather than a parse failure, and the grammar does not
churn as each keyword is implemented.

`try` / `catch` / `finally` is the exception. It is a chained three-rule construct
(`TryBlock` → `CatchBlock` → `FinallyBlock`, `like-c4.langium:742-758`) rather than one
keyword-parameterised rule, so admitting it purely to reject it would add real grammar surface for
no MVP benefit. It is **not admitted by the story grammar** and fails to parse until it is
implemented. The `StoryTry` type below is specified for that future work, not built now.

### Scene layout modes

> **Superseded.** The `sceneLayout: anchored | independent | unified` story-level property
> described in this section was replaced by a per-scene, DSL-authored `anchor <ElementRef>`
> statement — see `docs/superpowers/plans/2026-08-04-story-scene-anchor.md`. The discussion below
> is kept for historical context on why alignment was originally automatic and story-scoped.

How consecutive scenes relate geometrically is configurable, because the right answer is a visual
judgement that should be made by looking rather than by argument.

```likec4
story migration {
  sceneLayout anchored      // default
}
```

| Mode          | Behaviour                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anchored`    | Each scene keeps its own view's layout untouched. The incoming frame is translated so shared elements move as little as possible.                        |
| `independent` | Each scene keeps its own layout, with no alignment. Shared elements interpolate from wherever they were to wherever they are.                            |
| `unified`     | One layout is computed across every scene; positions are fixed, so shared elements never move. Frames become sparse where absent elements reserve space. |

`anchored` and `independent` are the same code path — `independent` is `anchored` with the
alignment offset forced to zero — so both ship together and can be compared live.

`unified` is the only mode that requires a story-owned layout pass, and the only one that
discards per-view layout intent and manual layouts. It is deferred; see
[Deferred decisions](#deferred-decisions).

Dynamic scenes are exempt from `unified`: a dynamic view in `sequence` variant owns a bespoke
layout that cannot be merged into a union graph.

### The property is `sceneLayout`, not `layout`

Views already carry `autoLayout` (Graphviz rank direction). Two similarly named properties in one
block is a footgun, so the story-level property is spelled `sceneLayout`.

### `navigateTo` inside a story

`navigateTo` is today a **route change**: the action button calls `diagram.navigateTo()`, which
emits to the host, and the SPA's handler (`packages/likec4-spa/src/pages/ViewReact.tsx:35`) calls
the router. Left alone, clicking it mid-story would swap the route and silently discard the cursor.

Inside a story, `navigateTo` is intercepted:

- If the target view **is a scene of the current story**, the cursor jumps to that scene.
- Otherwise, it falls through to the existing behaviour and leaves the story.

The same view can therefore be both a standalone destination and a scene, with the click doing the
right thing in each context.

`navigateTo` also gains stories as a destination:

- From an element — already free. `NavigateToProperty` takes `ViewRef` = `[LikeC4View]`, and a
  story is a `LikeC4View`.
- From a relation or dynamic-view step — **not supported.** This was specified as "one grammar
  line: widen `RelationNavigateToProperty` from `DynamicViewRef` to `DynamicViewRef | StoryViewRef`",
  and that turned out to be wrong: the two alternatives are syntactically identical bare
  cross-references, so Langium/Chevrotain cannot disambiguate them and always reduces to the first.
  `navigateTo <storyName>` from a step then fails with "Could not resolve reference to DynamicView",
  and `langium generate` emits no ambiguity warning. Cut from the MVP; see
  [Deferred decisions](#deferred-decisions).

## Reference-level explanation

### Grammar delta

In `packages/language-server/src/like-c4.langium`:

```langium
type LikeC4View = ElementView | DynamicView | DeploymentView | StoryView;

LikeC4ViewRule returns LikeC4View:
  DynamicView | DeploymentView | StoryView | ElementView;

StoryView:
  'story' name=Id body=StoryViewBody?;

StoryViewBody: '{'
  tags=Tags?
  props+=StoryViewProperty*
  statements+=StoryStatement*
'}';

StoryViewProperty:
  StorySceneLayoutProperty | ViewProperty;

StorySceneLayoutProperty:
  key='sceneLayout' ':'? value=StorySceneLayoutValue ';'?;

StorySceneLayoutValue returns string:
  'anchored' | 'independent' | 'unified';

StoryStatement:
  StoryScene | StoryAlt | StorySubflow;

StoryScene:
  'scene' view=[LikeC4View] body=StorySceneBody? ';'?;

StorySceneBody: '{'
  props+=(ViewStringProperty | NotesProperty)*
  rules+=StoryCorrespondenceRule*
'}';

StoryCorrespondenceRule:
  sources=ElementRefs 'becomes' targets=ElementRefs ';'?;

ElementRefs:
  refs+=ElementRef (',' refs+=ElementRef)*;

// Reuses the existing SubflowKind terminal set:
//   'opt' | 'par' | 'parallel' | 'loop' | 'when' | 'if' | 'else' | 'break'
// One rule covers every block keyword, exactly as SubflowStep does for
// dynamic views (like-c4.langium:684-687).
StorySubflow:
  kind=SubflowKind title=String? '{' statements+=StoryStatement* '}';

StoryAlt:
  'alt' title=String? '{' branches+=StorySubflow* '}';

// NOTE: `StoryViewRef` and a widened `RelationNavigateToProperty` were originally specified here
// and have been removed. Two bare cross-reference alternatives are not disambiguable in Langium,
// so `RelationNavigateToProperty` keeps its original `value=DynamicViewRef` unchanged.
```

### Backward compatibility: the `Id` rule

`like-c4.langium:1177` carries an `Id` rule that re-admits every keyword as an identifier, with the
comment _"We need to add all the possible terminal values to Id, so that the parser can accept them
as Id (not a bug and not a feature of Langium)"_.

New keywords **must** be added there, or any existing model using `story`, `scene`, `becomes`, or a
mode name as an element name will stop parsing:

```langium
Id returns string:
  IdTerminal |
  /* ...existing... */ |
  StorySceneLayoutValue |
  'story' | 'scene' | 'sceneLayout' | 'becomes';
```

This is the single most likely regression in the whole proposal and gets its own test fixture.

The block keywords cost nothing by contrast. `SubflowKind` — `opt`, `par`, `parallel`, `loop`,
`when`, `if`, `else`, `break` — plus `try`, `catch`, and `finally` are already enumerated in
`DynamicViewFlowKeyword` (`like-c4.langium:1107-1117`), which the `Id` rule already includes. Every
block keyword a story might adopt is therefore _already_ usable as an element name today, so
adopting them adds no new backward-compatibility surface at all.

This is a load-bearing argument for reusing the dynamic-view vocabulary rather than inventing
story-native names: `optional` and `repeat` would each need a new `Id` entry and a new regression
fixture, while `opt` and `loop` need neither.

### Core types

New `packages/core/src/types/view-parsed.story.ts`, deliberately mirroring the shapes in
`view-parsed.dynamic.ts`:

```ts
export type StorySceneLayout = 'anchored' | 'independent' | 'unified'

export interface StoryCorrespondence<A extends AnyAux = AnyAux> {
  readonly sources: NonEmptyReadonlyArray<aux.StrictFqn<A>>
  readonly targets: NonEmptyReadonlyArray<aux.StrictFqn<A>>
}

export interface StoryScene<A extends AnyAux = AnyAux> {
  readonly view: aux.StrictViewId<A>
  readonly title?: string | null
  readonly description?: scalar.MarkdownOrString
  readonly notes?: scalar.MarkdownOrString
  readonly becomes?: StoryCorrespondence<A>[]
  /**
   * Path to the AST node relative to the view body ast.
   * Used to locate the scene in the source code. Mirrors `Step.astPath`.
   */
  readonly astPath: string
}

/**
 * Block kinds a story may contain. Only `alt` is implemented by the MVP;
 * the rest are parsed and rejected by validation. `parallel` normalises to
 * `par`, exactly as dynamic views do.
 */
export type StorySubflowKind = 'opt' | 'par' | 'loop' | 'break'
export type StoryAltBranchKind = 'when' | 'if' | 'else'

export interface StorySubflow<A extends AnyAux = AnyAux> {
  readonly [_type]: StorySubflowKind
  readonly title?: string
  readonly statements: NonEmptyReadonlyArray<AnyStoryStatement<A>>
}

export interface StoryAltBranch<A extends AnyAux = AnyAux> {
  readonly [_type]: StoryAltBranchKind
  readonly title?: string
  readonly statements: NonEmptyReadonlyArray<AnyStoryStatement<A>>
}

export interface StoryAlt<A extends AnyAux = AnyAux> {
  readonly [_type]: 'alt'
  readonly title?: string
  readonly branches: NonEmptyReadonlyArray<StoryAltBranch<A>>
}

/**
 * Mirrors `Step.Try`: a happy path, an optional failure path, an optional convergent end.
 * Specified for future work — NOT part of the MVP, and deliberately absent from
 * `AnyStoryStatement` so no dead code path exists for it.
 */
export interface StoryTry<A extends AnyAux = AnyAux> {
  readonly [_type]: 'try'
  readonly try: StoryBlock<A>
  readonly catch?: StoryBlock<A>
  readonly finally?: StoryBlock<A>
}

export interface StoryBlock<A extends AnyAux = AnyAux> {
  readonly title?: string
  readonly statements: NonEmptyReadonlyArray<AnyStoryStatement<A>>
}

export type AnyStoryStatement<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Scene: StoryScene<A>
  Alt: StoryAlt<A>
  Subflow: StorySubflow<A>
}>

export interface ParsedStoryView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
  [_type]: 'story'
  readonly sceneLayout?: StorySceneLayout
  readonly statements: AnyStoryStatement<A>[]
}
```

`ComputedStoryView` and `LayoutedStoryView` add `sceneLayout` (resolved, no longer optional), a flat
`scenes` list in depth-first traversal order, and a `storyFlow` tree that preserves `alt` blocks for
the outline panel. `nodes` and `edges` are empty arrays.

The `scenes` list is an array rather than a map keyed by path, because traversal order is the thing
consumers need: `prevAndNext` is an index step over it, so `computeStoryView` flattens once and
`StoryFlow` derives its own path→index lookup. Scene paths remain hierarchical (`scalar.StepPath`
format) and unique, so a map is recoverable whenever one is wanted.

Adding `story` to the `ParsedView` / `ComputedView` / `LayoutedView` unions turns every
`nonexhaustive(view)` dispatch site into a compile error. That error list is the implementation
checklist, which is a feature — it is why the type lands first.

### Scene paths

Scene paths reuse `scalar.StepPath` verbatim. `parentFlow` and `flowAncestors`
(`packages/core/src/types/view-dynamic-flow.ts:381-421`) are pure string operations over
`NN` / `NN:type` segments and are view-agnostic, so they apply to story paths with no change.

### StoryFlow

`StoryFlow` mirrors `DynamicViewFlow`'s public surface — `firstStep`, `prevAndNext`, `lookup`,
`level`, `steps`, `subflows` — but resolves paths to scenes.

It **cannot** reuse `walkthroughFlow`. That walker hard-requires edge lookups
(`view-dynamic-flow.ts:563-573`, `edgesmap.get(step)` under `nonNullable`), so routing scenes
through it would mean synthesising fake edges. The alternative is generalising the walker with a
pluggable step resolver, which touches a load-bearing file covered by snapshot tests
(`computeFlow.spec.ts`, `utils.spec.ts`).

**Decision for the POC:** duplicate roughly eighty lines of tree-walk in `StoryFlow`, with a TODO
pointing at the resolver refactor. If this proposal is ever pursued upstream, the refactor is the
correct move and should happen before merge.

### The cursor is a composition

```ts
type StoryCursor = {
  scene: StepPath
  innerStep: StepPath | null // step within a dynamic scene, if any
}
```

`next()`:

1. If the current scene is a dynamic view and `DynamicViewFlow.prevAndNext(innerStep).next`
   exists, advance `innerStep`.
2. Otherwise advance `scene` via `StoryFlow.prevAndNext`, seeding `innerStep` from the new scene's
   `firstStep()` when that scene is dynamic.

`prev()` is the mirror image. `nextScene()` — the second control pair, should it ever be wanted —
is this function minus step 1, which is why deferring the two-cursor UI costs nothing structurally.

### Compute

`packages/core/src/compute-view/story-view/compute.ts` exports `computeStoryView`:

1. Resolve each scene's view reference; reject stories (defence in depth — the LSP validation is
   the primary gate).
2. Assign `StepPath` ids by walking statements, mirroring how dynamic-view steps are numbered.
3. Resolve `becomes` FQNs through the model.
4. Return a `ComputedStoryView` with empty `nodes` and `edges`.

It deliberately does **not** inline scene geometry.

### Layout

`getPrinter` (`packages/layouts/src/graphviz/GraphvizLayoter.ts:41`) gains a `story` case. Because
a story has no DOT representation at all, `GraphvizLayoter.layout()` needs a bypass _before_ it
calls `this.dot()`, returning the view stamped `_stage: 'layouted'`.

`layoutAllViews` processes views independently, so there is no inter-view ordering problem to solve.

Manual layout is inapplicable by construction: `applyManualLayout` guards view-type extras behind
`isDynamicView` / `isElementView` (`packages/core/src/manual-layout/applyManualLayout.ts:299-303`),
and a story owning no positions has nothing to drift.

### Alignment math

`packages/core/src/story/align.ts` — pure, unit-tested math over two position maps, kept out of the
React layer:

1. `shared` = nodes present in both frames, matched by node id (the element FQN).
2. `shared` empty → offset `(0, 0)`; the transition is a pure crossfade.
3. Otherwise offset = `centroid(outgoing[shared]) − centroid(incoming[shared])`.
4. `independent` mode forces the offset to `(0, 0)`.

**Translation only** — no scale, no rotation. Scaling would render the same element at different
sizes in different scenes, which reads as a zoom rather than as continuity. Centroid alignment is
the least-squares optimum for a translation-only fit, so it degrades predictably: one shared node
pins exactly, many minimise mean displacement.

### Diagram integration

The `packages/diagram` guidance in `AGENTS.md` is that a new feature gets a sibling folder with its
own actor, promoted into `likec4diagram/` only when it must coordinate with the main machine. A
story must — it swaps canvas contents — so:

- **`packages/diagram/src/story/actor.ts`** owns the cursor and is spawned as a child of the main
  machine, the way `editorActorLogic` already is.
- **A new `story.scene` event, distinct from `update.view`.** `update.view` with a differing view
  id pushes navigation history and runs the `navigating` state, so reusing it would mean every
  Next press pollutes browser back. `story.scene` reuses `mergeXYNodesEdges`
  (`packages/diagram/src/likec4diagram/state/assign.ts:52`, which already merges by node id across
  differing views) and skips the history push.
- **Scene resolution** goes through `useLikeC4Model`, as `LikeC4View.tsx` already does for
  arbitrary views. The alignment offset is applied before `convertToXYFlow`.
- **Panel** reuses `WalkthroughPanel` for `title` and `notes`, and adds a scene list following the
  pattern in `likec4diagram/ui/sequence-outline/SequenceOutlinePanel.tsx`. A new `StoryWalkthrough`
  feature flag sits beside `DynamicViewWalkthrough`
  (`packages/diagram/src/context/DiagramFeatures.tsx:23`).
- **`navigateTo` interception** lives in the story actor: if the target is one of the story's scene
  view ids, `gotoScene`; otherwise fall through to the existing host emit.

### Transition rendering

Node identity across scenes is already stable, and `updateNodes` already merges by id across
differing views. The only missing ingredient is _interpolation_: XYFlow applies `transform`
immediately, and `packages/diagram/src/styles-xyflow.css` is a bare `@import` with no node rules.

The POC adds a transient CSS transition on node transform for the duration of a scene change,
removed afterwards so that dragging stays crisp.

`becomes` feeds this pairing: a source node's exit is anchored to the bounding box of its targets,
so it visibly divides toward them, and the targets enter from that same box.

### Validations

| Check                                                                      | Severity                               | Location        |
| -------------------------------------------------------------------------- | -------------------------------------- | --------------- |
| `scene` targets a story view (no nested stories)                           | error                                  | language-server |
| `alt` block has no branches                                                | error                                  | language-server |
| Block kind not yet implemented (`opt`, `par`, `parallel`, `loop`, `break`) | error — "not yet supported in stories" | language-server |
| `alt` branch is not a `when` / `if` / `else` block                         | error                                  | language-server |
| Story has no scenes                                                        | warning                                | language-server |
| `becomes` refs absent from the adjacent scenes                             | deferred — needs computed views        | —               |

## Drawbacks

- **Fourth view type.** Every `nonexhaustive` dispatch site must grow a branch, including
  generators and exporters that have no meaningful story implementation.
- **No single image.** A story cannot be exported to PNG or SVG, cannot be emitted as Mermaid,
  PlantUML, or D2, and has no sensible representation in any of the existing generators. Stories
  are a viewer-only artifact.
- **Depth-first `alt` may mislead.** Playing alternative futures consecutively is faithful to
  dynamic-view semantics but is not what "alternative" suggests. The branch label in the panel is
  a mitigation, not a fix.
- **A story couples views.** Renaming or deleting a view breaks any story referencing it. This is
  no worse than `navigateTo` or `extends`, but it widens the blast radius of a view rename.
- **Duplicated tree-walk.** `StoryFlow` repeats traversal logic that `walkthroughFlow` already
  implements, deliberately, to avoid refactoring a snapshot-tested file during a POC.

## Open architectural question — is a story a view?

**This is the most significant unresolved question in the RFC, and it was raised by the POC rather
than answered by it.**

This RFC decided a story _is_ a view: `_type: 'story'`, a `ViewId`, served at `/view/$viewId`. The
reasoning was routing convenience — search indexing, the navigation dropdown, and `model.findView`
all come free. That reasoning holds, but the cost turned out to be much larger than anticipated, and
it is concentrated in exactly the places the implementation went wrong:

- **Task 14 exists only because of this decision.** Widening `ParsedView` / `ComputedView` /
  `LayoutedView` to admit stories broke 36 sites across five packages — `model-change/*`, the MCP
  tools, manual-layout snapshots, the aichat guard, `NavigationPanelDropdown`. Almost none of that
  fallout occurs if a story is not a member of those unions.
- **The `bounds: undefined` crash** (fixed in `41bca4a6b`) followed directly from `LayoutedStoryView`
  extending `BaseLayoutedViewProperties`, which requires `bounds: BBox` — a contract a geometry-less
  artifact has no business satisfying. The type system was correctly objecting to the modelling.
- **`ViewManualLayoutSnapshotPerType` needed boundary filtering** so a story could never acquire a
  manual layout, because membership in the view unions admitted it somewhere it does not belong.
- **The `story.scene` / `update.view` split** — described above as the single most important
  constraint in the diagram integration — exists _only_ because a scene change could not be a real
  navigation without polluting browser history.
- **`isStoryView` had to stop reading `context.view`** because `story.scene` overwrites it with the
  scene's view, making the field stale after the first scene. The route says `/view/migration` while
  the canvas shows `cloud_legacy`; that discrepancy required a workaround.

### The alternative

Model a story as a container _above_ views rather than a peer of them, addressed as:

```
/project/cloud-system/story/migration/view/cloud_legacy
```

This is honest about what is on screen — the canvas genuinely renders `cloud_legacy`, within story
`migration`. Three consequences follow:

1. **Scene position becomes deep-linkable.** `/view/migration` cannot express "scene 3 of the
   migration story"; the nested form can.
2. **Scene changes become genuine navigations.** Browser back/forward stepping the story backward and
   forward is then the _correct_ behaviour rather than pollution to be suppressed, and the whole
   `story.scene`-versus-`update.view` apparatus becomes unnecessary.
3. **The view unions stay closed**, so the Task 14 class of fallout does not arise.

### What the alternative costs

Membership in the view unions was not free-riding; it purchased real things. A story outside them
needs a parallel registry (`model.stories`) and its own answers for what `View` currently supplies:
search indexing, the navigation dropdown, `findView`-style lookup, and route generation. Some of that
is rebuilt rather than inherited.

Note that `BaseViewProperties` already isolates most of what genuinely generalises — `id`, `title`,
`description`, `tags`, `links`, `sourcePath` — from what does not (`nodes`, `edges`, `bounds`,
`autoLayout`, `rules`). That split is suggestive: the shared supertype may already exist in all but
name, and the mistake may have been inheriting from the geometry-bearing type rather than the
addressable one.

### Status

Unresolved, and deliberately not retrofitted into this POC. This RFC's stated goal was to establish
whether smooth cross-view transitions are achievable and which `sceneLayout` mode wins; both were
answered. Discovering that the containment model is probably wrong is a second and arguably more
valuable finding, and it warrants its own design pass rather than an amendment to a branch that
already works.

## Rationale and alternatives

### DSL shape

Three shapes were considered.

**Pairwise transitions** — the original sketch, `monolith -[fade]-> microservices`. Echoes
dynamic-view step syntax and makes branching free (two transitions from one source). Rejected
because frames become implicit endpoints of edges, so the story needs a declared entry frame;
linear stories restate every view twice; and the result is a DAG rather than a list, which does
_not_ map onto the existing flow walker without new traversal code.

**Scenes plus separate `transition` blocks** — cleanest separation of "what to show" from "how to
get there", and the most room for per-transition options. Rejected as the most syntax for the
common case, where a transition needs no configuration at all.

**Scene list** — chosen. Ordering is explicit and unambiguous, per-scene narration reads naturally,
branching reuses existing `alt` blocks, and the structure maps directly onto ordered statements
with subflows.

### Correspondence keyword

`split` plus `merge` was considered. Rejected: `becomes` expresses N→M in both directions with one
keyword, and covers rename as the 1→1 case for free.

### Branching model

**Fork prompt** — pause at an `alt` and let the viewer pick a branch. Most faithful to alternative
futures, and rejected for the POC only on cost: it requires a cursor that can be _at_ a fork rather
than at a scene, plus back-stack semantics for returning to the fork. Neither exists today.
Critically, choosing depth-first now does **not** foreclose it — `alt` is already in the parsed
tree, so adding a fork prompt later is a cursor-behaviour change with no DSL change.

**No `alt` at all** — stories always linear, alternatives expressed as separate stories linked by
`navigateTo`. Available today regardless, and recommended for genuinely exclusive futures. Not
chosen as the _only_ mechanism because nothing in the DSL would then declare that two stories are
alternatives of one another.

### Transition styling

The original sketch carried a transition style in the arrow: `-[fade]->`. Under the scene-list
shape this would land as `scene x { transition fade 400ms }`.

Left unspecified on purpose. What a transition should look like is largely determined by
`sceneLayout` mode plus correspondence rules, so fixing an animation vocabulary before those modes
have been seen running would be premature. This is a named extension point.

## Deferred decisions

| Decision                                        | Why deferred                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which `sceneLayout` mode should be the default  | **Closed by Task 13**, observing `examples/cloud-system/story.c4` end to end. `anchored` reduces the _mean_ displacement of a transition's shared elements — confirmed both analytically (`calcSceneOffset` against the real layouted views) and visually in the running dev app — but it is not a uniform per-element win: on `dynamic-view-1 → cloud_next` a tracked shared node travelled 207px under `anchored` vs 240px under `independent` (anchored better, as expected), but on `cloud_legacy → dynamic-view-1`, where two shared elements (`customer`, `cloud`) pull the alignment in different directions, the tracked element travelled _further_ under `anchored` (328px) than under `independent` (243px) — the reverse of the expected direction, because centroid alignment minimises the mean squared displacement across all shared elements, not every individual one. `anchored` stays the default: it never loses in aggregate, and its failure mode (one element among several moving more) is milder than `independent`'s (every shared element jumps by its raw, unrelated layout difference). Open follow-up: whether a smarter alignment (e.g. weighting by element importance, or picking the single best-anchored element instead of the centroid) would fix the conflicting-offset case. |
| `sceneLayout unified` implementation            | The only mode requiring a story-owned layout pass, and the only one that breaks the geometry-less invariant. Needs its own design pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Fork-prompt branch navigation                   | Costs a new cursor concept. Reachable later with no DSL change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Scene-level Next/Previous control pair          | `nextScene()` already falls out of the composite cursor; only the UI is deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Real geometric box-splitting for `becomes`      | Bespoke animation work competing directly with the layout modes that need comparing. The POC pairs fade anchors instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Per-scene `sceneLayout` override (a "hard cut") | No demonstrated need yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Transition styling vocabulary                   | See above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `opt` and `loop`-as-label                       | Clear readings and cheap, but not needed to prove the concept. First candidates after the MVP.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `try` / `catch` / `finally` vocabulary          | The structure fits rollback planning; the programming-borrowed keywords read badly. Decide between reuse and story-native aliases before implementing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `par` / `parallel` rendering                    | Three plausible readings (annotation, composite frame, split screen) with no obvious winner. Needs its own design pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `loop` as generative iteration                  | Would require parameterising a view by element — templating, an order of magnitude larger than the label reading. Explicitly not implied by the keyword.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `break`                                         | Has nothing to say until fork-prompt navigation exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `navigateTo` a story from a relation/step       | Cut during implementation. Two bare cross-reference alternatives (`DynamicViewRef \| StoryViewRef`) are not disambiguable in Langium — the parser always reduces to the first, and `langium generate` gives no warning. The working fix is `value=ViewRef` (`[LikeC4View]`) plus a validation pass re-narrowing to dynamic-or-story targets: the same "admit broadly, validate narrowly" pattern used for `StorySubflow`. Element-level `navigateTo` → story is unaffected and works today.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## MVP scope

**In:**

- Grammar, including the `Id`-rule additions
- `StorySubflow` admitting every `SubflowKind`, with validation gating everything except `alt`
- Core types across parsed, computed, and layouted stages, plus `isStoryView`
- `StoryFlow` and the composite cursor
- `computeStoryView`
- Layouter bypass for stories
- `align.ts`, with `anchored` and `independent` modes both selectable
- Story actor in `packages/diagram`, `story.scene` event, scene resolution and rendering
- Walkthrough panel narration, scene outline list, `StoryWalkthrough` feature flag
- `navigateTo` interception
- The validations listed above
- An example story in `examples/`

**Out, deliberately:**

- Generators (Mermaid, PlantUML, D2, DSL writeback) — `story` will hit `nonexhaustive`; stub it
- Exports (PNG, SVG)
- TextMate grammars for `packages/vscode`, `apps/playground`, `apps/docs`
- MCP server surface, docs site
- `sceneLayout unified`
- Every `SubflowKind` except `alt`'s branches — parsed, then rejected by validation
- `try` / `catch` / `finally` — not admitted by the story grammar at all; fails to parse
- Fork prompts, scene-level controls
- Manual layout for stories (inapplicable by construction)
- A changeset — this is a POC, not a published change

## Testing strategy

- **Grammar fixtures**: story with scenes; story with `alt` and nested scenes; `becomes` in all
  three directions; **and a model using `story`, `scene`, and `becomes` as element names** — the
  `Id`-rule regression.
- **Validation specs**: scene targeting a story (error); empty `alt` (error); story with no scenes
  (warning); `opt` / `par` / `loop` / `break` each **parsing cleanly but failing validation** with
  the "not yet supported" diagnostic — this is what keeps the speculative syntax in this RFC honest.
- **Compute specs and snapshots**: path assignment for flat and nested statements.
- **`StoryFlow.prevAndNext`**: flat scenes; nested `alt`; first and last boundaries.
- **Composite cursor**: traversal into and out of a dynamic scene, in both directions.
- **`align.ts` units**: no shared nodes; exactly one shared node; several shared nodes;
  `independent` mode forcing zero offset.
- **Not covered**: end-to-end Playwright tests.

## Process notes

Two items from `AGENTS.md` that will otherwise cost debugging time:

- Run `pnpm generate` after every edit to `like-c4.langium`.
- Run `pnpm exec tsc --build` after adding core exports, before typechecking downstream.
  `packages/core` is a composite project, and downstream packages read `.d.ts` from
  `packages/core/lib/`; stale declarations produce phantom "Property X does not exist" errors.
