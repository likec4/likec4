# RFC 0002 — Story containment investigation

- **Status**: investigation, no code changes
- **Date**: 2026-08-03
- **Scope**: answer RFC 0001's "is a story a view?" question with a concrete design proposal
- **Constraint**: this document is analysis only; nothing in `packages/*` was modified to produce it

## Summary

RFC 0001 shipped a working `story` view type by making `_type: 'story'` a member of `ParsedView` /
`ComputedView` / `LayoutedView`, so a story is addressed exactly like any other view
(`/view/$viewId`), found via `LikeC4Model.findView`, and listed in search and the navigation
dropdown "for free." RFC 0001's own retrospective section ("Open architectural question — is a
story a view?") suspected this was the wrong call and estimated the cost at 36 union-widening
breakages across five packages, a `bounds: undefined` crash, a manual-layout filtering pass, and a
bespoke `story.scene` event invented solely to avoid a browser-history side effect.

Direct code reading confirms the retrospective's diagnosis and sharpens it: the actual mistake is
narrower than "story is a view." `BaseViewProperties` (`packages/core/src/types/view-common.ts:94`)
already isolates exactly the addressability-shaped fields a story needs — `id`, `title`,
`description`, `tags`, `links`, `order`, `sourcePath` — with no geometry. The union-widening pain
comes entirely from `ComputedStoryView` and `LayoutedStoryView` extending `BaseComputedViewProperties`
/ `BaseLayoutedViewProperties`, the geometry-bearing supertypes, instead of `BaseViewProperties`
directly. This codebase already has a clean, working precedent for the fix: `ComputedProjectsView`
and `LayoutedProjectsView` (`packages/core/src/compute-view/projects-view/_types.ts:34-48`) extend
`BaseViewProperties<any>` directly, are never members of `ComputedView`/`LayoutedView`, and cause
none of RFC 0001's fallout.

This document recommends pulling story out of the `ParsedView`/`ComputedView`/`LayoutedView`
unions and the langium `LikeC4View` AST union, giving it a parallel `model.stories` registry and a
nested route (`/project/$projectId/story/$storyId/view/$viewId`), while leaving the story's own
traversal/alignment/cursor logic — which never touched those unions in the first place — untouched.
It also identifies a real, additional fix required that RFC 0001 did not name: the language-server's
`doc.c4Views` parser sink and `ModelLocator.locateViewAst` conflate "addressable by view id" with
"is a langium `LikeC4View` AST node," one layer below the core-type unions, and cause their own
independent fallout (the `NonStoryLikeC4View` guards in `packages/language-server/src/model-change/`)
that a core-type-only fix would not dissolve.

## 1. What view-membership actually buys

Every row below was traced to the code that actually consumes it, not assumed from the RFC's prose.

| Consumer                                        | Mechanism (file:line)                                                                                                                                                                                                                                                                                                                                                              | Needs from story                                                                                                                                                                                                                                                                                              | Needs it _as a view_?                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search sidebar "Views" column                   | `packages/diagram/src/search/components/ViewsColum.tsx:41-51` iterates `likec4model.views()`; icon at `:162-166` is a binary `_type === 'deployment'` switch with **no story branch and no `nonexhaustive`**                                                                                                                                                                       | Nothing in practice — this column only lists views that _include_ the currently-selected element (`element.views()`), and a story's `nodes`/`edges` are always empty, so a story can never appear here. Confirms geometry-emptiness silently protects some consumers rather than requiring explicit handling. | No                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Navigation dropdown — search results            | `packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx:157-185`, filters `likec4model.views()` by id/title substring                                                                                                                                                                                                                                                    | Yes — a story should be findable by title                                                                                                                                                                                                                                                                     | Only needs `id`/`title` (`BaseViewProperties`), not geometry                                                                                                                                                                                                                                                                                                                                                                             |
| Navigation dropdown — folder columns & icon     | `NavigationPanelDropdown.tsx:388-431` (`ColumnItem`/`folderColumn`), `:365-376` (`ViewTypeIcon`), `:396-402` (`ColumnItem['viewType']`) — commit `813e0e19d` had to add a `'story'` case to both, purely to keep `tsc --build` green after the union widened                                                                                                                       | Yes — a story should be listed and grouped by folder                                                                                                                                                                                                                                                          | Only needs `id`/`title`/`description`/`_type` for the icon; never touches `nodes`/`edges`                                                                                                                                                                                                                                                                                                                                                |
| Search sidebar (element→views)                  | `packages/diagram/src/search/components/PickView.tsx:8,27-30` — same `LikeC4ViewModel` iteration                                                                                                                                                                                                                                                                                   | Same as above — inert for the same reason                                                                                                                                                                                                                                                                     | No                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `LikeC4Model.findView`/`view`/`_views`          | `packages/core/src/model/LikeC4Model.ts:86` (`_views` map), `:267-279` (population loop, wraps every `$data.views` entry in a `LikeC4ViewModel`), `:517-531` (`view`/`findView`)                                                                                                                                                                                                   | This is the mechanism everything above actually rides on                                                                                                                                                                                                                                                      | Membership in `$data.views` (i.e. `ComputedView`/`LayoutedView`), yes — but only because there is no sibling `$data.stories` map for `LikeC4Model` to also wrap                                                                                                                                                                                                                                                                          |
| `LikeC4ViewsFolder` grouping/breadcrumbs        | `packages/core/src/model/view/LikeC4ViewsFolder.ts:1-90`                                                                                                                                                                                                                                                                                                                           | Folder grouping by path, for nav/search                                                                                                                                                                                                                                                                       | Built entirely from `id`/`title`/path; never reads `nodes`/`edges`/`bounds`                                                                                                                                                                                                                                                                                                                                                              |
| Route lookup / current-view hook                | `packages/likec4-spa/src/routes/project.$projectId/view.$viewId.tsx`, `view.$viewId.index.tsx`; `packages/likec4-spa/src/hooks.ts:46-84` (`useCurrentViewId`, `useCurrentView` → `findView(viewId)?.$layouted`)                                                                                                                                                                    | Needs id-based lookup and, today, a fully `LayoutedView`-shaped object to hand to `<LikeC4Diagram view={...}>`                                                                                                                                                                                                | This is the one place a story is asked to _produce a geometry-shaped value it doesn't have_, and is the direct cause of the `bounds: undefined` crash (see below)                                                                                                                                                                                                                                                                        |
| `LikeC4Diagram`'s `view` prop                   | `packages/diagram/src/LikeC4Diagram.tsx:141` dereferences `view.bounds.width * view.bounds.height` unconditionally                                                                                                                                                                                                                                                                 | Nothing — a story is never itself the thing rendered on canvas; only its _scenes_ (ordinary views) are                                                                                                                                                                                                        | No — this is pure cost. Fixed by fabricating `zeroBounds` in `packages/layouts/src/graphviz/GraphvizLayoter.ts` (commit `0b0a03c47`) rather than by never needing `bounds` at all                                                                                                                                                                                                                                                        |
| MCP tools                                       | `packages/mcp/src/tools/_common.ts:264`, `read-project-summary.ts:157`, `read-view.ts:141` — enum widened `'element'\|'deployment'\|'dynamic'` → `+ 'story'` (commit `f5d917a27`)                                                                                                                                                                                                  | Nothing — MCP is an explicit RFC 0001 non-goal                                                                                                                                                                                                                                                                | No — pure cost, zero benefit                                                                                                                                                                                                                                                                                                                                                                                                             |
| Generators (Mermaid/PlantUML/D2/DSL writeback)  | `packages/generators/src/likec4/operators/views.ts`'s `storyView` operator, added in `8de72b1f1`, which only throws `"not supported (POC scope)"`                                                                                                                                                                                                                                  | Nothing — generators are an explicit non-goal                                                                                                                                                                                                                                                                 | No — pure cost, zero benefit                                                                                                                                                                                                                                                                                                                                                                                                             |
| `model-change/*` (style/layout edits)           | `changeElementStyle.ts:71`, `changeViewLayout.ts:23`, `viewChange.ts:25,45-48` — `invariant(!ast.isStoryView(viewAst), ...)` guards, and a hand-rolled `NonStoryLikeC4View = Exclude<ast.LikeC4View, ast.StoryView>` type                                                                                                                                                          | Nothing — model-change (in-editor style/layout mutation) is meaningless for a story                                                                                                                                                                                                                           | No — and this fallout is **not** caused by the core-type unions at all (see §5); it comes from `ModelLocator.locateViewAst` (`packages/language-server/src/model/model-locator.ts:187-210`) iterating the single `doc.c4Views` array that `ViewsParser.parseViews()` (`.../model/parser/ViewsParser.ts:48-68`) pushes both ordinary views and stories into                                                                               |
| Manual-layout snapshots                         | `packages/language-server/src/model/model-builder.ts`'s `excludeStoryManualLayouts` (commit `3b56756a7`)                                                                                                                                                                                                                                                                           | Nothing — "manual layout is inapplicable to a story by construction" per RFC 0001                                                                                                                                                                                                                             | No — pure cost, zero benefit                                                                                                                                                                                                                                                                                                                                                                                                             |
| AI chat `read-ui-state`                         | `packages/likec4-spa/src/aichat/useChat.tsx:69-75` — explicit `throw` for `view._type === 'story'` (commit `34d45800b`)                                                                                                                                                                                                                                                            | Nothing — an explicit non-goal                                                                                                                                                                                                                                                                                | No — pure cost, zero benefit                                                                                                                                                                                                                                                                                                                                                                                                             |
| "Is the diagram currently showing a story" flag | `packages/diagram/src/likec4diagram/state/machine.state.navigating.ts:30-36` documents that `context.view._type === 'story'` **stopped being a reliable signal** once `story.scene` (a Task-10-era workaround) started overwriting `context.view` with the scene's own view. The fix was a dedicated `context.activeStoryCursor` field, checked via `system.get('story')` instead. | A reliable "am I in a story" signal                                                                                                                                                                                                                                                                           | **No, and this is the sharpest finding in this section**: the union-membership shortcut (read `_type` off the thing already in `context.view`) looked free but was wrong, and had to be replaced by a dedicated field anyway. A standalone story concept would have needed that dedicated field from day one — so this specific "benefit" of view-membership was never real; it was a trap that cost an extra bug-fix cycle to discover. |
| The story's own traversal/alignment engine      | `packages/core/src/story/` (cursor, align.ts), `StoryFlow` (`packages/core/src/types/view-story-flow.ts`), `computeStoryView` (`packages/core/src/compute-view/story-view/compute.ts`), the story XState actor (`packages/diagram/src/story/actor.ts`)                                                                                                                             | —                                                                                                                                                                                                                                                                                                             | **Needs nothing from view-membership.** None of this code reads `ParsedView`/`ComputedView`/`LayoutedView`, `LikeC4Model.findView`, or any union-widened site. It operates entirely over `ComputedStoryScene`/`StepPath`/`ComputedStoryView`'s own bespoke fields (`scenes`, `storyFlow`). This is the substance of the RFC 0001 POC, and it is untouched by anything proposed below.                                                    |

**Conclusion of §1**: every consumer that genuinely benefits from story being _addressable_ only
ever touches `id`/`title`/`description`/`tags`/`links`/`order` — exactly `BaseViewProperties`. Every
consumer forced to change and gaining nothing (MCP, generators, manual-layout, aichat, model-change)
was forced to change because story inherited the _geometry_ half of the view hierarchy
(`nodes`/`edges`/`bounds`/`autoLayout`/hash/notation), not the addressable half. The one place a
real bug resulted (`bounds: undefined`) is the one place a story was asked to _stand in for a view
in the diagram-rendering pipeline_, which is a rendering-integration necessity, not a
search/navigation/routing necessity.

## 2. The addressability/geometry seam already exists

`packages/core/src/types/view-common.ts:94-107`:

```ts
export interface BaseViewProperties<A extends AnyAux> extends aux.WithOptionalTags<A>, aux.WithOptionalLinks {
  readonly id: aux.StrictViewId<A>
  readonly title: string | null
  readonly description: scalar.MarkdownOrString | null
  readonly order?: number
  readonly sourcePath?: string | undefined
}
```

Pure addressability. No geometry. `BaseParsedViewProperties` (`view-common.ts:109-120`) adds only
`[_stage]` and `docUri` — still source-location metadata, not geometry.

The geometry is added one level down, and only there:

- `BaseComputedViewProperties` (`packages/core/src/types/view-computed.ts:129-138`) adds
  `autoLayout`, `nodes`, `edges`, `hasManualLayout`, plus `ViewWithHash`/`ViewWithNotation`.
- `BaseLayoutedViewProperties` (`packages/core/src/types/view-layouted.ts:78-101`) adds a
  **required** `bounds: BBox`, `[_layout]`, `hasLayoutDrift`, `drifts`, plus the same geometry
  fields as the computed stage.

`ComputedStoryView extends BaseComputedViewProperties` (`view-computed.ts:188`) and
`LayoutedStoryView extends BaseLayoutedViewProperties` (`view-layouted.ts:220`) inherit the wrong
half. To satisfy the contract, `computeStoryView` fabricates
`nodes: [], edges: [], autoLayout: { direction: 'TB' }`
(`packages/core/src/compute-view/story-view/compute.ts`, the final `calcViewLayoutHash({...})` call),
and the layouter fabricates `bounds: zeroBounds, nodes: [], edges: []`
(`packages/layouts/src/graphviz/GraphvizLayoter.ts`, commit `0b0a03c47`). None of these fabricated
fields are ever read by anything story-specific — they exist only to satisfy a supertype the story
has no substantive relationship to. This is exactly the suspicion RFC 0001 raised in its final
section, confirmed by reading the code that had to compensate for it.

**The seam is clean and already precedented** — see §3.

## 3. Existing precedent for "addressable but not a regular view"

Three cases in this codebase already sit outside `ComputedView`/`LayoutedView`. None of them is a
perfect match for a story, but each validates a different part of the design space.

### `ComputedProjectsView` / `LayoutedProjectsView`

`packages/core/src/compute-view/projects-view/_types.ts:34-48`:

```ts
export interface ComputedProjectsView extends BaseViewProperties<any> {
  readonly [_type]: 'projects'
  readonly [_stage]: 'computed'
  readonly nodes: ReadonlyArray<ComputedProjectNode>
  readonly edges: ReadonlyArray<ComputedProjectEdge>
  readonly autoLayout: ViewAutoLayout
}
```

Extends `BaseViewProperties<any>` directly — not `BaseComputedViewProperties`. `[_type]: 'projects'`
is confirmed absent from `ComputedView`/`LayoutedView` (`packages/core/src/types/view.ts:36-46`).

**Addressing**: not `findView`. A dedicated language-service method,
`LikeC4LanguageServices.projectsOverview()` (`packages/language-server/src/LikeC4LanguageServices.ts:63,272-290`),
which calls `computeProjectsView(models)` directly. **Routing**: a wholly separate top-level SPA
route, `packages/likec4-spa/src/routes/projects.tsx`, with its own page (`ProjectsOverview.tsx`), its
own vite-plugin virtual module (`likec4:projects-overview`), and its own React component,
`LikeC4ProjectsOverview` — **not** `LikeC4Diagram`.

**What it gave up**: `findView`, folder grouping, search, nav dropdown — and, critically, reuse of
`LikeC4Diagram`'s rendering machinery. It never needed Next/Prev, a walkthrough panel, or
`navigateTo` interception, so a fully bespoke component was affordable. This is a **strong**
precedent for the type/registry shape a story needs, and a **weak** precedent for how a story
should render, because a story explicitly wants to reuse `LikeC4Diagram` in place (RFC 0001,
"Diagram integration": the story actor is "spawned as a child of the main machine, the way
`editorActorLogic` already is").

### `RelationshipsViewData` / `computeRelationshipsView`

`packages/core/src/compute-view/relationships-view/_types.ts:10-16` — not even view-shaped. A plain
data bag of `ElementModel`/`RelationshipModel` sets (`incomers`, `incoming`, `subjects`, `outgoing`,
`outgoers`). Consumed only by `layoutRelationshipsView`
(`packages/core/src/compute-view/relationships-view/layout.ts:160`) inside
`packages/diagram/src/overlays/relationships-browser/layout.ts`, computed on demand from a
selection, owned by its own XState actor (`overlays/relationships-browser/actor.ts`), with **no
route, no id, no search membership at all**.

**What it gave up**: everything view-membership buys, including deep-linkability — because it never
needed any of it. This is genuinely ephemeral session UI state, not a citable artifact. Weakest fit
for a story, which explicitly wants scene position to be deep-linkable.

### `ComputedAdhocView`

`packages/core/src/compute-view/adhoc-view/compute.ts:24-30,41-60` — again extends
`BaseViewProperties<AnyAux>` directly, `[_type]: 'adhoc'`, never stored in the model, delivered
per-request over vite-plugin RPC (`packages/vite-plugin/src/rpc/functions/calcAdhocView.ts`). No
persistent id, no route. Confirms the _type_-level pattern again (extend `BaseViewProperties`, keep
out of the processing unions) but, like the relationships view, is the opposite of durable/addressable.

### `packages/diagram/src/overlays/relationships-browser/` and `relationship-details/`

Both are "sibling stateful features" per `AGENTS.md`, each with its own actor, opened via in-memory
selection state, never assigned a `ViewId`, never touching `LikeC4Model._views`, rendering with
their own XYFlow conversion (`layout-to-xyflow.ts`) rather than `LikeC4Diagram`. Confirms
"addressable but not a view, by simply not being URL-addressable" is a live pattern here — but it's
the pattern that gives up precisely what a story needs most.

**Verdict**: no existing precedent combines "URL-addressable, findable by id, wants to reuse
`LikeC4Diagram`'s live-rendering and walkthrough machinery in place." That combination is unique to
story. The three precedents jointly validate the _type-level move_ — extend `BaseViewProperties`
directly, own `[_type]`, live outside `ComputedView`/`LayoutedView` — but none of them validates a
_rendering_ strategy, because none of them mounts inside `LikeC4Diagram`. The story actor's design
(spawned XState child of the main diagram machine, in-place `view` swap) is genuinely novel in this
codebase and has no precedent to lean on. That novelty — not the containment decision — is the real
reason a bespoke mechanism (the story actor, `resolveScene`/`resolveSceneView`'s split because "an
XState actor cannot reach React context") had to be invented. **This part of the complexity survives
unchanged under every candidate below**, and should not be credited to the containment mistake.

## 4. What the router would require

Current shape: `packages/likec4-spa/src/routes/project.$projectId/view.$viewId.tsx` (layout route:
`<Outlet/>` + `<Header/>`) and `view.$viewId.index.tsx` (renders `ViewEditor` or `ViewReact`
depending on `isRpcAvailable`), alongside sibling routes for `embed.$viewId`, `export.$viewId`, and
`view.$viewId.{d2,dot,mmd,puml}` — six file-based routes keyed on `$viewId` per project, mirrored
again under `_single/` for single-project deployments.

`useCurrentViewId()` (`packages/likec4-spa/src/hooks.ts:46-52`) reads `viewId` from route params
with `strict: false`, so it resolves correctly regardless of nesting depth — a
`story/$storyId/view/$viewId` route's `$viewId` segment is picked up unchanged. `useCurrentView()`
(`hooks.ts:57-84`) then calls `$likec4model.get().findView(viewId)`, which would still resolve the
_scene's_ view correctly, since a scene is always an ordinary view.

Adding `project.$projectId/story.$storyId.tsx` (a layout route establishing "we are inside story X,"
mirroring `route.tsx`'s `LikeC4ModelContext` wiring at
`packages/likec4-spa/src/routes/project.$projectId/route.tsx:58-69`) and
`project.$projectId/story.$storyId.view.$viewId.tsx` (the scene-rendering leaf, a `StoryReact.tsx`
cousin of `ViewReact.tsx`) is mechanically the same shape of work as any existing nested route pair
here — TanStack Router's file-based, code-generated (`routeTree.gen.ts`) model imposes no
architectural obstacle. A `beforeLoad` redirect from `story/$storyId` (no scene given) to
`story/$storyId/view/$firstSceneViewId` is the same pattern already used at
`routes/project.$projectId/route.tsx:26-35` and `routes/projects.tsx:14-19`.

**What happens to `view.$viewId`**: it does not need to change. Visiting
`/project/$projectId/view/$storyId` once story is no longer a view means `findView(storyId)` returns
`null`, which `ViewReact.tsx`'s existing `<NotFound/>` branch (`packages/likec4-spa/src/pages/ViewReact.tsx:52`)
already handles with no new code. A redirect to the new nested route instead of a 404 is one extra
`beforeLoad`, worth adding only if backward-compat for links minted while story was `_type: 'view'`
matters — moot for this still-unreleased POC branch, but the kind of thing to decide before this
pattern ships for real.

**Next/Previous as real navigations**: `ComputedStoryScene.view` (`view-computed.ts:170-186`) already
holds each scene's target `ViewId` in traversal order, so `navigate({ to: '../view/$nextViewId' })`
needs no new data — it needs the story actor's `next()`/`prev()` to drive a router call instead of
(or in addition to) the in-memory cursor move it does today.

## 5. What the DSL side needs

Four independent knobs were found, not one:

**(a) Textual placement.** Currently `ModelViews: name='views' ... (views+=LikeC4ViewRule | ...)*`
(`packages/language-server/src/like-c4.langium:311-317`), with `story` as one alternative of
`LikeC4ViewRule` (`:319-323`).

**(b) Langium type-union membership.** `type LikeC4View = ElementView | DynamicView | DeploymentView
| StoryView` (`like-c4.langium:318`). This flows into `ast.LikeC4View`, and directly into
`ModelLocator.locateViewAst` (`packages/language-server/src/model/model-locator.ts:187-210`), which
returns `ViewLocateResult` for **any** AST node satisfying `ast.isLikeC4View`, story included.

**(c) Parser sink.** `ViewsParser.parseViews()`
(`packages/language-server/src/model/parser/ViewsParser.ts:48-68`) pushes both ordinary views and
stories into the **same** flat `this.doc.c4Views` array (`case ast.isStoryView(view): this.doc.c4Views.push(...)`
at line 63-65). `doc.c4Views` is typed `ParsedAstView[]` = `ParsedAstElementView | ParsedAstDynamicView
| ParsedAstDeploymentView | ParsedAstStoryView` (`packages/language-server/src/ast.ts:220-224,267`).

**(d) Core-type union membership** — covered in §1-2.

These are logically independent, and this independence matters: **(b) and (c), not (d), are what
cause the `model-change/` fallout** (`NonStoryLikeC4View`, the `ast.isStoryView` invariants in
`changeElementStyle.ts:71`, `changeViewLayout.ts:23`, `viewChange.ts:25,45-48`). Fixing only the
core-type unions (§1-2) and leaving `LikeC4View`/`doc.c4Views` as they are today would leave every
one of those runtime guards in place, doing real work, forever — because `ModelLocator.locateViewAst`
would still hand back a story AST to any caller that looks up a view by id. A coherent fix has to
touch (b) and (c) as well as (d).

**(a) is genuinely free to choose independently of (b)/(c)/(d).** Nothing found in the grammar,
parser, or locator forces `story` to leave the `views { }` block for the containment fix to work.
Langium supports a rule appearing in one collecting property (`stories+=StoryView`) without that
rule being a member of the `LikeC4View` sum type, so `story` can keep reading naturally beside
`view`/`dynamic view` while `ModelViews` routes it to a second property, and `ViewsParser` routes
that property to a new `doc.c4Stories` sink. A sibling top-level `stories { }` block or bare
top-level `story name { }` are equally viable and cost the same; there is no code-level forcing
function either way (see Open Questions).

**One useful side effect of removing `StoryView` from `LikeC4View`**: `StoryScene.view=[LikeC4View]`
resolves scene targets by reference. `computeStoryView` currently guards against a scene resolving
to a story at runtime (`invariant(referencedView[_type] !== 'story', ...)` in `compute.ts`) precisely
because Langium's reference resolution can't statically rule it out today. If `StoryView` is no
longer a `LikeC4View` alternative, `[LikeC4View]` reference targets can never _be_ a story, and that
invariant becomes dead code — a runtime guard promoted to a compile-time impossibility, for free.

**`Id`-rule cost is unaffected either way.** `story`/`scene`/`sceneLayout`/`becomes` need the `Id`
rule entries (`like-c4.langium:1234-1249`) regardless of which of (a)-(d) is chosen, because that
need comes from the keywords being lexed as terminals _anywhere_ in the grammar, not from their
position relative to `views { }`. Moving to a `stories { }` block would want the same treatment for
`stories` if it's ever likely to collide with an identifier — the same, already-paid order of cost
RFC 0001 already argues for reusing dynamic-view vocabulary (`like-c4.langium:1244`, existing
`DynamicViewFlowKeyword` entries cost nothing further).

## 6. Candidate designs

### Candidate A — status quo (a story is a view)

Not a design to choose, but the floor everything else is measured against. It buys search/nav/route
for free and pays for it with exactly the 36-site fallout, the `bounds: undefined` crash class, the
manual-layout filter, and the `story.scene`/`update.view` split. §1-2 show the benefit side of this
trade was mostly illusory (BaseViewProperties would have supplied the same addressability with none
of the geometry-inheritance cost), so this is not recommended, but it is explicitly not a "candidate
you'd pursue over the alternatives" rather than a live option — RFC 0001 already made this case in
detail and this document does not need to re-litigate it.

### Candidate B — parallel addressable registry (recommended)

**Type-level shape.**

- `ParsedStoryView`/`ComputedStoryView`/`LayoutedStoryView` extend `BaseViewProperties<A>` (plus
  their own `[_stage]`/`[_type]: 'story'`/`docUri` where relevant) directly — never
  `BaseComputedViewProperties`/`BaseLayoutedViewProperties`. No `nodes`, `edges`, `bounds`,
  `autoLayout`, hash, or notation fields anywhere in the story type hierarchy — not fabricated
  placeholders, genuinely absent, because nothing reads them.
- `ParsedView`/`ComputedView`/`LayoutedView` drop `story` entirely, returning to their pre-RFC-0001,
  3-member shape.
- A new `AnyStoryView<A> = ParsedStoryView<A> | ComputedStoryView<A> | LayoutedStoryView<A>` and a
  new sibling field `stories: Record<aux.StoryId<A>, ...>` on `BaseLikeC4ModelData`
  (`packages/core/src/types/model-data.ts:29-41`), parallel to `views`, following the pattern
  `AGENTS.md` already documents for parsed/computed/layouted staging.
- `LikeC4Model` gains `_stories: Map<StoryId, LikeC4StoryModel<A>>`, `stories()`, `findStory(id)`,
  `story(id)` — built the same way `_views` is built (`LikeC4Model.ts:267-279` is the literal
  template: loop, wrap, index). `LikeC4StoryModel` is a **new, much smaller** class exposing
  `id`/`title`/`description`/`tags`/`links`/`order`/`sceneLayout`/`scenes`/`storyFlow` — explicitly
  **not** extending `LikeC4ViewModel` and **not** exposing `nodes()`/`edges()`/`findNode()`/etc.,
  because none of that is meaningful and pretending otherwise (as the current `LikeC4ViewModel`
  wrapping a story does today, silently, with empty maps) is exactly the mistake being corrected.
- Grammar: `StoryView` removed from the `LikeC4View` alternation (§5b); `ModelViews` gains a second
  collecting property (or `story` moves to a sibling block — a free choice, §5a); `ViewsParser`
  routes to `doc.c4Stories`; `ModelLocator` gains `locateStoryAst`.
- Routing: `/project/$projectId/story/$storyId/view/$viewId` (§4); `view.$viewId` unchanged.
- Diagram: the story actor, cursor, `align.ts`, `StoryFlow` are **unchanged** — they never touched
  the unions. What changes is their _input_: instead of
  `StoryFlow.from(context.view as unknown as ComputedStoryView)` fed from the diagram's own `view`
  prop (`machine.ts:63`, `machine.state.navigating.ts:71`), the story is fed from a new prop/context
  the SPA page supplies directly from `model.findStory(id)`. `context.view` in the XState machine
  never again holds a story-shaped object.

**What it dissolves** (traced to specific commits on `story-view-implementation`):

| Dissolves                                                                                       | Why                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0b0a03c47` (zero-bbox fix)                                                                     | `LikeC4Diagram`'s `view` prop is never typed to accept a story again; there is nothing to fabricate a bounding box for                                                                                                                                                                     |
| The `story.scene`/`update.view` split (`machine.ts:114-133`, `machine.setup.ts:255-266`)        | Either removed outright (Next/Prev become real `navigate()` calls, so ordinary `update.view` handles the swap) or kept as a pure client-side cursor optimization with no history-pollution concern, because the URL is no longer claiming to be "the story" while showing a different view |
| The `context.view._type === 'story'` staleness workaround (`machine.state.navigating.ts:30-36`) | `context.view._type` is always an ordinary view type now; there is no second, conflicting reading to guard against                                                                                                                                                                         |
| `f5d917a27` (MCP enum widening)                                                                 | The enums never admit `'story'`; nothing to widen                                                                                                                                                                                                                                          |
| `8de72b1f1` (generator stub)                                                                    | `anyView`'s union never includes `story`; nothing to throw on                                                                                                                                                                                                                              |
| `34d45800b` (aichat guard)                                                                      | The type the guard checks against never includes story                                                                                                                                                                                                                                     |
| `3b56756a7` (manual-layout snapshot filter)                                                     | `LayoutedView` never includes story; nothing to filter out                                                                                                                                                                                                                                 |
| `3c6ea73e4`, `viewChange.ts`'s `NonStoryLikeC4View`                                             | Resolved by §5's grammar-level fix (not the core-type fix alone) — `ast.LikeC4View` no longer admits `StoryView`, so `locateViewAst` can never return one, and the guard becomes unreachable by construction                                                                               |
| `5757bcba6`, the `model-parser.spec.ts`/`model-builder.spec.ts` `rules`-narrowing fixtures      | Same cause as above — `ParsedAstView` returns to its pre-story shape                                                                                                                                                                                                                       |
| The dead-code `invariant` in `computeStoryView` rejecting a story-typed scene target            | Promoted to a Langium reference-resolution impossibility (§5)                                                                                                                                                                                                                              |

**What it costs** (genuinely new work, not reused from the POC):

- `LikeC4StoryModel` class, `_stories` map, `stories()`/`findStory()` on `LikeC4Model`.
- `stories` field threaded through `ParsedLikeC4ModelData`/`ComputedLikeC4ModelData`/`LayoutedLikeC4ModelData`.
- A parallel "compute stories" loop in `computeParsedModelData`/`computeLikeC4Model` (today's
  per-view loop cannot just widen; it needs a sibling loop over `parsed.stories`).
- A parallel "layout stories" pass wherever `layoutAllViews` is orchestrated (today's `isStoryView`
  bypass branches inside `GraphvizLayoter.layout()`/`aiLayout()` are deleted, not generalized).
- `doc.c4Stories` sink in `ViewsParser`, `ModelLocator.locateStoryAst`.
- New SPA routes (`story.$storyId.tsx`, `story.$storyId.view.$viewId.tsx`), a `StoryReact.tsx` page,
  `useCurrentStoryId()`/`useCurrentStory()` hooks mirroring `useCurrentView()`.
- **A new vite-plugin virtual module / RPC surface for story data**, if dev-mode live-editing parity
  with ordinary views is wanted. The POC never had to build this because a story rode on the
  existing per-view `likec4:model` machinery for free. This is real, unbudgeted surface area — see
  Open Questions.
- An explicit merge step folding `model.stories()` into `NavigationPanelDropdown`'s folder columns
  and search results, replacing the "came along with the widened union" mechanism with a single,
  deliberately-owned integration point (arguably a _quality_ improvement: one obvious place to look,
  instead of N accidental compile errors marking the places that needed a decision).

**Precedent followed**: `ComputedProjectsView`/`LayoutedProjectsView` for the type shape. No
precedent exists for the rendering/routing integration with `LikeC4Diagram` — that part is novel
either way (see §3's verdict) and is not a cost specific to this candidate.

### Candidate C — no model representation at all (rejected)

Go further than B: give story no DSL construct and no core type whatsoever. A story becomes a
purely presentation-layer concept — an ordered list of `ViewId`s plus scene metadata, expressed as
either a config file the SPA reads directly, or ordinary view `metadata` tags that an SPA-side
aggregator stitches together, never touching `packages/core` or `packages/language-server`.

**What it dissolves**: everything B dissolves, plus all of `packages/core/src/story/`,
`packages/core/src/compute-view/story-view/`, `packages/core/src/types/view-parsed.story.ts` and
siblings, the grammar additions, and the language-server validations — thrown away wholesale.

**What it costs**: it abandons RFC 0001's stated motivation outright — "A story makes both explicit
in the model rather than in a slide deck alongside it." A scene naming a nonexistent view is no
longer a language-server error, just a runtime 404. `becomes` correspondence has no FQN-resolution
machinery to lean on and would need to duplicate, badly, what the language server already resolves
for free. None of `StoryFlow`, `align.ts`, the composite cursor, `computeStoryView`'s walk, or the
validations touch the view unions at all (verified directly in §1's last row) — so Candidate C
solves a problem (union widening) that Candidate B already solves completely, at a much higher
price (the feature's entire reason for existing) for no additional benefit.

**This is the candidate not to pursue.** It over-corrects: the RFC 0001 retrospective's complaint
was specifically about union membership, and Candidate B answers that complaint precisely. Candidate
C throws away validated, union-independent work to solve a problem Candidate B already solves.

## Recommendation

**Candidate B.** It is a bounded, mechanical change along four independently-identified knobs
(§5a-d), it dissolves every named piece of RFC 0001 fallout with a traced cause rather than a
guess, it reuses a pattern already proven once in this exact package
(`compute-view/projects-view/`), and it fixes the two real user-facing defects — staleness
(`/view/migration` showing a different view) and non-deep-linkable scenes — at the root, rather than
suppressing their symptoms (the `story.scene` event, the `activeStoryCursor` patch).

**Reject Candidate C.** It solves the same problem with a much bigger hammer, discarding real,
already-correct, union-independent engineering (the cursor/traversal/alignment core) and abandoning
the feature's stated purpose, for no gain Candidate B doesn't already provide.

**Candidate A (status quo) is not recommended**, on the concrete evidence in §1-2: the "free" benefit
of view-membership was mostly `BaseViewProperties`-shaped and never required inheriting geometry, and
one piece of the "free" benefit (the `_type` staleness shortcut) was actively wrong and had to be
replaced regardless. That said, Candidate B is **not a free lunch either** — the "came for free"
framing this investigation is correcting on the cost side has a mirror image on the benefit side: a
parallel registry, new routes, and (if dev parity matters) new vite-plugin/RPC surface are real,
unbudgeted work that the POC never had to do because riding the view unions handed all of it over for
nothing. Whoever picks this up should size that work honestly rather than assume it's "just remove
story from three unions."

**Complexity this investigation does not credit to the containment decision** (per the task's
instruction to separate causes): the `scalar.StepPath` Tagged-type fallout in
`Builder-style2.spec.ts`/`view-story-flow.spec.ts`/`cursor.spec.ts` is caused by introducing a new
branded scalar type, not by which union story sits in, and survives unchanged under every candidate.
The depth-first `alt` semantics question, the `try`/`catch`/`finally` vocabulary bikeshed, and the
`par`/`parallel` rendering question are pure story-semantics design questions, orthogonal to
containment. The story actor's own architecture (spawned XState child, `resolveScene`/
`resolveSceneView`'s split because "an XState actor cannot reach React context") is required by
_any_ design that wants Next/Prev to feel instant without a full page reload, and is not a
containment cost — see §3's verdict.

## Migration sketch (Candidate B)

Suggested order, so each step leaves the tree compiling:

1. **Grammar** (`packages/language-server/src/like-c4.langium`): remove `StoryView` from the
   `LikeC4View` alternation; add a second collecting property for stories (kept inside `views { }`
   per §5a's "free choice" — recommend the smallest author-facing diff unless product wants a
   `stories { }` signal). `Id`-rule entries are untouched. Run `pnpm generate`.
2. **Parser**: `ViewsParser.parseViews()` routes `ast.isStoryView(view)` to a new `doc.c4Stories`
   push instead of `doc.c4Views`; `ParsedLikeC4LangiumDocument` gains `c4Stories?: ParsedAstStoryView[]`
   (`ast.ts:267`); `ModelLocator` gains `locateStoryAst`; delete the now-unreachable
   `NonStoryLikeC4View`/`ast.isStoryView` guards in `model-change/*`.
3. **Core types**: change the `extends` clause on `ParsedStoryView`/`ComputedStoryView`/
   `LayoutedStoryView` to `BaseViewProperties<A>`; remove `story` from `ParsedView`/`ComputedView`/
   `LayoutedView`; add `AnyStoryView`; add `stories` to `model-data.ts`'s three interfaces.
   `isStoryView` is rewritten against the new standalone type. Run `pnpm exec tsc --build`
   immediately (per `AGENTS.md`'s composite-project gotcha) before touching downstream packages.
4. **Core compute/model**: `computeStoryView`'s walk logic is unchanged; delete the fabricated
   `nodes: [], edges: [], autoLayout: {...}` spread at the end. Add the parallel "compute stories"
   loop. Add `LikeC4StoryModel`, `_stories`, `stories()`/`findStory()` to `LikeC4Model`.
5. **Layouts**: delete `GraphvizLayoter`'s `isStoryView` bypass branches and `zeroBounds`; add a
   parallel "stamp stories as layouted" step beside `layoutAllViews`.
6. **Delete the now-dead defensive commits**: `excludeStoryManualLayouts` (`model-builder.ts`), the
   MCP enum widenings, the generator `storyView` stub, the aichat guard — each reverts to its
   pre-story, now-correctly-exhaustive form.
7. **Diagram**: story actor/cursor/`align.ts`/`StoryFlow` survive verbatim. Change their input wiring
   so `context.view` never becomes story-shaped; decide (product question, not architectural) whether
   Next/Prev become real `navigate()` calls or stay an in-memory cursor with the URL updated
   separately.
8. **SPA**: new routes/pages/hooks (§4); new vite-plugin virtual module if dev parity is wanted (see
   Open Questions before committing to this).
9. **Navigation dropdown/search**: replace the union-widened `ColumnItem`/`ViewTypeIcon` cases with a
   deliberate merge of `model.stories()` results.

**Survives unchanged**: `packages/core/src/story/` (cursor, align.ts), `StoryFlow`, the LSP
validations (`44500293c`), the `becomes`/scene grammar rules, the walkthrough panel wiring, the
`navigateTo` interception (`findSceneForView`), `computeStoryView`'s traversal (minus the fabricated
geometry tail), and the `view-story-flow.spec.ts` StepPath-constructor fix (orthogonal, §Recommendation).

**Rewritten or deleted**: the core-type `extends` clauses; the langium `LikeC4View` union and parser
sink; `GraphvizLayoter`'s bypass; the zero-bbox fix (deleted, not ported); the MCP/generator/aichat/
manual-layout defensive commits (deleted); `NavigationPanelDropdown`'s fallout-fix commit (rewritten
into a deliberate feature commit); the `model-change` guards (deleted).

## Open questions this investigation could not resolve from the code alone

1. **Push-vs-replace browser history for Next/Prev**, if scene changes become real navigations — a
   UX decision with no code-level answer visible.
2. **Whether `story` stays inside `views { }` or moves to a sibling/top-level block** (§5a) — no
   forcing function was found either way; it is an authoring-ergonomics call.
3. **Whether dev-mode (RPC/HMR) parity for stories is in scope for a first cut**, or whether stories
   ship production-build-only initially. The POC never had to build vite-plugin/RPC surface for
   stories because a story rode the existing per-view virtual module; Candidate B's cost estimate for
   that surface cannot be sized without knowing whether live-editing a story's DSL and seeing Next/Prev
   reflect via HMR is a hard requirement.
4. **Interaction with `sceneLayout: unified`** (already deferred in RFC 0001) under a standalone-story
   design — not investigated, out of scope in both RFCs.
5. **Whether a reverse index ("stories that reference this view") should exist**, symmetric to
   `ElementModel.views()`. No such index exists today at any layer for stories, and RFC 0001 never
   proposes one; whether it's wanted is a product question.
6. **Backward compatibility for URLs minted during the POC's life**, if any ever ship before this
   migration lands. Moot for an unreleased branch, but worth deciding before this pattern is applied
   to a released feature.

## Implementation record

Candidate B shipped across the nine tasks tracked in
`docs/superpowers/plans/2026-08-03-story-containment-redesign.md`. This section records what the
"Open questions" above actually resolved to, and the one place the shipped design diverged from
this RFC's own migration sketch.

**Open question 1 — push-vs-replace browser history.** Resolved: push. Next/Prev on a story now
call `navigate()` with no `replace: true`, so each scene transition is a real, separately-back-
button-able history entry (Task 7, `packages/likec4-spa/src/pages/StoryReact.tsx`). Confirmed
working via Task 7's browser smoke test and re-confirmed in this task's own end-to-end pass: the
back button steps backward through scenes one at a time (`cloud_next` → `dynamic-view-1` →
`cloud_legacy`), not back out of the story entirely.

**Open question 2 — DSL placement.** Resolved: a sibling top-level `stories { }` block, not a
second collecting property inside `views { }`. `story` no longer appears as an alternative of
`LikeC4View` in the grammar; `ModelViews`/`ViewsParser` route it to its own `doc.c4Stories` sink
(Task 3, `packages/language-server/src/like-c4.langium`, `packages/language-server/src/model/parser/ViewsParser.ts`).
This was the RFC's "free choice" (§5a) — the smallest-diff option (keeping `story` inside
`views { }`) was not the one taken; the sibling block was chosen for a clearer authoring signal
that a story is not a view.

**Open question 3 — dev-mode RPC parity.** Resolved, and cheaper than estimated: no new
vite-plugin virtual module or RPC surface was needed. Once `stories` became a field on
`LayoutedLikeC4ModelData` (Task 1), it started riding the existing `likec4:model` virtual module
for free — `packages/vite-plugin/src/virtuals/model.ts` serializes the whole `LayoutedLikeC4ModelData`
already, `stories` included. Task 8 verified this at two levels (a `fromWorkspace` script and a
running dev server's served module) before writing any code, and the only change that shipped was
a per-item HMR diff for `stories` in `packages/vite-plugin/src/internal.ts`'s `updateModel`, matching
the diffing this file already did for `views` (an HMR-diff-quality improvement, not new surface
area). This RFC's cost estimate (§"What it costs") had flagged this as "real, unbudgeted work" whose
size "cannot be sized without knowing whether live-editing... is a hard requirement" — it turned out
to cost nothing beyond the type change itself.

**Deviation from the migration sketch: the story actor/cursor were deleted, not rewired.** The
migration sketch's step 7 (§"Migration sketch (Candidate B)") expected the story actor,
`resolveScene`, `align.ts`, and `StoryFlow` to "survive verbatim," with only their input wiring
changed so `context.view` never becomes story-shaped, and treated push-vs-replace navigation as an
open, independent product question layered on top of a surviving actor. That is not what shipped.
Task 6 (`docs/superpowers/plans/2026-08-03-story-containment-redesign.md`, "Task 6: Diagram + Core
— delete the story actor/cursor, add a `story` prop") deleted the story XState actor, its cursor,
and `resolveSceneView`'s actor-side split outright — commit `7e3074011`,
"refactor(diagram): delete the story actor/cursor — the route is now the cursor." The reasoning:
once Next/Prev became real, pushed `navigate()` calls (open question 1, resolved as push), the
route's `$viewId` param already _is_ the position in the story — there is nothing left for an
in-memory cursor to track that the URL doesn't already track. Keeping the actor around to duplicate
that state would have reintroduced exactly the two-sources-of-truth problem (`context.view` vs. the
URL) that RFC 0001's retrospective and this RFC's §1 last row (the `activeStoryCursor` staleness
workaround) had already identified as a trap. `resolveScene`/`calcSceneOffset` (the alignment math)
were not deleted — they were relocated to `packages/core/src/story/resolveScene.ts` and are now
called directly from `packages/likec4-spa/src/pages/StoryReact.tsx` on every render, keyed off the
route's current scene instead of actor state. This task's own end-to-end verification (see below)
confirms that relocation preserved the alignment behavior: non-zero, monotonically-accumulating
offsets across scene transitions, matching the values Task 7's smoke test already recorded
(`{x:125,y:-98}` then `{x:390,y:-187}`).

**Known gaps not yet closed.** The record above is accurate but incomplete about what's left:

- Stories are not discoverable anywhere in the SPA UI — no entry in the navigation dropdown,
  search, sidebar, or landing page. The only way to reach a story is to hand-type the nested URL.
- The view-id/story-id shared-vs-separate-namespace decision (Task 3: `view foo {}` and
  `story foo {}` are allowed to coexist) is a URL/product-contract decision, not just an internal
  validation choice, and needs explicit product sign-off before this ships for real — it currently
  means `/project/x/view/foo` and `/project/x/story/foo` can address two different, same-named
  things.
- `ModelLocator.locateStoryAst`/`StoryLocateResult` (Task 3) have no consumers yet — there's no
  "go to definition"/"open source" story analogue of `locateView` wired up.

**Superseded since this record was written.** The `sceneLayout` property (§"Open questions" item 4
above, and RFC 0001's "Scene layout modes") — and the `resolveScene`/`calcSceneOffset` alignment
math this section describes as relocated to `StoryReact.tsx` — was replaced by a per-scene,
DSL-authored `anchor <ElementRef>` statement computed inside `packages/diagram` itself. See
`docs/superpowers/plans/2026-08-04-story-scene-anchor.md`.

**Known limitation, found in that plan's final review.** Scene identity in `packages/diagram` is
keyed by the scene's _view id_, not by the story's own finer-grained `StepPath`
scene-occurrence id (`ComputedStoryScene.id`). A story whose flattened depth-first traversal
repeats a view id — as this very RFC's `alt`-branch pattern permits, and as
`examples/cloud-system/story.c4`'s own `alt` block does — has a known limitation: an `anchor`
declared on the repeated occurrence may not apply correctly (mitigated by a fail-safe that
silently disables the pan rather than applying it wrong), and scene stepping/boundary buttons
cannot walk past the first occurrence of a repeated view id. A proper fix requires making the
scene's own `StepPath` — not the view id — the routing/diagram-context identity, a design
change spanning `packages/likec4-spa` and `packages/diagram`'s public prop contract, deliberately
out of scope for the anchor plan. See the "Known limitation" section near the end of
`docs/superpowers/plans/2026-08-04-story-scene-anchor.md`.
