# Story Views POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `story` view type to LikeC4 that plays an ordered sequence of existing views, with a
single Next/Previous cursor and geometric continuity between consecutive scenes.

**Architecture:** A story is a fourth view type (`_type: 'story'`) declared in `views { }`. It owns
**no geometry** — `nodes: []`, `edges: []` — and instead lists _scenes_, each naming another view.
The diagram resolves each scene's already-layouted geometry from `LikeC4Model` at render time and
applies a translation offset so shared elements barely move. Traversal composes two cursors:
`StoryFlow` over scenes, delegating into the existing `DynamicViewFlow` when a scene is a dynamic
view.

**Tech Stack:** TypeScript, Langium (DSL grammar), Vitest, XState v5, React, XYFlow (`@xyflow/react`),
Graphviz via WASM, pnpm workspaces + turbo.

**Spec:** `docs/rfcs/0001-story-view.md` — read it before Task 1. This plan implements the "MVP
scope" section of that RFC.

## Global Constraints

- Node `>=22.22.3`; pnpm workspace monorepo managed by turbo.
- Formatting is dprint: **120-column lines, single quotes, no semicolons**. Run `pnpm fmt` before
  each commit.
- TypeScript-first. Avoid `any`. Avoid `as` casts unless there is no safer alternative.
- Favor `switch (true)` over if-else chains.
- Test files are `*.spec.ts`, colocated with sources or in `__tests__/`.
- **After any edit to `packages/language-server/src/like-c4.langium`, run `pnpm generate`.** The
  Langium parser under `src/generated/` is generated; never edit it by hand.
- **After adding an export to `packages/core`, run `pnpm exec tsc --build` before typechecking
  downstream.** `packages/core` is a composite project; downstream packages read `.d.ts` from
  `packages/core/lib/`, so stale declarations produce phantom "Property X does not exist" errors.
  If `tsc -b` reports errors that a package-local `tsc --noEmit` does not, run
  `find packages -name "*.tsbuildinfo" -delete` and rebuild.
- **No changeset.** This is an unpublished POC (RFC "Non-goals").
- Do **not** touch `packages/icons/`, `packages/language-server/src/generated/`, or
  `packages/language-server/src/generated-lib/`.
- Out of scope entirely, do not implement: generators (Mermaid/PlantUML/D2/DSL writeback), exports
  (PNG/SVG), TextMate grammars, MCP, docs site, `sceneLayout unified`, fork-prompt navigation,
  scene-level Next/Previous controls, geometric box-splitting for `becomes`.

## Known transient breakage (added after Task 1 ran)

Widening the view unions in Task 1 breaks compilation at sites across the monorepo. **`pnpm exec
tsc --build` and `pnpm typecheck` are expected to fail until Tasks 5, 8, 13 and 14 are all
complete.** If you are implementing any task before then, do not treat these as your bug, and do
not fix them — they have owners:

| Site                                                                           | Owner   |
| ------------------------------------------------------------------------------ | ------- |
| `packages/core/src/compute-view/compute-view.ts:45`                            | Task 5  |
| `packages/layouts/src/graphviz/GraphvizLayoter.ts:48`                          | Task 8  |
| `packages/language-server/src/ast.ts:204,208`                                  | Task 3  |
| `packages/language-server/src/model/parser/ViewsParser.ts:63`                  | Task 3  |
| `packages/generators/src/likec4/operators/likec4data.spec.ts:214`              | Task 13 |
| `packages/generators/src/likec4/operators/views.spec.ts:64`                    | Task 13 |
| `packages/core/src/builder/Builder-style2.spec.ts:437`                         | Task 14 |
| `packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx:256,412`     | Task 14 |
| `packages/language-server/src/model-change/changeElementStyle.ts:75,81`        | Task 14 |
| `packages/language-server/src/model-change/changeViewLayout.ts:27`             | Task 14 |
| `packages/language-server/src/model-change/viewChange.ts:113`                  | Task 14 |
| `packages/language-server/src/model/model-builder.ts:253`                      | Task 14 |
| `packages/language-server/src/model/__tests__/model-builder.spec.ts:1780,1811` | Task 14 |
| `packages/language-server/src/model/__tests__/model-parser.spec.ts` (14 sites) | Task 14 |
| `packages/mcp/src/tools/_common.ts:264`                                        | Task 14 |
| `packages/mcp/src/tools/read-project-summary.ts:157`                           | Task 14 |
| `packages/mcp/src/tools/read-view.ts:141`                                      | Task 14 |
| `packages/likec4-spa/src/aichat/useChat.tsx:62`                                | Task 14 |

**Verify your own work with a focused test run**, not a whole-repo typecheck. Where a task's steps
say "run `pnpm typecheck`, expected PASS", read that as: no _new_ errors in the files you touched.

**Formatting:** the repo was made dprint-clean in commit `63667fa0a`, so `pnpm fmt` is now a no-op
and safe to run. Prefer `pnpm exec dprint fmt <your paths>` anyway — it is faster and keeps your
diff obviously scoped.

**Fresh checkout:** `packages/*/dist` may not exist. If a test run cannot resolve
`@likec4/style-preset/defaults`, run `pnpm turbo run sources --filter="@likec4/style-preset..."`
once.

## Test commands

Run from the repo root:

- Single file: `pnpm vitest run <path/to/file.spec.ts>`
- Single test: `pnpm vitest run <path> -t "<test name>"`
- A package: `pnpm --filter @likec4/core test`
- Typecheck everything: `pnpm typecheck`

## File Structure

**`packages/core`** — types, compute, traversal, geometry math. No React, no Langium.

| File                                           | Responsibility                                                 |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `src/types/view-parsed.story.ts` (new)         | `ParsedStoryView` and the statement/scene/correspondence types |
| `src/types/view-computed.ts` (modify)          | `ComputedStoryView`                                            |
| `src/types/view-layouted.ts` (modify)          | `LayoutedStoryView`                                            |
| `src/types/view.ts` (modify)                   | Add to view unions; `isStoryView` guard                        |
| `src/types/index.ts` (modify)                  | Re-export the new module                                       |
| `src/types/view-story-flow.ts` (new)           | `StoryFlow` — tree walk and `prevAndNext` over scenes          |
| `src/story/align.ts` (new)                     | `calcSceneOffset` — translation-only centroid alignment        |
| `src/story/cursor.ts` (new)                    | `StoryCursor` — composite scene + inner-step cursor            |
| `src/compute-view/story-view/compute.ts` (new) | `computeStoryView`                                             |
| `src/compute-view/compute-view.ts` (modify)    | Dispatch `isStoryView`                                         |

**`packages/language-server`** — grammar, AST mapping, validation.

| File                                       | Responsibility                                                     |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `src/like-c4.langium` (modify)             | `StoryView` rules; `Id`-rule keyword additions                     |
| `src/ast.ts` (modify)                      | `ParsedAstStoryView`; add to `ParsedAstView`; `idattr` declaration |
| `src/model/parser/ViewsParser.ts` (modify) | `parseStoryView` + dispatch case                                   |
| `src/validation/story-view.ts` (new)       | Story-specific checks                                              |
| `src/validation/index.ts` (modify)         | Register the checks                                                |

**`packages/layouts`** — layout bypass only.

| File                                       | Responsibility                                |
| ------------------------------------------ | --------------------------------------------- |
| `src/graphviz/GraphvizLayoter.ts` (modify) | Return stories unchanged; no DOT is generated |

**`packages/diagram`** — cursor actor and rendering.

| File                                                      | Responsibility                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/story/actor.ts` (new)                                | Story cursor actor; owns scene advance and `navigateTo` interception |
| `src/story/resolveScene.ts` (new)                         | Scene view id → offset-applied nodes/edges                           |
| `src/likec4diagram/state/machine.setup.ts` (modify)       | `story.scene` event type; story actor ref in context                 |
| `src/likec4diagram/state/machine.ts` (modify)             | Spawn story actor; handle `story.scene`                              |
| `src/context/DiagramFeatures.tsx` (modify)                | `StoryWalkthrough` feature flag                                      |
| `src/navigationpanel/walkthrough/StoryControls.tsx` (new) | Next/Prev + scene narration                                          |

**`examples/`** — a runnable story for manual verification.

---

### Task 1: Core story types and `isStoryView` guard

Adds `story` to the view-type unions. This deliberately breaks compilation at every
`nonexhaustive(view)` dispatch site — that error list is the checklist for Tasks 5 and 8, so **do
not** silence them here beyond what this task specifies.

**Files:**

- Create: `packages/core/src/types/view-parsed.story.ts`
- Modify: `packages/core/src/types/view.ts`
- Modify: `packages/core/src/types/view-computed.ts`
- Modify: `packages/core/src/types/view-layouted.ts`
- Modify: `packages/core/src/types/index.ts`
- Test: `packages/core/src/types/guards.spec.ts` (existing file — append)

**Interfaces:**

- Consumes: nothing.
- Produces: `StorySceneLayout`, `StoryCorrespondence<A>`, `StoryScene<A>`, `StorySubflowKind`,
  `StoryAltBranchKind`, `StorySubflow<A>`, `StoryAltBranch<A>`, `StoryAlt<A>`,
  `AnyStoryStatement<A>`, `ParsedStoryView<A>`, `ComputedStoryScene<A>`, `ComputedStoryView<A>`,
  `LayoutedStoryView<A>`, `isStoryView(view)`.

- [ ] **Step 1: Read the spec sections you are implementing**

Read `docs/rfcs/0001-story-view.md` sections "A story is a view" and "Core types". Then read
`packages/core/src/types/view-parsed.dynamic.ts` in full — the new file mirrors its conventions
(`[_type]` brand, `astPath: string`, `ExclusiveUnion` for statement unions).

- [ ] **Step 2: Write the failing test**

Append to `packages/core/src/types/guards.spec.ts`:

```ts
describe('isStoryView', () => {
  it('returns true for a story view', () => {
    const view = { [_type]: 'story' } as unknown as AnyView<any>
    expect(isStoryView(view)).toBe(true)
  })

  it('returns false for element, dynamic and deployment views', () => {
    for (const t of ['element', 'dynamic', 'deployment']) {
      const view = { [_type]: t } as unknown as AnyView<any>
      expect(isStoryView(view)).toBe(false)
    }
  })
})
```

Add `isStoryView` to the existing import from `./view` (or `./guards`, matching whichever module the
file already imports `isDynamicView` from) and `_type` from `./const` if not already imported.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/core/src/types/guards.spec.ts -t "isStoryView"`
Expected: FAIL — `isStoryView is not a function` (or a TypeScript resolution error).

- [ ] **Step 4: Create the parsed story types**

Create `packages/core/src/types/view-parsed.story.ts`:

```ts
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { ExclusiveUnion, NonEmptyReadonlyArray } from './_common'
import { _type } from './const'
import * as scalar from './scalar'
import type { BaseParsedViewProperties } from './view-common'

/**
 * How consecutive scenes relate geometrically.
 *
 * - `anchored`: each scene keeps its own layout; the incoming frame is translated
 *   so shared elements move as little as possible
 * - `independent`: each scene keeps its own layout, with no alignment
 * - `unified`: one layout across all scenes (NOT implemented — see RFC 0001)
 */
export type StorySceneLayout = 'anchored' | 'independent' | 'unified'

/**
 * N→M element correspondence across a scene transition.
 * `a becomes b, c` splits; `a, b becomes c` merges; `a becomes b` renames.
 */
export interface StoryCorrespondence<A extends AnyAux = AnyAux> {
  readonly sources: NonEmptyReadonlyArray<aux.StrictFqn<A>>
  readonly targets: NonEmptyReadonlyArray<aux.StrictFqn<A>>
}

export interface StoryScene<A extends AnyAux = AnyAux> {
  /**
   * The view this scene renders. Never a story — nested stories are rejected by validation.
   */
  readonly view: aux.StrictViewId<A>
  readonly title?: string | null
  readonly description?: scalar.MarkdownOrString
  /**
   * Narration shown in the walkthrough panel.
   */
  readonly notes?: scalar.MarkdownOrString
  readonly becomes?: StoryCorrespondence<A>[]
  /**
   * Path to the AST node relative to the view body ast.
   * Used to locate the scene in the source code. Mirrors `Step.astPath`.
   */
  readonly astPath: string
}

/**
 * Block kinds a story may contain. Only `alt` and its branches are implemented;
 * the rest are parsed and rejected by validation. `parallel` normalises to `par`.
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

export type AnyStoryStatement<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Scene: StoryScene<A>
  Alt: StoryAlt<A>
  Subflow: StorySubflow<A>
}>

export const storyGuards = {
  isScene: <A extends AnyAux>(s: AnyStoryStatement<A> | undefined | null): s is StoryScene<A> => {
    return !!s && 'view' in s
  },
  isAlt: <A extends AnyAux>(s: AnyStoryStatement<A> | undefined | null): s is StoryAlt<A> => {
    return !!s && _type in s && s[_type] === 'alt'
  },
  isSubflow: <A extends AnyAux>(s: AnyStoryStatement<A> | undefined | null): s is StorySubflow<A> => {
    return !!s && _type in s && s[_type] !== 'alt'
  },
}

export interface ParsedStoryView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
  [_type]: 'story'
  readonly sceneLayout?: StorySceneLayout
  readonly statements: AnyStoryStatement<A>[]
}
```

- [ ] **Step 5: Add the computed and layouted story views**

In `packages/core/src/types/view-computed.ts`, add the import and the interfaces after
`ComputedDynamicView`:

```ts
import type {
  AnyStoryStatement,
  StoryCorrespondence,
  StorySceneLayout,
} from './view-parsed.story'

/**
 * A scene resolved to a traversable position in the story.
 */
export interface ComputedStoryScene<A extends AnyAux = AnyAux> {
  /**
   * Hierarchical path, same format and ordering rules as `scalar.StepPath`.
   * e.g. `step-01`, `step-02:alt.01:when.01`
   */
  readonly id: scalar.StepPath
  readonly view: aux.StrictViewId<A>
  readonly title?: string | null
  readonly notes?: scalar.MarkdownOrString
  readonly becomes?: StoryCorrespondence<A>[]
  /**
   * Title of the nearest enclosing alt branch, if any. Shown in the panel so the
   * viewer knows they are inside a hypothetical.
   */
  readonly branchTitle?: string
  readonly astPath: string
}

export interface ComputedStoryView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'story'
  readonly sceneLayout: StorySceneLayout
  /**
   * Flattened scene list in traversal order.
   */
  readonly scenes: ReadonlyArray<ComputedStoryScene<A>>
  /**
   * Tree structure preserving `alt` blocks, for the outline panel.
   */
  readonly storyFlow: ReadonlyArray<AnyStoryStatement<A>>
}
```

In `packages/core/src/types/view-layouted.ts`, follow the existing pattern used for
`LayoutedDynamicView` to declare:

```ts
export interface LayoutedStoryView<A extends AnyAux = AnyAux> extends Omit<ComputedStoryView<A>, typeof _stage>
{
  readonly [_stage]: 'layouted'
}
```

Match the surrounding file's exact conventions for `_stage` and `_layout` — read
`LayoutedDynamicView` first and mirror it rather than trusting this snippet verbatim.

- [ ] **Step 6: Add to the unions and write the guard**

In `packages/core/src/types/view.ts`: add `ParsedStoryView` to the parsed union,
`ComputedStoryView` to the computed union, `LayoutedStoryView` to the layouted union, and to
`AnyView`. Then add the guard next to `isDynamicView`:

```ts
export function isStoryView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'story'> {
  return view[_type] === 'story'
}
```

In `packages/core/src/types/index.ts`, re-export the new module alongside the other
`view-parsed.*` exports.

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm vitest run packages/core/src/types/guards.spec.ts -t "isStoryView"`
Expected: PASS.

- [ ] **Step 8: Build core and inventory the breakage**

Run: `pnpm exec tsc --build`
Expected: FAILS with `nonexhaustive` / missing-case errors. **Record the full list of files and
line numbers in the commit message.** Expect at least
`packages/core/src/compute-view/compute-view.ts` (`unsafeComputeView`) and
`packages/layouts/src/graphviz/GraphvizLayoter.ts` (`getPrinter`). Tasks 5 and 8 close these; other
sites (generators) are out of scope and are handled in Task 13.

- [ ] **Step 9: Commit**

```bash
pnpm fmt
git add packages/core/src/types
git commit -m "feat(core): add story view types and isStoryView guard

Adds story to the parsed/computed/layouted view unions. This intentionally
breaks nonexhaustive dispatch sites; the list is the implementation checklist:
<paste the tsc --build error list here>"
```

---

### Task 2: Grammar rules and keyword compatibility

**Files:**

- Modify: `packages/language-server/src/like-c4.langium`
- Test: `packages/language-server/src/model/__tests__/story-view.spec.ts` (new)

**Interfaces:**

- Consumes: nothing from Task 1 (grammar is independent).
- Produces: generated AST types `ast.StoryView`, `ast.StoryViewBody`, `ast.StoryScene`,
  `ast.StorySceneBody`, `ast.StoryCorrespondenceRule`, `ast.ElementRefs`, `ast.StorySubflow`,
  `ast.StoryAlt`, `ast.StorySceneLayoutProperty`, plus guards `ast.isStoryView(node)` etc.

- [ ] **Step 1: Read the surrounding grammar**

Read `packages/language-server/src/like-c4.langium` lines 310-400 (view rules), 645-760
(`StepStatement`, `SubflowKind`, `SubflowStep`, `AltSteps`), and 1170-1195 (the `Id` rule). Note
that `SubflowStep` is **one** rule parameterised by `SubflowKind`, and that the `Id` rule re-admits
keywords as identifiers.

- [ ] **Step 2: Write the failing test**

Create `packages/language-server/src/model/__tests__/story-view.spec.ts`. Mirror the setup of a
neighbouring spec in that directory (read one first for the exact test-helper import and
`parse`/`validate` helper names — do not guess them):

```ts
describe('story view grammar', () => {
  it('parses a story with scenes, alt and becomes', async () => {
    const { diagnostics } = await parse(`
      specification {
        element system
      }
      model {
        system mono
        system orders
        system billing
      }
      views {
        view before { include mono }
        view after { include orders, billing }

        story migration {
          title 'Migration'
          sceneLayout anchored

          scene before {
            notes 'One deployable'
          }
          scene after {
            title 'Split out'
            mono becomes orders, billing
          }
          alt 'Two ways' {
            when 'fast' { scene after }
            else { scene before }
          }
        }
      }
    `)
    expect(diagnostics).toHaveLength(0)
  })

  it('still allows story, scene and becomes as element names', async () => {
    const { diagnostics } = await parse(`
      specification {
        element system
      }
      model {
        system story
        system scene
        system becomes
        system sceneLayout
      }
    `)
    expect(diagnostics).toHaveLength(0)
  })
})
```

The second test is the critical regression: it fails if the new keywords are not added to `Id`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/language-server/src/model/__tests__/story-view.spec.ts`
Expected: FAIL — parse errors on `story` / `scene`.

- [ ] **Step 4: Add the grammar rules**

In `like-c4.langium`, extend the view union (around line 318):

```langium
type LikeC4View = ElementView | DynamicView | DeploymentView | StoryView;

LikeC4ViewRule returns LikeC4View:
  DynamicView |
  DeploymentView |
  StoryView |
  ElementView;
```

Add the story rules after `DynamicViewBody`:

```langium
StoryView:
  'story' name=Id body=StoryViewBody?
;

StoryViewBody: '{'
  tags=Tags?
  props+=StoryViewProperty*
  statements+=StoryStatement*
'}'
;

StoryViewProperty:
  StorySceneLayoutProperty | ViewProperty
;

StorySceneLayoutProperty:
  key='sceneLayout' ':'? value=StorySceneLayoutValue ';'?
;

StorySceneLayoutValue returns string:
  'anchored' | 'independent' | 'unified';

StoryStatement:
  StoryScene | StoryAlt | StorySubflow
;

StoryScene:
  'scene' view=[LikeC4View] body=StorySceneBody? ';'?
;

StorySceneBody: '{'
  props+=(ViewStringProperty | NotesProperty)*
  rules+=StoryCorrespondenceRule*
'}'
;

StoryCorrespondenceRule:
  sources=ElementRefs 'becomes' targets=ElementRefs ';'?
;

ElementRefs:
  refs+=ElementRef (',' refs+=ElementRef)*
;

// Reuses the existing SubflowKind terminal set. One rule covers every block
// keyword, exactly as SubflowStep does for dynamic views.
StorySubflow:
  kind=SubflowKind title=String? '{'
    statements+=StoryStatement*
  '}'
;

StoryAlt:
  'alt' title=String? '{' branches+=StorySubflow* '}'
;
```

**Do NOT add a `StoryViewRef` rule, and do NOT widen `RelationNavigateToProperty`.** An earlier
revision of this plan specified `value=(DynamicViewRef | StoryViewRef)`; that is not implementable.
Both alternatives are syntactically identical bare cross-references, so Langium/Chevrotain always
reduces to the first and `navigateTo <storyName>` from a step fails with "Could not resolve
reference to DynamicView" — with no ambiguity warning from `langium generate`. Cut from the MVP.
Element-level `navigateTo` → story needs no grammar change at all, because `NavigateToProperty`
already uses `ViewRef` = `[LikeC4View]`.

Add the new keywords to `Id` (around line 1177) — **without this, Step 2's second test fails**:

```langium
Id returns string:
  IdTerminal |
  ElementShape |
  ThemeColor |
  ArrowType |
  LineOptions |
  Participant |
  SizeValue |
  DynamicViewDisplayVariantValue |
  DynamicViewFlowKeyword |
  StorySceneLayoutValue |
  IconPositionValue |
  RankValue |
  // Allow reserved keywords as Id
  'element' | 'model' | 'group' | 'node' | 'deployment' | 'instance' | 'relationship' |
  'story' | 'scene' | 'sceneLayout' | 'becomes';
```

`try` / `catch` / `finally` is deliberately **not** admitted — see RFC 0001, "Flow control beyond
`alt`".

- [ ] **Step 5: Regenerate the parser**

Run: `pnpm generate`
Expected: succeeds; `packages/language-server/src/generated/ast.ts` now contains `StoryView`.
Verify with: `grep -c "StoryView" packages/language-server/src/generated/ast.ts` — expect a non-zero
count.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run packages/language-server/src/model/__tests__/story-view.spec.ts`
Expected: both tests PASS.

- [ ] **Step 7: Commit**

```bash
pnpm fmt
# NOTE: packages/language-server/src/generated/ is gitignored (.gitignore:44).
# Do NOT force-add it. Anyone building this branch runs `pnpm generate` to produce it.
git add packages/language-server/src/like-c4.langium \
        packages/language-server/src/model/__tests__/story-view.spec.ts
git commit -m "feat(lsp): add story view grammar

StorySubflow reuses SubflowKind so one rule covers every block keyword.
Adds story/scene/sceneLayout/becomes to the Id rule so they remain usable
as element names, with a regression test."
```

---

### Task 3: AST mapping and `parseStoryView`

**Files:**

- Modify: `packages/language-server/src/ast.ts`
- Modify: `packages/language-server/src/model/parser/ViewsParser.ts`
- Test: `packages/language-server/src/model/__tests__/story-view.spec.ts` (append)

**Interfaces:**

- Consumes: Task 1's `AnyStoryStatement`, `StoryScene`, `StorySceneLayout`; Task 2's `ast.StoryView`.
- Produces: `ParsedAstStoryView` (shape identical to `ParsedStoryView` plus `id`, `astPath`,
  `title`, `description`, `tags`, `links`, `order`); `ViewsParser#parseStoryView(astNode)`.

- [ ] **Step 1: Read the parser you are mirroring**

Read `packages/language-server/src/model/parser/ViewsParser.ts` — the `parseViews` dispatch
(lines 33-73), `parseDynamicElementView` (lines 261-313), and `pathInsideDynamicView` (line 631).
Note that `astPath` is an **AST container path** like `/statements@0`, produced by walking
`$container`, and is _not_ the `step-NN` id. Scene ids are assigned in Task 5.

- [ ] **Step 2: Write the failing test**

Append to `packages/language-server/src/model/__tests__/story-view.spec.ts`:

```ts
it('parses a story into ParsedAstStoryView', async () => {
  const { views } = await parseModel(`
    specification { element system }
    model {
      system mono
      system orders
      system billing
    }
    views {
      view before { include mono }
      view after { include orders, billing }
      story migration {
        title 'Migration'
        sceneLayout independent
        scene before { notes 'One deployable' }
        scene after { mono becomes orders, billing }
      }
    }
  `)
  const story = views.find(v => v.id === 'migration')
  expect(story).toMatchObject({
    id: 'migration',
    title: 'Migration',
    sceneLayout: 'independent',
  })
  expect(story!.statements).toHaveLength(2)
  expect(story!.statements[0]).toMatchObject({ view: 'before', notes: 'One deployable' })
  expect(story!.statements[1]).toMatchObject({
    view: 'after',
    becomes: [{ sources: ['mono'], targets: ['orders', 'billing'] }],
  })
})
```

Use whichever helper the neighbouring specs use to reach parsed views (read one first; it may be
`parseModel`, or `doc.c4Views` off a parse result). Do not invent a helper name.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/language-server/src/model/__tests__/story-view.spec.ts -t "ParsedAstStoryView"`
Expected: FAIL — story view is not produced (`story` is `undefined`).

- [ ] **Step 4: Declare the AST-side type**

In `packages/language-server/src/ast.ts`, add to the `idattr` module declaration block
(around line 41):

```ts
export interface StoryView {
  [idattr]?: c4.ViewId | undefined
}
```

Add the parsed type next to `ParsedAstDynamicView`:

```ts
export interface ParsedAstStoryView {
  [c4._type]: 'story'
  id: c4.ViewId
  astPath: string
  title: string | null
  description: c4.MarkdownOrString | null
  /**
   * Optional per-view navigation order.
   */
  order?: number
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  sceneLayout: c4.StorySceneLayout | undefined
  statements: c4.AnyStoryStatement[]
}
```

Extend the union:

```ts
export type ParsedAstView =
  | ParsedAstElementView
  | ParsedAstDynamicView
  | ParsedAstDeploymentView
  | ParsedAstStoryView
```

- [ ] **Step 5: Implement the parser**

In `ViewsParser.ts`, add the dispatch case in `parseViews` before the `default`:

```ts
case ast.isStoryView(view):
  this.doc.c4Views.push(this.parseStoryView(view))
  break
```

Add the method, mirroring `parseDynamicElementView`'s id/title/tags/links handling:

```ts
parseStoryView(astNode: ast.StoryView): ParsedAstStoryView {
  const body = astNode.body
  invariant(body, 'StoryView body is not defined')
  const isValid = this.isValid
  const props = body.props.filter(isValid)
  const astPath = this.getAstNodePath(astNode)

  let id = astNode.name
  if (!id) {
    id = 'story_' + stringHash(this.doc.uri.toString(), astPath) as c4.ViewId
  }

  const { title = null, description = null } = this.parseBaseProps(
    pipe(
      props,
      filter(ast.isViewStringProperty),
      mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
    ),
  )

  const tags = this.convertTags(body)
  const links = this.convertLinks(body)
  const order = parseViewOrder(props.find(ast.isViewOrderProperty))

  ViewOps.writeId(astNode, id as c4.ViewId)

  const sceneLayout = find(props, ast.isStorySceneLayoutProperty)?.value as
    | c4.StorySceneLayout
    | undefined

  return {
    [c4._type]: 'story',
    id: id as c4.ViewId,
    astPath,
    title: toSingleLine(title) ?? null,
    description,
    ...(order !== undefined && { order }),
    tags,
    links: isNonEmptyArray(links) ? links : null,
    sceneLayout,
    statements: this.tryMap('views', body.statements, n => this.parseStoryStatement(n)),
  }
}

parseStoryStatement(node: ast.StoryStatement): c4.AnyStoryStatement {
  switch (true) {
    case ast.isStoryScene(node):
      return this.parseStoryScene(node)
    case ast.isStoryAlt(node):
      return this.parseStoryAlt(node)
    case ast.isStorySubflow(node):
      return this.parseStorySubflow(node)
    default:
      nonexhaustive(node)
  }
}

parseStoryScene(node: ast.StoryScene): c4.StoryScene {
  const viewId = nonNullable(
    ViewOps.readId(node.view.ref!),
    `Story scene view "${node.view.$refText}" not resolved`,
  )
  const body = node.body
  const props = body?.props.filter(this.isValid) ?? []

  const { title = null } = this.parseBaseProps(
    pipe(
      props,
      filter(ast.isViewStringProperty),
      mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
    ),
  )
  const notes = find(props, ast.isNotesProperty)?.value

  const becomes = (body?.rules ?? [])
    .filter(this.isValid)
    .map(rule => this.parseStoryCorrespondence(rule))

  return c4.exact({
    view: viewId,
    title: toSingleLine(title) ?? null,
    notes: notes ? parseMarkdownAsString(notes) : undefined,
    becomes: isNonEmptyArray(becomes) ? becomes : undefined,
    astPath: this.getAstNodePath(node),
  })
}

parseStoryCorrespondence(rule: ast.StoryCorrespondenceRule): c4.StoryCorrespondence {
  const toFqns = (refs: ast.ElementRefs) =>
    refs.refs.map(r => this.resolveFqn(nonNullable(elementRef(r), 'Element ref not resolved')))

  const sources = toFqns(rule.sources)
  const targets = toFqns(rule.targets)
  invariant(isNonEmptyArray(sources), '"becomes" requires at least one source')
  invariant(isNonEmptyArray(targets), '"becomes" requires at least one target')
  return { sources, targets }
}

parseStoryAlt(node: ast.StoryAlt): c4.StoryAlt {
  const branches = node.branches
    .filter(this.isValid)
    .map(b => this.parseStoryAltBranch(b))
  invariant(isNonEmptyArray(branches), 'Story alt must have at least one branch')
  return c4.exact({
    [c4._type]: 'alt',
    title: node.title,
    branches,
  })
}

parseStoryAltBranch(node: ast.StorySubflow): c4.StoryAltBranch {
  const statements = this.tryMap('views', node.statements, n => this.parseStoryStatement(n))
  invariant(isNonEmptyArray(statements), 'Story alt branch must have at least one statement')
  return c4.exact({
    [c4._type]: node.kind as c4.StoryAltBranchKind,
    title: node.title,
    statements,
  })
}

parseStorySubflow(node: ast.StorySubflow): c4.StorySubflow {
  const statements = this.tryMap('views', node.statements, n => this.parseStoryStatement(n))
  invariant(isNonEmptyArray(statements), 'Story block must have at least one statement')
  // `parallel` normalises to `par`, matching dynamic views
  const kind = (node.kind === 'parallel' ? 'par' : node.kind) as c4.StorySubflowKind
  return c4.exact({
    [c4._type]: kind,
    title: node.title,
    statements,
  })
}
```

Add `nonNullable` to the `@likec4/core` import and `ParsedAstStoryView` to the `../../ast` import.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run packages/language-server/src/model/__tests__/story-view.spec.ts`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
pnpm fmt
git add packages/language-server/src/ast.ts \
        packages/language-server/src/model/parser/ViewsParser.ts \
        packages/language-server/src/model/__tests__/story-view.spec.ts
git commit -m "feat(lsp): parse story views into ParsedAstStoryView

parallel normalises to par, matching dynamic views."
```

---

### Task 4: Validations

**Files:**

- Create: `packages/language-server/src/validation/story-view.ts`
- Create: `packages/language-server/src/validation/story-view.spec.ts`
- Modify: `packages/language-server/src/validation/index.ts`

**Interfaces:**

- Consumes: Task 2's `ast.StoryScene`, `ast.StorySubflow`, `ast.StoryAlt`, `ast.StoryView`.
- Produces: `storySceneChecks(services)`, `storySubflowChecks(services)`, `storyViewChecks(services)`
  — all `ValidationCheck<T>`.

- [ ] **Step 1: Read an existing check**

Read `packages/language-server/src/validation/dynamic-view.ts` (especially `subflowStep`, line 60)
and `packages/language-server/src/validation/index.ts` lines 155-200 for the registry pattern. Note
the `tryOrLog` wrapper and the `accept('error', msg, { node, property })` signature.

- [ ] **Step 2: Write the failing tests**

Create `packages/language-server/src/validation/story-view.spec.ts`, mirroring the setup of
`dynamic-view.spec.ts` (read it first for the exact helper import):

```ts
describe('story view validation', () => {
  const preamble = `
    specification { element system }
    model {
      system a
      system b
    }
    views {
      view v1 { include a }
      story other { scene v1 }
  `

  it('rejects a scene targeting a story', async () => {
    const { errors } = await validate(`${preamble}
      story s { scene other }
    }`)
    expect(errors).toContain('A scene can not reference a story view')
  })

  it('rejects an empty alt', async () => {
    const { errors } = await validate(`${preamble}
      story s { scene v1; alt { } }
    }`)
    expect(errors).toContain('Alt must have at least one branch')
  })

  it('rejects block kinds that are not yet supported', async () => {
    for (const kind of ['opt', 'loop', 'par', 'break']) {
      const { errors } = await validate(`${preamble}
        story s { ${kind} { scene v1 } }
      }`)
      expect(errors).toContain(`"${kind}" is not yet supported in stories`)
    }
  })

  it('rejects a non-branch block directly inside alt', async () => {
    const { errors } = await validate(`${preamble}
      story s { alt { opt { scene v1 } } }
    }`)
    expect(errors).toContain(
      '"opt" can not be used as an alternative branch, only "if", "when" or "else" are allowed',
    )
  })

  it('rejects an alt branch outside alt', async () => {
    const { errors } = await validate(`${preamble}
      story s { when 'x' { scene v1 } }
    }`)
    expect(errors).toContain('"when" alternative branch must be inside "alt"')
  })

  it('warns when a story has no scenes', async () => {
    const { warnings } = await validate(`${preamble}
      story s { }
    }`)
    expect(warnings).toContain('Story has no scenes')
  })

  it('accepts a valid story', async () => {
    const { errors, warnings } = await validate(`${preamble}
      story s {
        scene v1
        alt { when 'x' { scene v1 } else { scene v1 } }
      }
    }`)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run packages/language-server/src/validation/story-view.spec.ts`
Expected: FAIL — no diagnostics produced.

- [ ] **Step 4: Implement the checks**

Create `packages/language-server/src/validation/story-view.ts`:

```ts
import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { tryOrLog } from './_shared'

const IMPLEMENTED_BRANCH_KINDS = ['when', 'if', 'else'] as const

const isAltBranchKind = (kind: string): boolean =>
  IMPLEMENTED_BRANCH_KINDS.includes(kind as typeof IMPLEMENTED_BRANCH_KINDS[number])

export const storySceneChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryScene> => {
  return tryOrLog((el, accept) => {
    const target = el.view.ref
    if (target && ast.isStoryView(target)) {
      accept('error', 'A scene can not reference a story view', {
        node: el,
        property: 'view',
      })
    }
  })
}

export const storySubflowChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StorySubflow> => {
  return tryOrLog((el, accept) => {
    const insideAlt = ast.isStoryAlt(el.$container)

    if (isAltBranchKind(el.kind)) {
      if (!insideAlt) {
        accept('error', `"${el.kind}" alternative branch must be inside "alt"`, {
          node: el,
          property: 'kind',
        })
      }
      return
    }

    if (insideAlt) {
      accept(
        'error',
        `"${el.kind}" can not be used as an alternative branch, only "if", "when" or "else" are allowed`,
        { node: el, property: 'kind' },
      )
      return
    }

    // Parsed for forward compatibility, gated until implemented. See RFC 0001.
    accept('error', `"${el.kind}" is not yet supported in stories`, {
      node: el,
      property: 'kind',
    })
  })
}

export const storyViewChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryView> => {
  const hasScene = (statements: ast.StoryStatement[]): boolean =>
    statements.some(s => {
      switch (true) {
        case ast.isStoryScene(s):
          return true
        case ast.isStoryAlt(s):
          return s.branches.some(b => hasScene(b.statements))
        case ast.isStorySubflow(s):
          return hasScene(s.statements)
        default:
          return false
      }
    })

  return tryOrLog((el, accept) => {
    const statements = el.body?.statements ?? []
    if (!hasScene(statements)) {
      accept('warning', 'Story has no scenes', { node: el, property: 'name' })
    }
  })
}

export const storyAltChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryAlt> => {
  return tryOrLog((el, accept) => {
    if (el.branches.length === 0) {
      accept('error', 'Alt must have at least one branch', { node: el })
    }
  })
}
```

Verify `tryOrLog` is actually exported from `./_shared` before relying on it; if the neighbouring
checks import it from elsewhere, follow them.

- [ ] **Step 5: Register the checks**

In `packages/language-server/src/validation/index.ts`, add the import and four registry entries
inside the existing `registry.register<ast.LikeC4AstType>({ ... })` call:

```ts
import {
  storyAltChecks,
  storySceneChecks,
  storySubflowChecks,
  storyViewChecks,
} from './story-view'
```

```ts
StoryView: storyViewChecks(services),
StoryScene: storySceneChecks(services),
StorySubflow: storySubflowChecks(services),
StoryAlt: storyAltChecks(services),
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run packages/language-server/src/validation/story-view.spec.ts`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
pnpm fmt
git add packages/language-server/src/validation
git commit -m "feat(lsp): validate story views

Unimplemented block kinds parse but fail validation with an explicit
'not yet supported in stories' diagnostic, so RFC 0001's speculative
syntax gives a meaningful error rather than a parse failure."
```

---

### Task 5: `computeStoryView`

**Files:**

- Create: `packages/core/src/compute-view/story-view/compute.ts`
- Create: `packages/core/src/compute-view/story-view/compute.spec.ts`
- Modify: `packages/core/src/compute-view/compute-view.ts`

**Interfaces:**

- Consumes: Task 1's `ParsedStoryView`, `ComputedStoryView`, `ComputedStoryScene`, `storyGuards`.
- Produces: `computeStoryView(likec4model, parsed): ComputedStoryView`.

- [ ] **Step 1: Read the StepPath constructor**

Read `packages/core/src/types/scalar.ts` lines 147-202. `StepPath(...segments)` takes numbers
(zero-padded to 2) and `[number, string]` tuples (rendered `NN:kind`), joining with `.` and
prefixing `step-`. So `StepPath(1)` → `step-01` and `StepPath([2, 'alt'], [1, 'when'], 1)` →
`step-02:alt.01:when.01`. Segments containing `:` are what `parentFlow` and `flowAncestors` treat
as flows.

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/compute-view/story-view/compute.spec.ts`:

```ts
describe('computeStoryView', () => {
  it('assigns sequential scene paths and defaults sceneLayout to anchored', () => {
    const view = computeStoryView(model, {
      [_type]: 'story',
      id: 's' as ViewId,
      title: null,
      description: null,
      tags: null,
      links: null,
      statements: [
        { view: 'v1' as ViewId, astPath: '/statements@0' },
        { view: 'v2' as ViewId, astPath: '/statements@1' },
      ],
    })

    expect(view.sceneLayout).toBe('anchored')
    expect(view.nodes).toEqual([])
    expect(view.edges).toEqual([])
    expect(view.scenes.map(s => s.id)).toEqual(['step-01', 'step-02'])
    expect(view.scenes.map(s => s.view)).toEqual(['v1', 'v2'])
  })

  it('nests alt branches into hierarchical paths and records the branch title', () => {
    const view = computeStoryView(model, {
      [_type]: 'story',
      id: 's' as ViewId,
      title: null,
      description: null,
      tags: null,
      links: null,
      statements: [
        { view: 'v1' as ViewId, astPath: '/statements@0' },
        {
          [_type]: 'alt',
          branches: [
            {
              [_type]: 'when',
              title: 'fast',
              statements: [{ view: 'v2' as ViewId, astPath: '/x' }],
            },
            {
              [_type]: 'else',
              statements: [{ view: 'v1' as ViewId, astPath: '/y' }],
            },
          ],
        },
      ],
    })

    expect(view.scenes.map(s => s.id)).toEqual([
      'step-01',
      'step-02:alt.01:when.01',
      'step-02:alt.02:else.01',
    ])
    expect(view.scenes[1]!.branchTitle).toBe('fast')
  })
})
```

Build `model` with `Builder` (`packages/core/src/builder/Builder.ts`) declaring two element views
`v1` and `v2` — read an existing `compute-view` spec in
`packages/core/src/compute-view/element-view/` for the exact `Builder` idiom rather than guessing.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/core/src/compute-view/story-view/compute.spec.ts`
Expected: FAIL — `computeStoryView` is not defined.

- [ ] **Step 4: Implement it**

Create `packages/core/src/compute-view/story-view/compute.ts`:

```ts
import type { LikeC4Model } from '../../model'
import {
  type AnyStoryStatement,
  type ComputedStoryScene,
  type ComputedStoryView,
  type ParsedStoryView,
  type scalar,
  _stage,
  _type,
  StepPath,
  storyGuards,
} from '../../types'
import type { Any } from '../../types/_aux'
import { nonexhaustive } from '../../utils'
import { calcViewLayoutHash } from '../utils/view-hash'

/**
 * Computes a story view.
 *
 * A story owns no geometry: `nodes` and `edges` are always empty, and each scene
 * defers to the view it names. This keeps the layout pipeline untouched and makes
 * manual-layout drift inapplicable by construction. See RFC 0001.
 */
export function computeStoryView<A extends Any>(
  _likec4model: LikeC4Model<any>,
  parsed: ParsedStoryView<A>,
): ComputedStoryView<A> {
  const scenes: ComputedStoryScene<A>[] = []

  const walk = (
    statements: readonly AnyStoryStatement<A>[],
    prefix: ReadonlyArray<number | [number, string]>,
    branchTitle: string | undefined,
  ): void => {
    statements.forEach((statement, index) => {
      const position = index + 1
      switch (true) {
        case storyGuards.isScene(statement): {
          scenes.push({
            id: StepPath(...prefix, position) as scalar.StepPath,
            view: statement.view,
            title: statement.title ?? null,
            ...(statement.notes !== undefined && { notes: statement.notes }),
            ...(statement.becomes !== undefined && { becomes: statement.becomes }),
            ...(branchTitle !== undefined && { branchTitle }),
            astPath: statement.astPath,
          })
          return
        }
        case storyGuards.isAlt(statement): {
          statement.branches.forEach((branch, branchIndex) => {
            walk(
              branch.statements,
              [...prefix, [position, 'alt'], [branchIndex + 1, branch[_type]]],
              branch.title ?? statement.title ?? branchTitle,
            )
          })
          return
        }
        case storyGuards.isSubflow(statement): {
          // Unreachable in the MVP: validation rejects every non-alt block kind.
          walk(
            statement.statements,
            [...prefix, [position, statement[_type]]],
            statement.title ?? branchTitle,
          )
          return
        }
        default:
          nonexhaustive(statement)
      }
    })
  }

  walk(parsed.statements, [], undefined)

  const { sceneLayout = 'anchored', statements, ...props } = parsed

  return calcViewLayoutHash({
    ...props,
    [_stage]: 'computed',
    [_type]: 'story',
    sceneLayout,
    scenes,
    storyFlow: statements,
    nodes: [],
    edges: [],
    autoLayout: { direction: 'TopBottom' },
  }) as ComputedStoryView<A>
}
```

Check `calcViewLayoutHash`'s real name and signature in
`packages/core/src/compute-view/utils/view-hash.ts` and how `computeDynamicView` calls it; mirror
that exactly. Likewise confirm the `autoLayout` default shape used elsewhere.

- [ ] **Step 5: Wire the dispatch**

In `packages/core/src/compute-view/compute-view.ts`, add the import and the case in
`unsafeComputeView`:

```ts
import { computeStoryView } from './story-view/compute'
```

```ts
case isStoryView(viewsource):
  return computeStoryView(likec4model, viewsource)
```

Add `isStoryView` to the existing `../types` import.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run packages/core/src/compute-view/story-view/compute.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
pnpm fmt
git add packages/core/src/compute-view
git commit -m "feat(core): compute story views

Assigns hierarchical scene paths via StepPath so parentFlow and
flowAncestors work unchanged. Stories carry no geometry."
```

---

### Task 6: `StoryFlow` traversal

**Files:**

- Create: `packages/core/src/types/view-story-flow.ts`
- Create: `packages/core/src/types/view-story-flow.spec.ts`
- Modify: `packages/core/src/types/index.ts`

**Interfaces:**

- Consumes: Task 1's `ComputedStoryView`, `ComputedStoryScene`.
- Produces: `class StoryFlow` with `static from(view)`, `scenes: readonly ComputedStoryScene[]`,
  `firstScene(): scalar.StepPath | null`, `lastScene(): scalar.StepPath | null`,
  `lookup(id): ComputedStoryScene | undefined`,
  `prevAndNext(id): { prev: scalar.StepPath | null; next: scalar.StepPath | null }`;
  plus `storyFlow(view): StoryFlow`.

- [ ] **Step 1: Read the class you are mirroring**

Read `packages/core/src/types/view-dynamic-flow.ts`, specifically the `DynamicViewFlow` class
(line 732) — its `DefaultWeakMap` cache, `from()` factory, and `prevAndNext` contract.

**Note the deliberate duplication.** `walkthroughFlow` cannot be reused: it requires edge lookups
(`edgesmap.get(step)` under `nonNullable`, lines 563-573), and scenes are not edges. Generalising it
with a pluggable resolver would touch a snapshot-tested file. `StoryFlow` therefore has its own
traversal, with a TODO recording the refactor. This is a POC-scoped decision from RFC 0001.

Because `computeStoryView` already flattens scenes **in traversal order**, `StoryFlow` does not need
to re-walk the tree — `prevAndNext` is an index lookup over `view.scenes`.

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/types/view-story-flow.spec.ts`:

```ts
const view = {
  [_type]: 'story',
  scenes: [
    { id: 'step-01', view: 'v1', astPath: '/a' },
    { id: 'step-02:alt.01:when.01', view: 'v2', astPath: '/b' },
    { id: 'step-02:alt.02:else.01', view: 'v3', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

describe('StoryFlow', () => {
  it('returns the first and last scenes', () => {
    const flow = StoryFlow.from(view)
    expect(flow.firstScene()).toBe('step-01')
    expect(flow.lastScene()).toBe('step-02:alt.02:else.01')
  })

  it('walks depth-first through alt branches', () => {
    const flow = StoryFlow.from(view)
    expect(flow.prevAndNext('step-01')).toEqual({
      prev: null,
      next: 'step-02:alt.01:when.01',
    })
    expect(flow.prevAndNext('step-02:alt.01:when.01')).toEqual({
      prev: 'step-01',
      next: 'step-02:alt.02:else.01',
    })
    expect(flow.prevAndNext('step-02:alt.02:else.01')).toEqual({
      prev: 'step-02:alt.01:when.01',
      next: null,
    })
  })

  it('looks a scene up by path', () => {
    expect(StoryFlow.from(view).lookup('step-02:alt.01:when.01')?.view).toBe('v2')
  })

  it('returns nulls for an unknown path', () => {
    expect(StoryFlow.from(view).prevAndNext('step-99')).toEqual({ prev: null, next: null })
  })

  it('caches per view instance', () => {
    expect(StoryFlow.from(view)).toBe(StoryFlow.from(view))
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/core/src/types/view-story-flow.spec.ts`
Expected: FAIL — `StoryFlow` is not defined.

- [ ] **Step 4: Implement it**

Create `packages/core/src/types/view-story-flow.ts`:

```ts
import { DefaultWeakMap } from '../utils'
import type * as scalar from './scalar'
import type { ComputedStoryScene, ComputedStoryView } from './view-computed'

/**
 * Traversal over a story's scenes.
 *
 * TODO: this duplicates the tree-walk in `walkthroughFlow`. That walker cannot be
 * reused because it resolves every step to an edge, and scenes are not edges. The
 * correct fix is to generalise `walkthroughFlow` with a pluggable step resolver;
 * it was deferred to avoid refactoring a snapshot-tested file during the POC.
 * See RFC 0001, "StoryFlow".
 */
export class StoryFlow {
  private static cache = new DefaultWeakMap((view: ComputedStoryView<any>) => new StoryFlow(view))

  public static from(view: ComputedStoryView<any>): StoryFlow {
    return this.cache.get(view)
  }

  private readonly byId: ReadonlyMap<scalar.StepPath, number>

  private constructor(public readonly view: ComputedStoryView<any>) {
    this.byId = new Map(view.scenes.map((scene, index) => [scene.id, index]))
  }

  get scenes(): ReadonlyArray<ComputedStoryScene<any>> {
    return this.view.scenes
  }

  firstScene(): scalar.StepPath | null {
    return this.view.scenes[0]?.id ?? null
  }

  lastScene(): scalar.StepPath | null {
    return this.view.scenes.at(-1)?.id ?? null
  }

  lookup(id: scalar.StepPath): ComputedStoryScene<any> | undefined {
    const index = this.byId.get(id)
    return index === undefined ? undefined : this.view.scenes[index]
  }

  /**
   * Previous and next scene in depth-first traversal order.
   *
   * Scenes are already flattened in traversal order by `computeStoryView`, so alt
   * branches are visited one after another — matching dynamic-view `alt` semantics.
   */
  prevAndNext(id: scalar.StepPath): {
    prev: scalar.StepPath | null
    next: scalar.StepPath | null
  } {
    const index = this.byId.get(id)
    if (index === undefined) {
      return { prev: null, next: null }
    }
    return {
      prev: this.view.scenes[index - 1]?.id ?? null,
      next: this.view.scenes[index + 1]?.id ?? null,
    }
  }
}

export function storyFlow(view: ComputedStoryView<any>): StoryFlow {
  return StoryFlow.from(view)
}
```

Confirm `DefaultWeakMap` is exported from `../utils` (it is used the same way at
`view-dynamic-flow.ts:733`). Export the module from `packages/core/src/types/index.ts`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/core/src/types/view-story-flow.spec.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
pnpm fmt
git add packages/core/src/types/view-story-flow.ts \
        packages/core/src/types/view-story-flow.spec.ts \
        packages/core/src/types/index.ts
git commit -m "feat(core): add StoryFlow scene traversal

Deliberately duplicates walkthroughFlow's traversal; that walker resolves
every step to an edge and scenes are not edges. TODO in-file records the
resolver refactor."
```

---

### Task 7: Scene alignment math

**Files:**

- Create: `packages/core/src/story/align.ts`
- Create: `packages/core/src/story/align.spec.ts`
- Modify: `packages/core/src/index.ts` (or the nearest barrel — check what `packages/core` exports)

**Interfaces:**

- Consumes: Task 1's `StorySceneLayout`.
- Produces:
  `calcSceneOffset(outgoing: ReadonlyMap<string, XYPoint>, incoming: ReadonlyMap<string, XYPoint>, mode: StorySceneLayout): XYPoint`
  where `XYPoint` is `{ x: number; y: number }` from `packages/core/src/types/geometry` (verify the
  exact export path).

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/story/align.spec.ts`:

```ts
const pt = (x: number, y: number) => ({ x, y })

describe('calcSceneOffset', () => {
  it('returns zero when the scenes share no elements', () => {
    const out = new Map([['a', pt(0, 0)]])
    const inc = new Map([['b', pt(500, 500)]])
    expect(calcSceneOffset(out, inc, 'anchored')).toEqual(pt(0, 0))
  })

  it('pins exactly when one element is shared', () => {
    const out = new Map([['a', pt(100, 200)]])
    const inc = new Map([['a', pt(400, 50)]])
    expect(calcSceneOffset(out, inc, 'anchored')).toEqual(pt(-300, 150))
  })

  it('aligns centroids when several elements are shared', () => {
    // outgoing centroid (10, 10); incoming centroid (110, 60)
    const out = new Map([['a', pt(0, 0)], ['b', pt(20, 20)]])
    const inc = new Map([['a', pt(100, 50)], ['b', pt(120, 70)], ['c', pt(999, 999)]])
    expect(calcSceneOffset(out, inc, 'anchored')).toEqual(pt(-100, -50))
  })

  it('forces zero in independent mode even when elements are shared', () => {
    const out = new Map([['a', pt(100, 200)]])
    const inc = new Map([['a', pt(400, 50)]])
    expect(calcSceneOffset(out, inc, 'independent')).toEqual(pt(0, 0))
  })

  it('rounds to whole pixels', () => {
    const out = new Map([['a', pt(0, 0)], ['b', pt(1, 1)]])
    const inc = new Map([['a', pt(10, 10)], ['b', pt(11, 12)]])
    const offset = calcSceneOffset(out, inc, 'anchored')
    expect(Number.isInteger(offset.x)).toBe(true)
    expect(Number.isInteger(offset.y)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/core/src/story/align.spec.ts`
Expected: FAIL — `calcSceneOffset` is not defined.

- [ ] **Step 3: Implement it**

Create `packages/core/src/story/align.ts`:

```ts
import type { XYPoint } from '../types/geometry'
import type { StorySceneLayout } from '../types/view-parsed.story'

const ZERO: XYPoint = { x: 0, y: 0 }

function centroid(points: readonly XYPoint[]): XYPoint {
  let x = 0
  let y = 0
  for (const p of points) {
    x += p.x
    y += p.y
  }
  return { x: x / points.length, y: y / points.length }
}

/**
 * Translation applied to an incoming scene so that elements present in both
 * scenes move as little as possible.
 *
 * Translation only — no scale, no rotation. Scaling would render the same element
 * at different sizes across scenes, which reads as a zoom rather than continuity.
 * Centroid alignment is the least-squares optimum for a translation-only fit, so
 * it degrades predictably: one shared element pins exactly, many minimise mean
 * displacement.
 *
 * @param outgoing positions of the scene currently on screen, keyed by node id
 * @param incoming positions from the incoming scene's own layout, keyed by node id
 * @returns offset to add to every incoming position; `{x: 0, y: 0}` when the
 *          scenes share nothing, which makes the transition a pure crossfade
 */
export function calcSceneOffset(
  outgoing: ReadonlyMap<string, XYPoint>,
  incoming: ReadonlyMap<string, XYPoint>,
  mode: StorySceneLayout,
): XYPoint {
  if (mode !== 'anchored') {
    return ZERO
  }

  const from: XYPoint[] = []
  const to: XYPoint[] = []
  for (const [id, target] of incoming) {
    const source = outgoing.get(id)
    if (source) {
      from.push(source)
      to.push(target)
    }
  }

  if (from.length === 0) {
    return ZERO
  }

  const a = centroid(from)
  const b = centroid(to)
  return {
    x: Math.round(a.x - b.x),
    y: Math.round(a.y - b.y),
  }
}
```

Verify `XYPoint`'s real import path — `packages/core/src/types/geometry` is used elsewhere as
`@likec4/core/geometry`; check `packages/core/package.json` exports and match how
`packages/diagram/src/likec4diagram/state/assign.ts` imports it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run packages/core/src/story/align.spec.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
pnpm fmt
git add packages/core/src/story packages/core/src/index.ts
git commit -m "feat(core): add translation-only scene alignment

Centroid alignment is the least-squares optimum for a translation-only fit.
Scaling is deliberately excluded: it would render the same element at
different sizes across scenes."
```

---

### Task 8: Layouter bypass for stories

**Files:**

- Modify: `packages/layouts/src/graphviz/GraphvizLayoter.ts`
- Test: `packages/layouts/src/graphviz/story-view.spec.ts` (new)

**Interfaces:**

- Consumes: Task 1's `isStoryView`, `LayoutedStoryView`; Task 5's `ComputedStoryView`.
- Produces: `GraphvizLayoter#layout()` returning `{ dot: '' as DotSource, diagram }` for stories.

- [ ] **Step 1: Read the layout entry point**

Read `packages/layouts/src/graphviz/GraphvizLayoter.ts` — `getPrinter` (line 39) and `layout`
(line 130). A story has **no DOT representation at all**, so the bypass must come _before_
`this.dot(params)`; adding a `story` case to `getPrinter` alone is not sufficient.

- [ ] **Step 2: Write the failing test**

Create `packages/layouts/src/graphviz/story-view.spec.ts`:

```ts
describe('GraphvizLayoter with story views', () => {
  it('returns the story unchanged, stamped as layouted, with empty dot', async () => {
    const story = {
      [_stage]: 'computed',
      [_type]: 'story',
      id: 's' as ViewId,
      title: null,
      description: null,
      tags: null,
      links: null,
      sceneLayout: 'anchored',
      scenes: [{ id: 'step-01', view: 'v1', astPath: '/a' }],
      storyFlow: [],
      nodes: [],
      edges: [],
      autoLayout: { direction: 'TopBottom' },
    } as unknown as ComputedStoryView

    const layoter = new GraphvizLayoter(new GraphvizWasmAdapter())
    const { dot, diagram } = await layoter.layout({ view: story, styles })

    expect(dot).toBe('')
    expect(diagram[_stage]).toBe('layouted')
    expect(diagram[_type]).toBe('story')
    expect(diagram.scenes).toEqual(story.scenes)
  })
})
```

Read an existing spec in that directory (e.g. `ElementViewPrinter.spec.ts`) for how `styles` and the
adapter are constructed; reuse that setup rather than inventing it.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/layouts/src/graphviz/story-view.spec.ts`
Expected: FAIL — `nonexhaustive` throws from `getPrinter`, or a DOT-generation error.

- [ ] **Step 4: Implement the bypass**

In `GraphvizLayoter.ts`, add the guard as the first statement inside `layout()`:

```ts
async layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>> {
  const logger = this.newScopedLogger('layout')

  // A story owns no geometry — each scene defers to the view it names — so there
  // is no DOT to generate. See RFC 0001.
  if (isStoryView(params.view)) {
    return {
      dot: '' as DotSource,
      diagram: {
        ...params.view,
        [_stage]: 'layouted',
      } as unknown as DiagramView<A>,
    }
  }

  try {
    // ...existing body unchanged
```

Add `isStoryView` and `_stage` to the `@likec4/core` imports. Apply the same guard to `aiLayout()`
if it is reachable for stories; if it is only invoked from an editor path that stories cannot enter,
leave it and note why in the commit message.

`getPrinter` still needs a `story` case to satisfy `nonexhaustive`. Make it throw, because reaching
it means the bypass was skipped:

```ts
case isStoryView(view):
  throw new Error(`Story views have no DOT representation: ${view.id}`)
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/layouts/src/graphviz/story-view.spec.ts`
Expected: PASS.

- [ ] **Step 6: Verify the whole build compiles**

Run: `pnpm exec tsc --build`
Expected: PASS, **except** for generator packages, which Task 13 handles. If any other package
fails, fix it here — the goal is that only the deliberately-deferred sites remain broken.

- [ ] **Step 7: Commit**

```bash
pnpm fmt
git add packages/layouts/src/graphviz
git commit -m "feat(layouts): bypass layout for story views

Stories have no DOT representation, so the bypass precedes dot generation.
getPrinter throws for stories: reaching it means the bypass was skipped."
```

---

### Task 9: Composite story cursor

**Files:**

- Create: `packages/core/src/story/cursor.ts`
- Create: `packages/core/src/story/cursor.spec.ts`

**Interfaces:**

- Consumes: Task 6's `StoryFlow`; existing `DynamicViewFlow` from
  `packages/core/src/types/view-dynamic-flow.ts`.

**PLAN DEFECT, corrected after Task 10 blocked on it:** this task originally assigned **no barrel
export**, and its brief told the implementer not to add one. Task 10 consumes all four cursor
functions plus both types from `@likec4/core`, so with no export they were unreachable and Task 10
could not compile. This task must also:

- export the cursor module's public surface from `packages/core/src/index.ts`, beside the existing
  `export { calcSceneOffset } from './story/align'` at line 38
- export a scene-positioning primitive (`cursorAtScene(flow, resolve, scene)`), because `enter()` is
  private and the four exported functions only move _relative_ to a current cursor — Task 12's
  `gotoScene` has no way to jump to an arbitrary scene without it
- Produces:
  ```ts
  interface StoryCursor {
    readonly scene: scalar.StepPath
    readonly innerStep: scalar.StepPath | null
  }
  type ResolveSceneView = (viewId: string) => ProcessedDynamicView<any> | null
  function firstCursor(flow: StoryFlow, resolve: ResolveSceneView): StoryCursor | null
  function nextCursor(flow: StoryFlow, resolve: ResolveSceneView, cursor: StoryCursor): StoryCursor | null
  function prevCursor(flow: StoryFlow, resolve: ResolveSceneView, cursor: StoryCursor): StoryCursor | null
  function nextSceneCursor(flow: StoryFlow, resolve: ResolveSceneView, cursor: StoryCursor): StoryCursor | null
  ```
  `resolve` returns `null` when the scene's view is not a dynamic view. `nextSceneCursor` exists so
  a scene-level control pair can be added later without touching the cursor (RFC 0001, deferred).

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/story/cursor.spec.ts`:

```ts
const storyView = {
  [_type]: 'story',
  scenes: [
    { id: 'step-01', view: 'static1', astPath: '/a' },
    { id: 'step-02', view: 'dyn', astPath: '/b' },
    { id: 'step-03', view: 'static2', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

// `dyn` has two steps
const resolve: ResolveSceneView = (viewId) =>
  viewId === 'dyn'
    ? ({ id: 'dyn', flow: ['step-01', 'step-02'], nodes: [], edges: [] } as any)
    : null

describe('story cursor', () => {
  const flow = StoryFlow.from(storyView)

  it('starts on the first scene with no inner step for a static view', () => {
    expect(firstCursor(flow, resolve)).toEqual({ scene: 'step-01', innerStep: null })
  })

  it('seeds the inner step when entering a dynamic scene', () => {
    const c = nextCursor(flow, resolve, { scene: 'step-01', innerStep: null })
    expect(c).toEqual({ scene: 'step-02', innerStep: 'step-01' })
  })

  it('advances within a dynamic scene before leaving it', () => {
    const c = nextCursor(flow, resolve, { scene: 'step-02', innerStep: 'step-01' })
    expect(c).toEqual({ scene: 'step-02', innerStep: 'step-02' })
  })

  it('leaves a dynamic scene once its steps are exhausted', () => {
    const c = nextCursor(flow, resolve, { scene: 'step-02', innerStep: 'step-02' })
    expect(c).toEqual({ scene: 'step-03', innerStep: null })
  })

  it('returns null at the end of the story', () => {
    expect(nextCursor(flow, resolve, { scene: 'step-03', innerStep: null })).toBeNull()
  })

  it('re-enters a dynamic scene on its last step when going backwards', () => {
    const c = prevCursor(flow, resolve, { scene: 'step-03', innerStep: null })
    expect(c).toEqual({ scene: 'step-02', innerStep: 'step-02' })
  })

  it('returns null before the start of the story', () => {
    expect(prevCursor(flow, resolve, { scene: 'step-01', innerStep: null })).toBeNull()
  })

  it('nextSceneCursor skips a dynamic scene’s remaining steps', () => {
    const c = nextSceneCursor(flow, resolve, { scene: 'step-02', innerStep: 'step-01' })
    expect(c).toEqual({ scene: 'step-03', innerStep: null })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/core/src/story/cursor.spec.ts`
Expected: FAIL — `firstCursor` is not defined.

- [ ] **Step 3: Implement it**

Create `packages/core/src/story/cursor.ts`:

```ts
import type * as scalar from '../types/scalar'
import type { ProcessedDynamicView } from '../types/view'
import { DynamicViewFlow } from '../types/view-dynamic-flow'
import type { StoryFlow } from '../types/view-story-flow'

/**
 * Position within a story.
 *
 * Traversal is a composition rather than one flow: `StoryFlow` walks scenes, and
 * `DynamicViewFlow` walks steps inside a scene that happens to be a dynamic view.
 * See RFC 0001, "The cursor is a composition".
 */
export interface StoryCursor {
  readonly scene: scalar.StepPath
  readonly innerStep: scalar.StepPath | null
}

/**
 * Resolves a scene's view id to a dynamic view, or `null` when the scene's view
 * is not dynamic (and therefore has no inner steps).
 */
export type ResolveSceneView = (viewId: string) => ProcessedDynamicView<any> | null

function innerFlow(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  scene: scalar.StepPath,
): DynamicViewFlow<any> | null {
  const viewId = flow.lookup(scene)?.view
  if (!viewId) {
    return null
  }
  const view = resolve(viewId)
  return view ? DynamicViewFlow.from(view) : null
}

function enter(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  scene: scalar.StepPath,
  at: 'first' | 'last',
): StoryCursor {
  const inner = innerFlow(flow, resolve, scene)
  if (!inner) {
    return { scene, innerStep: null }
  }
  const paths = inner.paths.filter(p => inner.isStep(p))
  const innerStep = (at === 'first' ? paths[0] : paths.at(-1)) ?? null
  return { scene, innerStep }
}

export function firstCursor(flow: StoryFlow, resolve: ResolveSceneView): StoryCursor | null {
  const scene = flow.firstScene()
  return scene ? enter(flow, resolve, scene, 'first') : null
}

export function nextCursor(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  cursor: StoryCursor,
): StoryCursor | null {
  if (cursor.innerStep) {
    const inner = innerFlow(flow, resolve, cursor.scene)
    const next = inner?.prevAndNext(cursor.innerStep).next
    if (next) {
      return { scene: cursor.scene, innerStep: next }
    }
  }
  return nextSceneCursor(flow, resolve, cursor)
}

export function nextSceneCursor(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  cursor: StoryCursor,
): StoryCursor | null {
  const next = flow.prevAndNext(cursor.scene).next
  return next ? enter(flow, resolve, next, 'first') : null
}

export function prevCursor(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  cursor: StoryCursor,
): StoryCursor | null {
  if (cursor.innerStep) {
    const inner = innerFlow(flow, resolve, cursor.scene)
    const prev = inner?.prevAndNext(cursor.innerStep).prev
    if (prev) {
      return { scene: cursor.scene, innerStep: prev }
    }
  }
  const prevScene = flow.prevAndNext(cursor.scene).prev
  return prevScene ? enter(flow, resolve, prevScene, 'last') : null
}
```

`DynamicViewFlow` exposes `paths` and `isStep` (see `view-dynamic-flow.ts:781` and `:826`). If
filtering `paths` proves awkward, `firstStep()` already exists for the forward case; you only need
the filter for the `'last'` case.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run packages/core/src/story/cursor.spec.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
pnpm fmt
git add packages/core/src/story/cursor.ts packages/core/src/story/cursor.spec.ts
git commit -m "feat(core): add composite story cursor

One cursor walks scenes and descends into dynamic scenes' steps.
nextSceneCursor is exported so a scene-level control pair can be added
later without reworking traversal."
```

---

### Task 10: Story actor and scene rendering in the diagram

This is the highest-risk task: it touches a large XState machine. **Read the real files before
trusting any snippet below.** The interfaces are fixed; the wiring must follow whatever the machine
actually does today.

**Files:**

- Create: `packages/diagram/src/story/resolveScene.ts`
- Create: `packages/diagram/src/story/actor.ts`
- Create: `packages/diagram/src/story/resolveScene.spec.ts`
- Modify: `packages/diagram/src/likec4diagram/state/machine.setup.ts`
- Modify: `packages/diagram/src/likec4diagram/state/machine.ts`

**Interfaces:**

- Consumes: Task 6 `StoryFlow`, Task 7 `calcSceneOffset`, Task 9 cursor functions.
- Produces:
  ```ts
  // resolveScene.ts
  interface ResolvedScene {
    readonly view: LayoutedView
    readonly offset: XYPoint
  }
  function resolveScene(args: {
    scene: ComputedStoryScene<any>
    model: LikeC4Model<any>
    outgoing: ReadonlyMap<string, XYPoint>
    sceneLayout: StorySceneLayout
  }): ResolvedScene | null

  function positionsOf(view: LayoutedView): ReadonlyMap<string, XYPoint>
  function applyOffset(view: LayoutedView, offset: XYPoint): LayoutedView
  ```
- New machine event: `{ type: 'story.scene'; cursor: StoryCursor }`.

- [ ] **Step 1: Read the machine and the merge path**

Read, in order:

- `packages/diagram/src/likec4diagram/state/machine.setup.ts` — the `Context` interface and the
  event union.
- `packages/diagram/src/likec4diagram/state/assign.ts:31-60` — `mergeXYNodesEdges`, which already
  merges by node id across differing views.
- `packages/diagram/src/likec4diagram/state/machine.state.navigating.ts` — what `update.view` does
  that `story.scene` must **not** do: push `navigationHistory` (lines 247-255).
- How `editorActorLogic` is spawned, for the child-actor pattern.

The reason `story.scene` is a separate event: `update.view` with a differing view id pushes
navigation history, so reusing it would make every Next press pollute browser back.

- [ ] **Step 2: Write the failing test for scene resolution**

Create `packages/diagram/src/story/resolveScene.spec.ts`:

```ts
const view = {
  id: 'v1',
  [_type]: 'element',
  [_stage]: 'layouted',
  nodes: [
    { id: 'a', x: 100, y: 100, width: 10, height: 10 },
    { id: 'b', x: 200, y: 100, width: 10, height: 10 },
  ],
  edges: [],
} as unknown as LayoutedView

describe('positionsOf', () => {
  it('maps node id to position', () => {
    expect([...positionsOf(view)]).toEqual([
      ['a', { x: 100, y: 100 }],
      ['b', { x: 200, y: 100 }],
    ])
  })
})

describe('applyOffset', () => {
  it('translates every node and leaves the original untouched', () => {
    const moved = applyOffset(view, { x: -50, y: 25 })
    expect(moved.nodes.map(n => [n.x, n.y])).toEqual([[50, 125], [150, 125]])
    expect(view.nodes[0]!.x).toBe(100)
  })

  it('is a no-op for a zero offset', () => {
    expect(applyOffset(view, { x: 0, y: 0 })).toBe(view)
  })
})
```

Check the real `DiagramNode` position field names first (`x`/`y` vs `position`) in
`packages/core/src/types/view-layouted.ts` and fix the test to match before implementing.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/diagram/src/story/resolveScene.spec.ts`
Expected: FAIL — `positionsOf` is not defined.

- [ ] **Step 4: Implement scene resolution**

Create `packages/diagram/src/story/resolveScene.ts`:

```ts
import { calcSceneOffset } from '@likec4/core'
import type { XYPoint } from '@likec4/core/geometry'
import type { LikeC4Model } from '@likec4/core/model'
import type {
  ComputedStoryScene,
  LayoutedView,
  StorySceneLayout,
} from '@likec4/core/types'

export interface ResolvedScene {
  readonly view: LayoutedView
  readonly offset: XYPoint
}

/**
 * Positions of a view's nodes, keyed by node id.
 *
 * Node ids are element FQNs, so the same element in two different views shares a
 * key — which is what makes cross-scene correspondence free.
 */
export function positionsOf(view: LayoutedView): ReadonlyMap<string, XYPoint> {
  return new Map(view.nodes.map(n => [n.id as string, { x: n.x, y: n.y }]))
}

/**
 * Returns a copy of the view with every node translated by `offset`.
 * Returns the input unchanged when the offset is zero.
 */
export function applyOffset(view: LayoutedView, offset: XYPoint): LayoutedView {
  if (offset.x === 0 && offset.y === 0) {
    return view
  }
  return {
    ...view,
    nodes: view.nodes.map(n => ({ ...n, x: n.x + offset.x, y: n.y + offset.y })),
  } as LayoutedView
}

/**
 * Resolves a scene to the geometry the canvas should show, aligned against the
 * scene currently on screen. Returns `null` when the scene's view is missing from
 * the model.
 */
export function resolveScene({ scene, model, outgoing, sceneLayout }: {
  scene: ComputedStoryScene<any>
  model: LikeC4Model<any>
  outgoing: ReadonlyMap<string, XYPoint>
  sceneLayout: StorySceneLayout
}): ResolvedScene | null {
  const target = model.findView(scene.view)?.$view as LayoutedView | undefined
  if (!target) {
    return null
  }
  const offset = calcSceneOffset(outgoing, positionsOf(target), sceneLayout)
  return { view: applyOffset(target, offset), offset }
}
```

`model.findView(...)` and `.$view` are guesses — check the real accessor on `LikeC4Model`
(`packages/core/src/model/LikeC4Model.ts`) and how `packages/diagram/src/hooks/useLikeC4Model.ts`
resolves a view by id, then use that.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/diagram/src/story/resolveScene.spec.ts`
Expected: PASS.

- [ ] **Step 6: Add the `story.scene` event and the actor**

In `machine.setup.ts`, add to the event union:

```ts
| { type: 'story.scene'; cursor: StoryCursor }
```

and to `Context`:

```ts
/**
 * Cursor position when the current view is a story.
 */
activeStoryCursor: null | StoryCursor
```

Create `packages/diagram/src/story/actor.ts` holding the cursor and exposing `next`, `prev`,
`gotoScene`. Model it on an existing sibling actor — read
`packages/diagram/src/navigationpanel/actor.ts` for the smallest example of the house style
(`setup({...}).createMachine({...})`, `defineActors`) and follow it.

In `machine.ts`, handle `story.scene` by assigning the new cursor and merging the resolved scene's
geometry through `mergeXYNodesEdges` — **without** touching `navigationHistory`:

```ts
'story.scene': {
  actions: [
    assign(({ context, event }) => {
      // resolve the scene, convert to xyflow, then merge by node id
      // do NOT push navigationHistory — see RFC 0001
    }),
  ],
},
```

Fill this in against the real `convertToXYFlow` signature in
`packages/diagram/src/likec4diagram/convert-to-xyflow.ts` and the real `mergeXYNodesEdges` call in
`machine.state.navigating.ts:156`.

- [ ] **Step 7: Verify a story renders**

Run: `pnpm typecheck`
Expected: PASS.

Then run the dev app and open a story view (Task 13 creates the example; if doing tasks in order,
defer this check to Task 13 and note it here).

- [ ] **Step 8: Commit**

```bash
pnpm fmt
git add packages/diagram/src/story packages/diagram/src/likec4diagram/state
git commit -m "feat(diagram): render story scenes via a dedicated story.scene event

story.scene merges scene geometry through mergeXYNodesEdges without
pushing navigation history, so advancing a story does not pollute
browser back."
```

---

### Task 11: Walkthrough panel narration and scene outline

**Files:**

- Create: `packages/diagram/src/navigationpanel/walkthrough/StoryControls.tsx`
- Modify: `packages/diagram/src/context/DiagramFeatures.tsx`
- Modify: `packages/diagram/src/navigationpanel/NavigationPanelControls.tsx`

**Interfaces:**

- Consumes: Task 10's story actor; Task 5's `ComputedStoryScene` (`title`, `notes`, `branchTitle`).
- Produces: `<StoryControls />`; feature flag `enableStoryWalkthrough`.

**ADDED after Task 10 landed — this task must also supply the actor's real `resolve`.**

Task 10 spawned the story actor with `resolve: () => null` as a documented placeholder, because
`ResolveSceneView` needs a `LikeC4Model` and an XState actor cannot reach React context. The
consequence is that **dynamic-scene descent is currently inert**: every scene is treated as
non-dynamic, `innerStep` is always `null`, and one Next press per scene is all the cursor does. That
silently disables an RFC headline feature ("a scene may itself be a dynamic view, in which case one
cursor walks into that view's steps and back out").

This task is the natural owner: it is the React-layer task and already reads cursor state. Supply a
real `ResolveSceneView` from React — resolve a scene's view id through `useLikeC4Model`, return the
view when it is a dynamic view, `null` otherwise. Follow the pattern Task 10 mirrored for the
placeholder (`useEditorActorLogic()`), and read how `packages/diagram/src/hooks/useLikeC4Model.ts`
actually resolves a view by id.

**Verify descent works end to end** with a test covering a story whose scene is a dynamic view: Next
must step _within_ that scene before advancing to the next scene. Without such a test this gap would
reappear silently.

- [ ] **Step 1: Read the components you are mirroring**

Read `packages/diagram/src/navigationpanel/walkthrough/DynamicViewControls.tsx` in full — it is the
direct analogue (Start button, `useDiagram()`, `useNavigationActor()`, Mantine + `motion/react-m`).
Also read `packages/diagram/src/navigationpanel/walkthrough/WalkthroughPanel.css.ts` and
`packages/diagram/src/likec4diagram/ui/sequence-outline/SequenceOutlinePanel.tsx` for the outline
list pattern.

- [ ] **Step 2: Add the feature flag**

In `DiagramFeatures.tsx`, add `'StoryWalkthrough'` to `FeatureNames` (beside
`'DynamicViewWalkthrough'`, line 23) and `enableStoryWalkthrough: false` to `DefaultFeatures`
(beside line 56).

- [ ] **Step 3: Write `StoryControls`**

Create `StoryControls.tsx` exposing Previous / Next buttons wired to the story actor, plus the
active scene's `title` and `notes`, plus `branchTitle` rendered as a badge when present — this is
what tells the viewer they are inside a hypothetical, per RFC 0001's depth-first `alt` decision.

Follow `DynamicViewControls.tsx`'s structure exactly: a `forwardRef` presentational piece plus a
container that reads state via a selector hook.

- [ ] **Step 4: Mount it**

In `NavigationPanelControls.tsx`, render `<StoryControls />` when the current view is a story and
`enableStoryWalkthrough` is on, mirroring how `<DynamicViewControls />` is gated.

- [ ] **Step 5: Verify**

Run: `pnpm typecheck` — Expected: PASS.
Run: `pnpm vitest run packages/diagram` — Expected: no regressions.

- [ ] **Step 6: Commit**

```bash
pnpm fmt
git add packages/diagram/src/navigationpanel packages/diagram/src/context/DiagramFeatures.tsx
git commit -m "feat(diagram): add story walkthrough controls

Renders scene title/notes and the enclosing alt branch title, so a viewer
walking depth-first through alt knows they are inside a hypothetical."
```

---

### Task 12: `navigateTo` interception

**Files:**

- Modify: `packages/diagram/src/story/actor.ts`
- Modify: `packages/diagram/src/likec4diagram/state/diagram-api.ts:101`
- Test: `packages/diagram/src/story/actor.spec.ts` (new)

**Interfaces:**

- Consumes: Task 6's `StoryFlow`, Task 10's actor.
- Produces: `findSceneForView(flow: StoryFlow, viewId: string): scalar.StepPath | null`.

**ADDED after Task 11 landed — this task must also make scene changes actually repaint.**

`story.scene` has a handler (`machine.ts:125`) and **no sender**. Verified: the only other mentions
in the tree are the event type and comments noting the gap. So the cursor advances correctly and the
canvas never changes — the story feature is currently invisible in use.

Wire the missing link: when the story cursor moves, resolve the new scene via `resolveScene(...)`
(already built, `packages/diagram/src/story/resolveScene.ts`) and dispatch
`story.scene` with `{ cursor, view }`. It needs the model, so it belongs in the React layer that can
reach `useLikeC4Model` — `DiagramActorProvider.tsx` is the natural home and is yours.

**Also move Task 11's `resolve` wiring to `.provide()`.** Task 11 had to use a corrective
`update.resolve` event because `likec4diagram/state/` was outside its scope, and that path is only
reachable once `enableStoryWalkthrough` is on (default off). `DiagramActorProvider.tsx:54` already
calls `diagramMachine.provide({...})` — supplying `resolve` there is the fix Task 11 identified but
could not make. Keep Task 11's event as a fallback or remove it, your call, but say which and why.

Without this, Task 13 cannot verify anything: there is no observable behaviour to check.

**ADDED after Task 10 landed — this task must also wire mid-session entry into a story.**

Task 10 spawns the story actor from a root-level `entry:`, which only covers the diagram being
_mounted directly_ on a story view. Navigating into a story mid-session — a route change delivering
`update.view` with a story — does not spawn it, so the cursor never initialises and Next/Previous do
nothing.

This task owns it because it already touches the adjacent `navigating` / `diagram-api` files. Spawn
or reinitialise the story actor when the incoming view is a story, and confirm the reverse too:
navigating _away_ from a story must not leave a stale cursor behind.

Add a test for each direction. This is a gap that manifests only as "the buttons do nothing" in
manual use, which is exactly why it needs coverage.

- [ ] **Step 1: Read the current behaviour**

Read `packages/diagram/src/likec4diagram/state/diagram-api.ts:101` (`navigateTo`) and
`packages/likec4-spa/src/pages/ViewReact.tsx:35` (`onNavigateTo`). Today `navigateTo` emits to the
host, which calls the router — a **route change** that would discard the story cursor.

- [ ] **Step 2: Write the failing test**

Create `packages/diagram/src/story/actor.spec.ts`:

```ts
const storyView = {
  [_type]: 'story',
  scenes: [
    { id: 'step-01', view: 'v1', astPath: '/a' },
    { id: 'step-02', view: 'v2', astPath: '/b' },
  ],
} as unknown as ComputedStoryView

describe('findSceneForView', () => {
  const flow = StoryFlow.from(storyView)

  it('finds the scene showing a given view', () => {
    expect(findSceneForView(flow, 'v2')).toBe('step-02')
  })

  it('returns null for a view that is not a scene', () => {
    expect(findSceneForView(flow, 'elsewhere')).toBeNull()
  })

  it('returns the first matching scene when a view appears twice', () => {
    const twice = {
      [_type]: 'story',
      scenes: [
        { id: 'step-01', view: 'v1', astPath: '/a' },
        { id: 'step-02', view: 'v1', astPath: '/b' },
      ],
    } as unknown as ComputedStoryView
    expect(findSceneForView(StoryFlow.from(twice), 'v1')).toBe('step-01')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/diagram/src/story/actor.spec.ts`
Expected: FAIL — `findSceneForView` is not defined.

- [ ] **Step 4: Implement and wire it**

In `packages/diagram/src/story/actor.ts`:

```ts
/**
 * The scene showing `viewId`, or `null` when the view is not part of this story.
 *
 * Used to intercept `navigateTo`: when the target is one of the story's own
 * scenes, the cursor jumps there instead of routing away and discarding the
 * story. See RFC 0001, "`navigateTo` inside a story".
 */
export function findSceneForView(flow: StoryFlow, viewId: string): scalar.StepPath | null {
  return flow.scenes.find(s => s.view === viewId)?.id ?? null
}
```

Then in the actor's `navigateTo` handling: if `findSceneForView` returns a path, raise a
`story.scene` event with a cursor entering that scene; otherwise fall through to the existing
emit-to-host path in `diagram-api.ts`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/diagram/src/story/actor.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm fmt
git add packages/diagram/src/story packages/diagram/src/likec4diagram/state/diagram-api.ts
git commit -m "feat(diagram): intercept navigateTo inside stories

A view that is also a scene now jumps the cursor instead of routing away,
so the same view behaves correctly both standalone and as a scene."
```

---

### Task 13: Example story, generator stubs, and end-to-end verification

**Files:**

- Create: `examples/**/story.c4` (pick the example project you verified renders)
- Modify: whichever generator entry points still fail `pnpm exec tsc --build`
- Modify: `docs/rfcs/0001-story-view.md` (record what the POC actually showed)

**Interfaces:**

- Consumes: everything.
- Produces: a running story in the dev app.

- [ ] **Step 1: Find the remaining compile failures**

Run: `pnpm exec tsc --build`
Record every remaining error. By this point Tasks 5, 8 and 14 have closed everything else, so the
only remaining errors should be the two generator spec fixtures:
`packages/generators/src/likec4/operators/likec4data.spec.ts:214` and
`packages/generators/src/likec4/operators/views.spec.ts:64`. **If anything else still fails, stop
and report it** — it means an earlier task's site was missed, and silently absorbing it here would
hide that.

- [ ] **Step 2: Stub the out-of-scope dispatch sites**

For each failing generator, add a `story` case that throws with an explicit message rather than
silently emitting nothing:

```ts
case isStoryView(view):
  throw new Error(
    `Story views are not supported by this generator (POC scope — see RFC 0001): ${view.id}`,
  )
```

- [ ] **Step 3: Write the example**

Add a story to an existing example project, exercising every MVP feature:

```likec4
views {
  story migration {
    title 'Migration to microservices'
    sceneLayout anchored

    scene monolith {
      notes 'Everything ships together. One database.'
    }
    scene strangler {
      title 'Introduce a facade'
    }
    scene microservices {
      title 'Extract the services'
      // replace with real FQNs from the example project
      mono.api becomes orders.api, billing.api
    }
    alt 'Two ways forward' {
      when 'Aggressive' { scene microservices }
      else { scene strangler }
    }
  }
}
```

- [ ] **Step 4: Verify end to end**

Run: `pnpm build && pnpm typecheck && pnpm test --no-typecheck`
Expected: all PASS.

Then start the dev app, open the story, and confirm by observation:

1. The story appears in the view list and at its own route.
2. Next/Previous walk all scenes, descending into any dynamic scene's steps.
3. Scene `title` / `notes` appear in the panel; `branchTitle` shows inside the `alt`.
4. Shared elements move a short distance rather than jumping, under `sceneLayout anchored`.
5. Switching to `sceneLayout independent` visibly increases how far shared elements travel —
   **this is the comparison the whole POC exists to enable.**
6. Advancing scenes does not add browser-history entries.
7. Clicking a `navigateTo` whose target is a scene jumps the cursor instead of leaving the story.

- [ ] **Step 5: Record the findings in the RFC**

Update RFC 0001's "Deferred decisions" table with what you observed — in particular which
`sceneLayout` mode should become the default. That row exists specifically to be closed by this
step.

- [ ] **Step 6: Commit**

```bash
pnpm fmt
git add examples packages docs/rfcs/0001-story-view.md
git commit -m "feat: add story view example and record POC findings

Stubs generator dispatch sites with explicit errors rather than silent
no-ops. Records the anchored-vs-independent comparison in RFC 0001."
```

---

### Task 14: Close the union-widening breakage

> **Dispatch order:** numbered 14 but dispatched in **Wave D**, alongside Tasks 8 and 9 (disjoint
> file sets). It is numbered last only because it was added after Task 1 revealed the breakage.

Task 1 widened `ParsedView` / `ComputedView` / `LayoutedView` to include story views. Sites that
index a property present on only _some_ union members, or that switch exhaustively over view type,
no longer compile. Tasks 3, 5, 8 and 13 own the sites that are part of their own feature work. This
task owns the remainder — mechanical union-widening fallout with no owning feature.

**This task adds no features.** MCP and generators are explicit RFC non-goals; the goal here is
solely that the code compiles again, with story views handled in whatever way is _minimal and
honest_ at each site.

**Files (exact sites, from Task 1's `tsc --build` inventory):**

- Modify: `packages/core/src/builder/Builder-style2.spec.ts:437` — TS2339, `.rules` accessed via
  `m.views.index.rules` on a now-wider union
- Modify: `packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx:256,412` — TS7053 on the
  `ViewTypeIcon` map and TS2322 on the `ColumnItem` union; both need a `'story'` case
- Modify: `packages/language-server/src/model-change/changeElementStyle.ts:75,81` — TS2339, `rules`
  missing on `... | StoryViewBody`
- Modify: `packages/language-server/src/model-change/changeViewLayout.ts:27` — same cause
- Modify: `packages/language-server/src/model-change/viewChange.ts:113` — TS2322/TS2769/TS2677,
  overload and type-predicate mismatch
- Modify: `packages/language-server/src/model/model-builder.ts:253` — TS2322, `Record<...>` mismatch
- Modify: `packages/language-server/src/model/__tests__/model-builder.spec.ts:1780,1811` — TS2339,
  `rules` missing on the widened `ParsedAstView` union (found after Task 3 extended that union)
- Modify: `packages/language-server/src/model/__tests__/model-parser.spec.ts` — same cause, at 14
  sites: lines 589, 633, 678, 715, 752, 793, 1032, 1082, 1138, 1176, 1214, 1258, 1302, 1355
- Modify: `packages/mcp/src/tools/_common.ts:264` — TS2322/TS2345, missing `'story'` variant
- Modify: `packages/mcp/src/tools/read-project-summary.ts:157` — same cause
- Modify: `packages/mcp/src/tools/read-view.ts:141` — same cause
- Modify: `packages/likec4-spa/src/aichat/useChat.tsx:62` — TS2345

**Interfaces:**

- Consumes: Task 1's `isStoryView`, `ParsedStoryView`, `ComputedStoryView`, `LayoutedStoryView`.
- Produces: nothing new. No new exports, no new types.

**Third category, added after Task 9 ran — our own spec fixtures do not typecheck.**

`scalar.StepPath` is a `Tagged` type, so plain string literals are not assignable to it. Two spec
files this branch introduced use bare string literals for step ids and therefore fail
`tsc --build` (verified: 10 and 5 errors respectively):

- `packages/core/src/types/view-story-flow.spec.ts` — TS2345 at lines 24, 28, 32, 39, 43

**Reassigned:** `packages/core/src/story/cursor.spec.ts` (10 x TS2322) is **no longer this
task's** — it moved to Task 9's fix round. Task 9's reviewer argued correctly that the fix
needed no file outside Task 9's own boundary, so it was avoidable there rather than bulk
cleanup here. Do not touch `cursor.spec.ts`. `view-story-flow.spec.ts` stays here because
Task 6 is already closed.

This is **not** pre-existing breakage: both files are new on this branch, and both passed a task
review, because reviewers work from the diff and do not run `tsc`. It matters because `pnpm test`
includes typechecking by default in this repo, so the default test command currently fails on our
own files.

**Fix with the real constructor, not `as` casts.** `StepPath(...)` is exported from
`packages/core/src/types/scalar.ts:182` and produces correctly-typed values: `StepPath(1)` →
`step-01`, and `StepPath([2, 'alt'], [1, 'when'], 1)` → `step-02:alt.01:when.01`. Using it keeps the
global "avoid `as` casts" constraint intact and exercises the real constructor in the fixtures. Do
not weaken any assertion and do not change what the tests verify — only how the step-id values are
constructed. Re-run both spec files after the change.

- [ ] **Step 1: Reproduce the breakage and scope it**

Run: `pnpm exec tsc --build 2>&1 | tee /tmp/story-tsc-before.txt`
Expected: exit 2. Confirm each site in the Files list above appears. Any site NOT in that list and
NOT owned by Tasks 3/5/8/13 (see "Known transient breakage") is new information — **stop and report
it** rather than fixing it silently.

- [ ] **Step 2: Fix the `model-change` and `model-builder` sites**

These are the only sites where the fix is a real decision rather than a mechanical case addition.
`packages/language-server/src/model-change/` mutates a view's `rules`, and a story body has
`statements`, not `rules`.

Read each site, then narrow the type so story bodies are excluded rather than accommodated — a
story has no `rules` to change, and `model-change` operations are meaningless for it. Prefer an
early return or a type guard that excludes `StoryViewBody`. Do **not** add a `rules` field to story
types to make the error go away; that would contradict RFC 0001, which specifies stories carry no
geometry and no view rules.

- [ ] **Step 3: Fix `NavigationPanelDropdown.tsx`**

Add a `'story'` entry to the `ViewTypeIcon` map and a `'story'` case to the `ColumnItem` union.
Pick an existing icon already imported in that file, or an appropriate `@tabler/icons-react` icon
consistent with its siblings. This is the one user-visible choice in the task; keep it consistent
with how `'dynamic'` and `'deployment'` are treated.

- [ ] **Step 4: Fix the remaining mechanical sites**

`Builder-style2.spec.ts:437`, `mcp/src/tools/*`, and `likec4-spa/src/aichat/useChat.tsx:62`. For
the MCP tools and the aichat call, add the minimal `'story'` handling that compiles — these are
non-goals, so a narrow guard or an explicit "not supported for story views" branch is correct.
For the Builder spec, narrow the access so the assertion still tests what it tested before; do not
weaken the assertion or cast it away with `as`.

- [ ] **Step 5: Verify no new breakage and nothing regressed**

Run: `pnpm exec tsc --build 2>&1 | tee /tmp/story-tsc-after.txt`
Expected: the only remaining errors are the sites owned by Tasks 5, 8 and 13 (if those have not yet
landed). Every site in this task's Files list must be gone. Diff the two files to show exactly what
you closed.

Run the focused suites for the packages you touched, e.g.:
`pnpm vitest run packages/core/src/builder/Builder-style2.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm exec dprint fmt <the exact files you changed>
git add <the exact files you changed>
git commit -m "fix: close union-widening breakage from story view types

Mechanical fallout from widening the view unions. No features added:
model-change excludes story bodies (a story has no rules to change),
and MCP/generators sites get minimal guards since both are RFC non-goals."
```

---

## Self-review notes

**Spec coverage.** Every "MVP scope — In" item from RFC 0001 maps to a task: grammar and `Id`
additions → Task 2; `StorySubflow` admitting every
`SubflowKind` with validation gating → Tasks 2 and 4; core types across all three stages plus
`isStoryView` → Task 1; `StoryFlow` → Task 6; composite cursor → Task 9; `computeStoryView` →
Task 5; layouter bypass → Task 8; `align.ts` with both modes → Task 7; story actor, `story.scene`,
scene resolution → Task 10; panel narration and scene outline and the feature flag → Task 11;
`navigateTo` interception → Task 12; validations → Task 4; example story → Task 13.

**Known deviation from the spec.** RFC 0001 specifies a `StoryTry` type. It is _not_ implemented:
`try` / `catch` / `finally` is not admitted by the story grammar, so no code path can produce it,
and adding a dead type would violate YAGNI. The RFC records this explicitly.

**Deliberate uncertainty.** Tasks 10 and 11 touch a large XState machine and a React component tree.
Their **interfaces are fixed** (`resolveScene`, `positionsOf`, `applyOffset`, `findSceneForView`,
the `story.scene` event shape) and fully tested, but their wiring steps say "read the real file and
mirror it" rather than giving machine code verbatim. That is intentional: fabricating plausible
XState wiring would be worse than pointing at the exact file and line to copy. Every such step names
the file and line to read.
