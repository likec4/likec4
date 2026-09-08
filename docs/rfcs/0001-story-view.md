# RFC 0001 — Story views

- **Status**: implemented as a local proof-of-concept, on the `story-view-implementation` branch
- **Date**: 2026-07-30
- **Scope**: a new `story` construct in the LikeC4 DSL, plus the rendering and navigation to make
  it legible. `story` was originally proposed as a fourth `LikeC4View` variant; see
  [Open architectural question — is a story a view?](#open-architectural-question--is-a-story-a-view)
  and `docs/rfcs/0002-story-containment-investigation.md` for why that changed during
  implementation.

## Summary

A **story** shows how an architecture _changes_, by playing an ordered sequence of existing
views. Where a `dynamic view` animates control flow across one static picture, a story animates
across _several_ pictures.

```likec4
stories {
  story migration {
    title 'Migration to microservices'

    scene monolith
    scene strangler
    scene microservices
  }
}
```

Stories reuse the dynamic-view walkthrough panel's Next/Previous UI. A scene may itself be a
dynamic view, in which case its own step-through walkthrough and the story's scene-stepping
render side by side rather than sharing one cursor — see
[The cursor is not a composite type](#the-cursor-is-not-a-composite-type--it-is-two-independent-orthogonal-owners)
below.

## Motivation

LikeC4 describes architecture at rest. Explaining a _migration_ today means authoring several
views and asking the reader to click between them, which loses the two things that make a
migration comprehensible:

1. **Continuity** — which boxes are the same boxes, and which are new.
2. **Ordering** — that these pictures are consecutive states, not alternatives.

A story makes both explicit in the model rather than in a slide deck alongside it.

## Guide-level explanation

### A story is not a view

**Update:** this RFC originally modeled a story as a fourth `LikeC4View` variant, declared inside
`views { }` and served at `/view/$viewId`. That decision was reversed during implementation — see
[Open architectural question — is a story a view?](#open-architectural-question--is-a-story-a-view)
below and `docs/rfcs/0002-story-containment-investigation.md`, which is the resolution and now the
authoritative source for the DSL placement and addressing scheme. The rest of this RFC (grammar,
types, behavior) has been updated to match what shipped; only this section and the "Open
architectural question" section below narrate the change itself.

`story` is declared in its own sibling top-level block, `stories { }`, alongside `views { }` — not
inside it:

```likec4
stories {
  story migration {
    scene monolith
    scene microservices
  }
}
```

A story is addressed by its own id in its own namespace (a `view foo` and a `story foo` may
coexist), reached at `/project/$projectId/story/$storyId/view/$viewId` — the URL is honest about
what is actually on screen: story `$storyId`, currently showing scene `$viewId`. There is no
`/view/$storyId` route; a story is not findable via `model.findView`, does not appear in the
navigation dropdown, and does not participate in `nonexhaustive(view)` dispatch over
`ParsedView`/`ComputedView`/`LayoutedView` — `LikeC4Model` exposes a separate `model.stories()` /
`model.findStory()` registry instead.

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
}

stories {
  story migration {
    title 'Migration to microservices'

    scene monolith {
      notes 'Everything ships together. One database.'
    }

    scene strangler {
      title 'Introduce a facade'
      notes 'Traffic still terminates in the monolith.'
      anchor gateway
    }

    scene microservices {
      title 'Extract the services'
      anchor gateway
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
`anchor <ElementRef>` is new to a scene body — see
[Scene continuity: `anchor`](#scene-continuity-anchor) below.

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

**Update:** `alt` (and its `when`/`if`/`else` branches) shipped in the initial MVP but was pulled
back to "not yet supported" — see `docs/superpowers/plans/2026-08-04-story-scene-anchor.md`'s
"Known limitation" section. The routing/diagram-context identity used to address a scene is
currently the target _view_ id, and `alt` was the only construct that could make a story's
flattened scene list repeat a view id; once that happens, nothing client-observable can tell the
repeated occurrences apart, which silently breaks scene stepping, boundary detection, and per-scene
anchors. `alt` now joins the same "grammar admits it, validation gates it" treatment described
below for `opt`/`par`/`parallel`/`loop`/`break`, pending a design pass on making the scene's own
`StepPath` (not the view id) part of that identity.

### Flow control — speculative

All `SubflowKind` keywords, `alt` included, are grammar-admitted for forward compatibility with
this RFC but validation-gated pending future work. Because `StorySubflow` reuses `SubflowKind`
wholesale, the grammar admits all of them from day one at no cost. The question is which ones
_mean_ anything for a story, and that deserves an answer before any of them are wired up.

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

| Order    | Keyword                     | Rationale                                                                                    |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| Next     | `alt`, `when`, `if`, `else` | Needed for branching; pulled from MVP pending a scene-identity fix (see "Branching," above). |
| Next     | `opt`                       | Clearest narrative reading; reuses collapse-to-skip machinery.                               |
| Next     | `loop` (label only)         | Matches a real migration pattern; cheap as an annotation.                                    |
| Later    | `try` / `catch` / `finally` | Resolve the vocabulary question first.                                                       |
| Later    | `par` / `parallel`          | Resolve the rendering question first.                                                        |
| Deferred | `break`                     | Meaningless until fork prompts exist.                                                        |

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

### Scene continuity: `anchor`

**Update — this section replaces the original design.** This RFC originally proposed a
story-level `sceneLayout: anchored | independent | unified` property, computing an automatic,
implicit centroid-based translation between every consecutive pair of scenes (see
[Rationale and alternatives](#rationale-and-alternatives) below for what that looked like and why
it was replaced). It shipped, was evaluated end to end against the real example, and was then
replaced during implementation by a per-scene, author-declared statement:

```likec4
scene microservices {
  anchor gateway
}
```

`anchor <ElementRef>` means: when this specific scene _occurrence_ is entered, keep
`<ElementRef>`'s on-screen position continuous with wherever it was a moment ago, in the scene the
viewer is coming from. A scene with no `anchor` is a plain crossfade — no attempt at continuity.
This is a strictly more precise replacement for the old `anchored` mode's automatic multi-element
centroid: the author names the one element that matters for a given transition instead of the
mechanism guessing from every element the two scenes happen to share. `independent` survives as
the (now nameless) default behavior of a scene with no `anchor`; `sceneLayout unified` was dropped
entirely rather than carried forward as unimplemented vocabulary — it required a story-owned
layout pass that discarded per-view layout intent, and nothing in the POC demonstrated a need for
it strong enough to justify that cost.

**Mechanism: viewport panning, not geometry offsetting.** The original design translated every
node and edge in the incoming scene by a computed offset — geometry that then had to be
un-translated if the viewer navigated away mid-transition. The shipped mechanism instead pans the
_camera_: `packages/diagram`'s state machine looks up the anchor element's rendered position in
the outgoing scene and its raw position in the incoming scene's own (untouched) layout, and solves
for the viewport `(x, y)` that puts the incoming position at the same screen pixel the outgoing
position occupied a moment ago — holding zoom fixed. Nothing about a scene's own node, edge, or
`bounds` geometry is touched; a scene keeps exactly the layout its own view was already computed
and laid out with. This is the same "translation only, no scale, no rotation" reasoning the
original design used (scaling would render the same element at different sizes across scenes,
which reads as a zoom rather than as continuity) — it now applies to the viewport instead of to
node positions.

**Validation.** A scene with no predecessor (the first scene in a story's flattened traversal
order) that declares `anchor` is a validation error — there is nothing to be continuous _with_.
A scene may declare at most one `anchor`. (The original design additionally specified that the
anchored element must be present in both the scene's own view and its predecessor's view; that
static check was not built — no validation infrastructure exists yet to check an `ElementRef`'s
presence in a specific view's `include` set outside the compute pipeline that already resolves it
at runtime. This is a known gap, not a design decision; see
[Deferred decisions](#deferred-decisions).)

**Known limitation: scene identity is keyed by view id, not by scene occurrence.** The
routing/diagram-context identity used to look up "the scene being entered" is currently the target
_view_ id. A story's flattened scene list can repeat a view id — the only DSL construct that could
do this was `alt` revisiting an already-declared scene from a branch, which is why `alt` is
currently rejected (see [Branching](#branching) above). If a repeated view id ever occurs, nothing
client-observable can tell the occurrences apart, which would silently break scene stepping,
boundary detection, and per-scene anchors. The shipped code fails safe rather than guessing: if a
story's flattened scenes disagree about which anchor applies to a repeated view id, the pan is
skipped and the transition falls back to an ordinary crossfade — and a validation warning flags
any repeated view id so an author sees the risk before it manifests as a visual glitch. The
complete fix requires making a scene's own `StepPath` occurrence — not the view id — the identity
used for routing and diagram context, which touches `packages/diagram`'s public prop contract and
`packages/likec4-spa`'s URL scheme; out of scope here, tracked as future work.

### `navigateTo` inside a story

`navigateTo` is a **route change**: the action button calls `diagram.navigateTo()`, which emits a
`navigateTo` event to whatever consumer supplied the `LikeC4Diagram` component
(`packages/diagram` never calls a router itself — see `AGENTS.md`'s app↔language-server
architecture note). The SPA's page component for a story
(`packages/likec4-spa/src/pages/StoryReact.tsx`) supplies the `onNavigateTo` callback and decides
what a click actually does:

- If the target view **is a scene of the current story**, stay on the same nested
  `/story/$storyId/view/...` route, updating only the `$viewId` param — the story's own
  Previous/Next buttons do the same thing, so a search hit and a manual `navigateTo` click behave
  identically to pressing Next.
- Otherwise, navigate to the flat `/project/$projectId/view/$viewId` route, leaving the story.

The same view can therefore be both a standalone destination and a scene, with the click doing the
right thing in each context.

`navigateTo` also gains stories as a destination:

- From an element — supported via `model.findStory`, since a story is independently addressable
  (see [A story is not a view](#a-story-is-not-a-view) above) even though it is no longer a
  `LikeC4View`.
- From a relation or dynamic-view step — **not supported**, and not attempted: this was originally
  specified as "one grammar line: widen `RelationNavigateToProperty` from `DynamicViewRef` to
  `DynamicViewRef | StoryViewRef`", which turned out to be wrong even when a story was still a
  `LikeC4View` variant — the two alternatives are syntactically identical bare cross-references,
  so Langium/Chevrotain cannot disambiguate them and always reduces to the first. Moving stories
  out of the `LikeC4View` union (RFC 0002) does not change this; it remains cut. See
  [Deferred decisions](#deferred-decisions).

## Reference-level explanation

### Grammar delta

In `packages/language-server/src/like-c4.langium`, as shipped (updated by RFC 0002 and the
anchor design — see [A story is not a view](#a-story-is-not-a-view) and
[Scene continuity: `anchor`](#scene-continuity-anchor) above for why this differs from the
originally specified grammar):

```langium
// `story` is a sibling of `views { }`, not a member of it — see RFC 0002.
ModelStories:
  name='stories' '{' (stories+=StoryView)* '}';

// LikeC4View has only three members; StoryView was removed from this union.
type LikeC4View = ElementView | DynamicView | DeploymentView;

LikeC4ViewRule returns LikeC4View:
  DynamicView | DeploymentView | ElementView;

StoryView:
  'story' name=Id body=StoryViewBody?;

StoryViewBody: '{'
  tags=Tags?
  props+=StoryViewProperty*
  statements+=StoryStatement*
'}';

// No StorySceneLayoutProperty — sceneLayout was dropped entirely, not replaced with an
// equivalent story-level property. ViewProperty alone remains (title, description, etc).
StoryViewProperty:
  ViewProperty;

StoryStatement:
  StoryScene | StoryAlt | StorySubflow;

StoryScene:
  'scene' view=[LikeC4View] body=StorySceneBody? ';'?;

// `anchor` is folded into the same unordered props alternation as the other scene props
// (not a separate ordered slot) — see the anchor design's grammar-ordering finding for why.
StorySceneBody: '{'
  props+=(ViewStringProperty | NotesProperty | StoryAnchorProperty)*
  rules+=StoryCorrespondenceRule*
'}';

StoryAnchorProperty:
  'anchor' ref=ElementRef ';'?;

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

`like-c4.langium`'s `Id` rule (around line 1247) re-admits every keyword as an identifier, with
the comment _"We need to add all the possible terminal values to Id, so that the parser can
accept them as Id (not a bug and not a feature of Langium)"_.

New keywords **must** be added there, or any existing model using `story`, `stories`, `scene`,
`anchor`, or `becomes` as an element name will stop parsing. As shipped:

```langium
Id returns string:
  IdTerminal |
  /* ...existing... */ |
  'story' | 'stories' | 'scene' | 'anchor' | 'becomes';
```

`sceneLayout` is **not** in this list — it was added when `sceneLayout` shipped, then removed
again when the property was deleted; `anchor` and `stories` were added in its place. This is the
single most likely regression in the whole proposal and gets its own test fixture.

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
// StorySceneLayout does not exist — sceneLayout was deleted, not carried as a resolved type.

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
  /** The element to keep visually continuous with the previous scene — see "Scene continuity," above. */
  readonly anchor?: aux.StrictFqn<A>
  /**
   * Path to the AST node relative to the view body ast.
   * Used to locate the scene in the source code. Mirrors `Step.astPath`.
   */
  readonly astPath: string
}

/**
 * Block kinds a story may contain. None are implemented yet — all are parsed for forward
 * compatibility and rejected by validation, including `alt` (see "Branching," above).
 * `parallel` normalises to `par`, exactly as dynamic views do.
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
  readonly statements: AnyStoryStatement<A>[]
}
```

**Update:** `ParsedStoryView` no longer extends `BaseParsedViewProperties` and is not a member of
the `ParsedView` union — see [A story is not a view](#a-story-is-not-a-view). As shipped,
`ComputedStoryView` and `LayoutedStoryView` extend `BaseViewProperties` directly (not
`BaseComputedViewProperties` / `BaseLayoutedViewProperties`), so they carry no `nodes`, `edges`,
`autoLayout`, or `bounds` at all — not empty arrays standing in for geometry a story doesn't have,
but no geometry fields in the type. This is the fix for the `bounds: undefined` crash discussed in
[Open architectural question — is a story a view?](#open-architectural-question--is-a-story-a-view)
below: the original design's "empty `nodes`/`edges`" was still committing to the geometry-bearing
shape; leaving the union entirely means there is no contract to violate.

`ComputedStoryScene` (the resolved form of `StoryScene` once views are computed) additionally
carries an `id: scalar.StepPath` — the scene's own occurrence identity, distinct from `view` (the
target view id) — and an optional `branchTitle: string`, populated only inside an `alt` branch
(currently dormant; see [Branching](#branching)). `ComputedStoryView`/`LayoutedStoryView` add a
flat `scenes: ReadonlyArray<ComputedStoryScene>` list in depth-first traversal order and a
`storyFlow` tree that preserves `alt` blocks for the outline panel.

The `scenes` list is an array rather than a map keyed by path, because traversal order is the thing
consumers need: `prevAndNext` is an index step over it, so `computeStoryView` flattens once and
`StoryFlow` derives its own path→index lookup. Scene paths remain hierarchical (`scalar.StepPath`
format) and unique, so a map is recoverable whenever one is wanted. `id` exists on
`ComputedStoryScene` precisely so a per-occurrence lookup is _possible_ — the known limitation
described in [Scene continuity](#scene-continuity-anchor) above is that the diagram/routing layer
does not yet use it as the addressing key, not that the identity is unavailable.

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

### The cursor is not a composite type — it is two independent, orthogonal owners

**Update:** this RFC originally proposed a single `StoryCursor { scene, innerStep }` type, owned
by a dedicated story actor, composing scene-stepping and inner-dynamic-view-stepping into one
value with one `next()`/`prev()` that decided which to advance. That actor was deleted during
implementation (see [Diagram integration](#diagram-integration) below) once scene stepping became
a real route navigation rather than actor-owned state:

- **The scene cursor is the route's own `$viewId` param.** `packages/likec4-spa`'s
  `/story/$storyId/view/$viewId` route (RFC 0002) already has to track "which scene" as its URL
  parameter for deep-linking and browser back/forward to work at all; a separate cursor value
  would just be a second, redundant source of truth for the same fact. Pressing the story's own
  Next/Previous calls `diagram.navigateTo()` — a real navigation, not a cursor mutation.
- **The inner-step cursor is unchanged, pre-existing dynamic-view walkthrough state** — the same
  mechanism a dynamic view already uses outside a story, tracking `activeWalkthrough.stepId` over
  the current view's edges. A story scene that happens to be a dynamic view does not get a
  story-specific inner cursor; it gets the same walkthrough state any dynamic view gets.

These two are independent because nothing requires them to be composed: the scene-view boundary is
now a route boundary, and the dynamic-view walkthrough already resets its own step state when its
target view changes. The two control pairs render side by side rather than as one merged
Next/Previous — see [Dual walkthrough controls](#dual-walkthrough-controls) below — which is the
concrete, user-visible consequence of not composing them into one cursor.

### Compute

`packages/core/src/compute-view/story-view/compute.ts` exports `computeStoryView`:

1. Resolve each scene's view reference; reject stories (defence in depth — the LSP validation is
   the primary gate).
2. Assign `StepPath` ids by walking statements, mirroring how dynamic-view steps are numbered.
3. Resolve `becomes` and `anchor` FQNs through the model.
4. Return a `ComputedStoryView`. It has no `nodes`/`edges` fields at all (see
   [Core types](#core-types) above), not empty arrays standing in for them.

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

**Update:** `packages/core/src/story/align.ts` — described here in the original design as pure,
unit-tested centroid math over two position maps — was deleted along with `sceneLayout` (and its
sibling `resolveScene.ts`); `packages/core/src/story/` no longer exists. The replacement mechanism
lives entirely in `packages/diagram` (viewport panning, not position-map math) and is described in
full in [Scene continuity: `anchor`](#scene-continuity-anchor) above — that section is the current
source of truth for how continuity is computed. Nothing in `packages/core` computes an alignment
offset any more; `computeStoryView` resolves an `anchor` to an FQN and stops there.

### Diagram integration

The `packages/diagram` guidance in `AGENTS.md` is that a new feature gets a sibling folder with its
own actor, promoted into `likec4diagram/` only when it must coordinate with the main machine. This
RFC originally proposed exactly that — a dedicated story actor owning a composite cursor — and it
was deleted during implementation once scene stepping became a real route navigation with no
actor-owned state left to justify one (see
[The cursor is not a composite type](#the-cursor-is-not-a-composite-type--it-is-two-independent-orthogonal-owners)
above). As shipped:

- **No story actor exists.** Story-related UI lives as plain components under
  `packages/diagram/src/navigationpanel/walkthrough/` (`StoryControls.tsx`,
  `storyScenePosition.ts`), reading `context.story` and `context.view.id` — both already supplied
  to `LikeC4Diagram` by its consumer — through a pure, stateless lookup rather than an actor.
- **No `story.scene` event exists.** A search of `packages/diagram/src` turns up zero references.
  Next/Previous call `diagram.navigateTo()`, the same `DiagramApi` method any other navigation
  uses, which emits the ordinary `navigateTo` event the consumer's `onNavigateTo` already handles
  (see [`navigateTo` inside a story](#navigateto-inside-a-story) above). The original concern this
  event was invented to solve — "reusing `update.view` would pollute browser history on every
  Next press" — is resolved differently: the consumer's `onNavigateTo` decides whether a click
  stays nested (same route, new `$viewId` param — one history entry per step, which is the
  _correct_, wanted behavior for a deep-linkable story, not pollution) or leaves the story
  entirely, per RFC 0002's containment model.
- **Scene resolution** goes through `useLikeC4Model` and `context.story`, exactly as originally
  specified. What happens next differs: no alignment offset is computed or applied before
  `convertToXYFlow` — a scene's nodes/edges are converted and rendered exactly as its own view
  computed and laid them out, and continuity (when `anchor` is declared) is achieved by panning
  the viewport afterward, not by moving anything the layout produced.
- **Panel** reuses `WalkthroughPanel` for `title` and `notes`. A `StoryWalkthrough` feature flag
  (`enableStoryWalkthrough` on `LikeC4Diagram`) sits beside `DynamicViewWalkthrough`
  (`enableDynamicViewWalkthrough`), as specified.
- **`navigateTo` interception** moved from the (deleted) story actor to the SPA consumer layer —
  see [`navigateTo` inside a story](#navigateto-inside-a-story) above for the current mechanism.

#### Dual walkthrough controls

Not originally specified: a story scene that is itself a dynamic view can have its own
step-through walkthrough active _while_ the story's own scene-stepping controls are also live —
the two are orthogonal (one steps edges within a view, the other steps scenes across views), so
neither should hide the other. `NavigationPanel.tsx` models this as a fourth mode,
`walkthrough-in-story`, alongside the original `default` / `walkthrough-flow` / `walkthrough`:

```ts
export type NavigationPanelMode =
  | 'default'
  | 'walkthrough-flow'
  | 'walkthrough'
  | 'walkthrough-in-story' // dynamic-view walkthrough active while inside a story scene
```

selected whenever `s.story != null` and a dynamic-view walkthrough is active, and rendering both
control sets together:

```tsx
{
  mode === 'walkthrough-in-story' && (
    <>
      <ActiveWalkthroughControls />
      <StoryControls key="story-controls" />
    </>
  )
}
```

gated behind `resolveMode(selectedMode, enableStoryWalkthrough)` so it only ever activates when
the consumer opted into `enableStoryWalkthrough` in the first place. The two pairs are made
visually unambiguous rather than relying on position alone: the story's own Previous/Next are
grape-colored and read "Previous Scene" / "Next Scene"; the dynamic view's own Previous/Next keep
their existing (Mantine theme-default indigo) color and read "Previous Step" / "Next Step".

Both pairs disable at their own boundaries, matching how a plain dynamic-view walkthrough already
behaves outside a story: the story's Previous/Next are `disabled` when there is no
previous/next entry in `story.scenes` at the current index; the dynamic view's Previous/Next are
`disabled` when the current step is the first/last edge in `xyedges`. Neither reads the other's
boundary.

#### Sidebar integration

Also not originally specified: the SPA's single-project-mode sidebar view list
(`packages/likec4-spa/src/components/sidebar/`) lists stories alongside views, each with a
distinct icon (`IconBook2`, versus the dashboard/stack icons already used for views and deployment
views). Since a story and a view may share an id (RFC 0002 §5's namespace decision), the sidebar's
tree-node identity is namespaced (`story:<id>`) to avoid colliding with a same-named view's node.
Not wired into multi-project mode as of this writing.

### Transition rendering

Node identity across scenes is already stable. Interpolation for the _anchored_ case is the
viewport pan described in [Scene continuity](#scene-continuity-anchor) above, which is confirmed
built and working. **Unverified as of this writing:** the transient CSS transition on node
transform originally specified here, for smoothing a non-anchored scene's crossfade —
`packages/diagram/src/styles-xyflow.css` is still a bare `@import` with no node-transform rules,
and no crossfade-specific animation code was found elsewhere in `packages/diagram/src` during this
update. Whether a non-anchored transition currently reads as an abrupt cut or an acceptable plain
crossfade (XYFlow's own re-render) has not been re-verified against the shipped code; treat this
paragraph as the original design intent, not a confirmed-shipped fact, until someone checks.

`becomes` feeds this pairing: a source node's exit is anchored to the bounding box of its targets,
so it visibly divides toward them, and the targets enter from that same box. This part is also
unverified against the shipped code for the same reason.

### Validations

| Check                                                                      | Severity                                                         | Location        |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| `scene` targets a story (no nested stories)                                | error (Langium's own, not custom)                                | language-server |
| `alt` (any use at all, well-formed or not)                                 | error — "not yet supported in stories"                           | language-server |
| Block kind not yet implemented (`opt`, `par`, `parallel`, `loop`, `break`) | error — "not yet supported in stories"                           | language-server |
| `alt` branch is not a `when` / `if` / `else` block                         | error                                                            | language-server |
| `anchor` on a scene with no predecessor (first in traversal order)         | error                                                            | language-server |
| More than one `anchor` on the same scene                                   | error                                                            | language-server |
| A scene's view id repeats an earlier scene's view id                       | warning (dormant fail-safe)                                      | language-server |
| Story has no scenes                                                        | warning                                                          | language-server |
| Two stories share the same id                                              | error                                                            | language-server |
| `becomes` refs absent from the adjacent scenes                             | deferred — needs computed views                                  | —               |
| `anchor` ref present in both the scene's own and predecessor's view        | **not built** — see [Scene continuity](#scene-continuity-anchor) | —               |

`scene` targeting a story used to be a custom check (rejecting `scene x` where `x` is a story).
Since stories moved out of the `LikeC4View` union (RFC 0002), `StoryScene.view=[LikeC4View]` can
structurally no longer resolve to a story at all — `scene other` naming a story fails to link,
surfacing Langium's own "Could not resolve reference to LikeC4View named '...'" diagnostic
instead. Still an error; no longer a custom one, and the custom check would now be dead code.

## Drawbacks

- **Not a view, but still view-adjacent.** RFC 0002 resolved the "is a story a view?" question by
  moving it out of the `LikeC4View` union (see below), which closed most of the original "fourth
  view type" cost — but generators, exporters, and any other `nonexhaustive(view)`-style dispatch
  that was written assuming views are the only addressable-diagram-thing still need to _know_
  stories exist and choose to ignore them, rather than the type system forcing the question.
- **No single image.** A story cannot be exported to PNG or SVG, cannot be emitted as Mermaid,
  PlantUML, or D2, and has no sensible representation in any of the existing generators. Stories
  are a viewer-only artifact.
- **`alt` is currently unavailable, not just discouraged.** The original concern here — that
  depth-first `alt` traversal may mislead a viewer into thinking "alternative" means
  "sequential" — is moot for now: `alt` is rejected by validation entirely (see
  [Branching](#branching) above), pending the scene-identity fix. If and when `alt` returns, this
  concern returns with it.
- **A story couples views.** Renaming or deleting a view breaks any story referencing it. This is
  no worse than `navigateTo` or `extends`, but it widens the blast radius of a view rename.
- **Duplicated tree-walk.** `StoryFlow` repeats traversal logic that `walkthroughFlow` already
  implements, deliberately, to avoid refactoring a snapshot-tested file during a POC.

## Open architectural question — is a story a view?

**Resolved.** This was the most significant unresolved question raised by the original POC, and
the resolution shipped: `docs/rfcs/0002-story-containment-investigation.md` recommended
"Candidate B" — a story as a _parallel, addressable registry_ rather than a `LikeC4View` member —
and that is what the codebase now has (see [A story is not a view](#a-story-is-not-a-view) at the
top of this document, and every "Update" note throughout this RFC). This section is kept as the
historical record of _why_: it is the analysis that motivated RFC 0002, not a still-open question.

This RFC originally decided a story _is_ a view: `_type: 'story'`, a `ViewId`, served at
`/view/$viewId`. The reasoning was routing convenience — search indexing, the navigation dropdown,
and `model.findView` all come free. That reasoning held on paper, but the cost turned out to be
much larger than anticipated, and it is concentrated in exactly the places the implementation went
wrong:

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

### The alternative — what shipped

Model a story as a container _above_ views rather than a peer of them, addressed as:

```
/project/cloud-system/story/migration/view/cloud_legacy
```

This is honest about what is on screen — the canvas genuinely renders `cloud_legacy`, within story
`migration`. Three consequences followed, all now real rather than hypothetical:

1. **Scene position is deep-linkable.** `/view/migration` could not have expressed "scene 3 of the
   migration story"; the nested form does, for free — it's just the route.
2. **Scene changes are genuine navigations.** Browser back/forward stepping the story backward and
   forward is the _correct_ behaviour, not pollution to be suppressed, and the whole
   `story.scene`-versus-`update.view` apparatus this RFC originally specified turned out to be
   unnecessary — it was deleted rather than built out further (see
   [Diagram integration](#diagram-integration) above).
3. **The view unions stay closed**, so the Task 14 class of fallout did not recur for this change.

### What the alternative cost

Membership in the view unions was not free-riding; it purchased real things, and a story outside
them needed its own answers, some rebuilt rather than inherited: a parallel registry
(`model.stories()` / `model.findStory()`) in place of `model.findView`, its own route tree instead
of participating in the existing view route, and — as of this update — no wiring into the SPA's
search index or multi-project-mode view list at all (the single-project sidebar addition mentioned
in [Diagram integration](#diagram-integration) above is a first, partial, single-project-only step
toward parity, not full parity).

`BaseViewProperties` already isolated most of what genuinely generalises — `id`, `title`,
`description`, `tags`, `links`, `sourcePath` — from what does not (`nodes`, `edges`, `bounds`,
`autoLayout`, `rules`), which is exactly the split `ComputedStoryView`/`LayoutedStoryView` now use
by extending `BaseViewProperties` directly (see [Core types](#core-types) above) — the shared
supertype existed already; the fix was inheriting from the addressable type instead of the
geometry-bearing one.

### Status

Resolved. See `docs/rfcs/0002-story-containment-investigation.md` for the full decision record
(candidates considered, the exact DSL and routing shape chosen, and an implementation record
confirming what shipped) and [A story is not a view](#a-story-is-not-a-view) at the top of this
document for the current, load-bearing summary.

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

Left unspecified on purpose. What a transition should look like is largely determined by whether
a scene declares `anchor` plus correspondence rules, so fixing an animation vocabulary before that
mechanism had been seen running would have been premature. This is a named extension point.

## Deferred decisions

| Decision                                                          | Why deferred                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scene-identity fix (`StepPath`, not view id, as the routing key)  | The complete fix for the known limitation that repeated view ids can't be told apart (see "Scene continuity: `anchor`," above). Touches `packages/diagram`'s public prop contract and `packages/likec4-spa`'s URL scheme; a real design pass, not a patch.                                                                                                        |
| Static check: `anchor` ref present in both scenes' views          | Specified in the anchor design but not built — no validation infrastructure exists to check an `ElementRef`'s presence in a specific view's resolved `include` set outside the compute pipeline. A real (if currently unenforced) gap; see "Validations," above.                                                                                                  |
| Smarter-than-centroid alignment                                   | Moot as originally framed — the centroid-vs-single-element tradeoff was about the deleted `sceneLayout: anchored` mode. `anchor` already lets an author pick the single element that matters, which was the "smarter" option under consideration.                                                                                                                 |
| Fork-prompt branch navigation                                     | Costs a new cursor concept. Reachable later with no DSL change, once `alt` itself returns (see "Branching," above).                                                                                                                                                                                                                                               |
| Real geometric box-splitting for `becomes`                        | Bespoke animation work. The POC pairs fade anchors instead — see "Transition rendering"'s unverified status, above.                                                                                                                                                                                                                                               |
| Transition styling vocabulary                                     | See "Transition styling," below.                                                                                                                                                                                                                                                                                                                                  |
| `opt` and `loop`-as-label                                         | Clear readings and cheap, but not needed to prove the concept. First candidates after the MVP.                                                                                                                                                                                                                                                                    |
| `try` / `catch` / `finally` vocabulary                            | The structure fits rollback planning; the programming-borrowed keywords read badly. Decide between reuse and story-native aliases before implementing.                                                                                                                                                                                                            |
| `par` / `parallel` rendering                                      | Three plausible readings (annotation, composite frame, split screen) with no obvious winner. Needs its own design pass.                                                                                                                                                                                                                                           |
| `loop` as generative iteration                                    | Would require parameterising a view by element — templating, an order of magnitude larger than the label reading. Explicitly not implied by the keyword.                                                                                                                                                                                                          |
| `break`                                                           | Has nothing to say until fork-prompt navigation exists.                                                                                                                                                                                                                                                                                                           |
| `navigateTo` a story from a relation/step                         | Cut during implementation. Two bare cross-reference alternatives (`DynamicViewRef \| StoryViewRef`) are not disambiguable in Langium — the parser always reduces to the first, and `langium generate` gives no warning. Moving stories out of the `LikeC4View` union (RFC 0002) does not change this. Element-level `navigateTo` → story works today, unaffected. |
| Full parity with views in the SPA (search, multi-project sidebar) | The single-project sidebar addition (see "Diagram integration," above) is a first step, not full parity — search indexing and multi-project-mode's view list still don't know stories exist.                                                                                                                                                                      |

## MVP scope

**In, as shipped (differs from the original spec in several places — each is cross-referenced
above):**

- Grammar, including the `Id`-rule additions — `story`/`stories`/`scene`/`anchor`/`becomes`, not
  `sceneLayout`
- A sibling `stories { }` block, not a `StoryView` member of `LikeC4View` (RFC 0002)
- `StorySubflow` admitting every `SubflowKind`, with validation gating all of them, `alt` included
  (`alt` shipped in the initial MVP but was pulled back to "not yet supported" — see "Branching," above)
- Core types across parsed, computed, and layouted stages, extending `BaseViewProperties` directly
  rather than the geometry-bearing computed/layouted supertypes
- `StoryFlow`; no composite cursor type (the route is the scene cursor — see "The cursor is not a
  composite type," above)
- `computeStoryView`, including `anchor` resolution
- Layouter bypass for stories
- Per-scene `anchor <ElementRef>` and its viewport-pan mechanism in `packages/diagram` — not
  `align.ts`/`sceneLayout`, which were built first, evaluated, and then deleted
- Scene resolution and rendering as plain components, not a dedicated story actor; no `story.scene`
  event
- Walkthrough panel narration, scene outline list, `StoryWalkthrough` feature flag
  (`enableStoryWalkthrough`), plus dual walkthrough controls (`walkthrough-in-story` mode) and
  boundary-disabled Previous/Next — neither originally specified
- `navigateTo` interception, at the SPA consumer layer rather than inside a diagram-level actor
- The validations listed above, including two (anchor-on-first-scene, one-anchor-max) not in the
  original spec, and one specified but not built (anchor-present-in-both-views)
- An example story in `examples/`
- A single-project-mode sidebar entry with its own icon — not originally specified

**Out, deliberately:**

- Generators (Mermaid, PlantUML, D2, DSL writeback) — `story` will hit `nonexhaustive`; stub it
- Exports (PNG, SVG)
- TextMate grammars for `packages/vscode`, `apps/playground`, `apps/docs`
- MCP server surface, docs site
- `sceneLayout unified` — and the rest of `sceneLayout` with it; there is no story-level layout
  property at all any more, resolved or otherwise
- Every `SubflowKind`, `alt`'s branches included — parsed, then rejected by validation
- `try` / `catch` / `finally` — not admitted by the story grammar at all; fails to parse
- Fork prompts, scene-level controls
- Manual layout for stories (inapplicable by construction)
- Multi-project-mode sidebar/view-list integration, and search indexing, for stories
- A changeset — this is a POC, not a published change

## Testing strategy

- **Grammar fixtures**: story with scenes; story with `alt` and nested scenes; `becomes` and
  `anchor` in a scene body; **and a model using `story`, `stories`, `scene`, `anchor`, and
  `becomes` as element names** — the `Id`-rule regression.
- **Validation specs**: scene targeting a story (Langium's own unresolved-reference error, not a
  custom check — see "Validations," above); story with no scenes (warning); `alt` (any use,
  well-formed or not) / `opt` / `par` / `loop` / `break` each **parsing cleanly but failing
  validation** with the "not yet supported" diagnostic — this is what keeps the speculative syntax
  in this RFC honest; `anchor` on a scene with no predecessor (error); more than one `anchor` on
  one scene (error); a repeated view id across a story's flattened traversal (warning).
- **Compute specs and snapshots**: path assignment for flat and nested statements; `anchor` FQN
  resolution.
- **`StoryFlow.prevAndNext`**: flat scenes; nested `alt`; first and last boundaries.
- **Anchor viewport-pan units** (`packages/diagram`): no anchor declared (plain crossfade); anchor
  resolves cleanly; the fail-safe when a repeated view id's occurrences disagree on `anchor`
  (falls back to fit-to-bounds rather than guessing).
- **Not covered**: end-to-end Playwright tests. Also not independently re-verified during this
  update: the non-anchored crossfade's visual quality and the `becomes` box-splitting animation —
  see "Transition rendering," above.

## Process notes

Two items from `AGENTS.md` that will otherwise cost debugging time:

- Run `pnpm generate` after every edit to `like-c4.langium`.
- Run `pnpm exec tsc --build` after adding core exports, before typechecking downstream.
  `packages/core` is a composite project, and downstream packages read `.d.ts` from
  `packages/core/lib/`; stale declarations produce phantom "Property X does not exist" errors.
