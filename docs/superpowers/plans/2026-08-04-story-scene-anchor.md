# Story Scene Anchor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the story `sceneLayout: anchored | independent | unified` property with a per-scene `anchor <ElementRef>` DSL statement, resolved via viewport panning in `packages/diagram` instead of view-geometry mutation in `packages/core`; plus two UI fixes reported from dev-server testing.

**Architecture:** `anchor` is parsed straight through as data (an FQN on `ComputedStoryScene`) with no computation attached. All alignment math moves into `packages/diagram`'s existing scene-navigation machinery, which already has both the outgoing and incoming view during a transition and already has a working "pan the camera to keep a corresponding node visually still" mechanism (`findCorrespondingNode` in `machine.state.navigating.ts`, currently used for search/click node-navigation) — the anchor feature extends that mechanism with a second correspondence source instead of inventing a new one. `packages/core/src/story/align.ts` and `resolveScene.ts` are deleted outright, not migrated.

**Tech Stack:** Langium (grammar), TypeScript, XState v5, `@xyflow/system` (viewport math), Vitest.

**Reference documents:** `docs/superpowers/specs/2026-08-04-story-scene-anchor-design.md` (the approved design this plan implements).

## Deviation from the approved design spec — read this before Task 3

The spec's validation section calls for statically checking that an anchor's element is present in *both* the scene's own view and its immediate predecessor's view. Research for this plan found **no existing mechanism anywhere in `packages/language-server/src/validation/` for checking "is element X actually included in view V's resolved node set"** — that information only exists after a view is computed (`computeView`/`computeStoryView`, run by `LikeC4ModelBuilder.unsafeSyncComputeModel`), and Langium validation checks run on the AST before that, with no established pattern for reaching into the compute cache from inside one. Building that reach-in is new, unverified infrastructure, not a reuse of anything — a materially bigger and riskier task than this plan's scope.

**Scope reduction for this plan:** Task 3 implements only the structural half of validation — a scene with no predecessor (the first scene in depth-first order) that declares `anchor` is a validation error. The "present in both views" check is dropped; the runtime fallback (Task 3's diagram-side "if the anchor node isn't found in the outgoing or incoming render, just fall back to fit-to-bounds" behavior, which the design already calls for as a safety net) covers a misconfigured anchor by degrading gracefully instead of crashing. If stronger static validation is wanted later, it needs its own design pass on how to safely call into the compute cache from a validation check — out of scope here.

## Global Constraints

- Branch: continue directly on `story-view-implementation` (no new worktree needed unless a task is dispatched into an isolated worktree for parallelism — see Task 3/Task 4's note).
- `origin` is upstream `likec4/likec4` — never push there. Fork remote is `fork`. Do not push unless explicitly asked.
- Stage explicit paths only — never `git add -A`. Do not touch `packages/icons/` or any `generated/` directory (gitignored).
- After any grammar change: run `pnpm generate`, then verify `packages/vscode/src/meta.ts` is unchanged (revert if `pnpm generate` touched it — it re-bumps a version every run).
- After any `packages/core` type change: run `pnpm exec tsc --build` before touching downstream packages (composite-project gotcha — downstream reads `.d.ts` from `packages/core/lib/`, not source).
- Each task must leave `pnpm exec tsc --build` clean and its own package's test suite green before moving to the next task. This plan is ordered so no task should leave the *whole repo* red even transiently — unlike the earlier containment-redesign plan, there is no "known transient breakage" table here; if a task discovers it needs to break compilation elsewhere, stop and reconsider the task order rather than pushing through.
- No changesets (unreleased POC branch).
- Commit after each task, Conventional Commits style.

---

### Task 1: Core — add the `anchor` field (additive only, no deletions yet)

**Files:**
- Modify: `packages/core/src/types/view-parsed.story.ts` (`StoryScene<A>` interface, lines 27-44)
- Modify: `packages/core/src/types/view-computed.ts` (`ComputedStoryScene<A>` interface, lines 167-186)
- Test: `packages/core/src/compute-view/story-view/compute.spec.ts` (extend)

**Interfaces:**
- Produces: `StoryScene<A>.anchor?: aux.StrictFqn<A>` and `ComputedStoryScene<A>.anchor?: aux.StrictFqn<A>` — the anchor element's FQN, present only when the DSL author declared one. No stage transformation happens to this value; it's copied straight through parsed → computed → layouted (via the same `ComputedStoryScene` type reused verbatim by `LayoutedStoryView`, per `view-layouted.ts:13`).

**Step 1: Add the field to `StoryScene`**

In `packages/core/src/types/view-parsed.story.ts`, add `anchor` to `StoryScene<A>` (currently lines 27-44), following the exact convention `StoryCorrespondence.sources`/`.targets` already use for `aux.StrictFqn<A>`:
```ts
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
   * The element that should stay visually still when arriving at this scene,
   * if the author declared one. Resolved by `packages/diagram` at render time
   * against whatever was on screen before this scene — see
   * `docs/superpowers/specs/2026-08-04-story-scene-anchor-design.md`.
   */
  readonly anchor?: aux.StrictFqn<A>
  /**
   * Path to the AST node relative to the view body ast.
   * Used to locate the scene in the source code. Mirrors `Step.astPath`.
   */
  readonly astPath: string
}
```

**Step 2: Add the same field to `ComputedStoryScene`**

In `packages/core/src/types/view-computed.ts`, add the identical field to `ComputedStoryScene<A>` (currently lines 167-186):
```ts
export interface ComputedStoryScene<A extends AnyAux = AnyAux> {
  readonly id: scalar.StepPath
  readonly view: aux.StrictViewId<A>
  readonly title?: string | null
  readonly notes?: scalar.MarkdownOrString
  readonly becomes?: StoryCorrespondence<A>[]
  readonly anchor?: aux.StrictFqn<A>
  /**
   * Title of the nearest enclosing alt branch, if any. Shown in the panel so the
   * viewer knows they are inside a hypothetical.
   */
  readonly branchTitle?: string
  readonly astPath: string
}
```
Do **not** touch `LayoutedStoryView` in `view-layouted.ts` — it imports and reuses `ComputedStoryScene` directly (`view-layouted.ts:13`), so this change already applies there with zero edits to that file.

**Step 3: Wire `anchor` through `computeStoryView`**

In `packages/core/src/compute-view/story-view/compute.ts`, find the scene-assembly object literal inside the `walk` function's `isScene` branch (the one pushing `{ id, view, title, ...(notes...), ...(becomes...), ...(branchTitle...), astPath }` into `scenes`). Add a matching conditional spread for `anchor`, following the exact same idiom the neighboring optional fields already use:
```ts
scenes.push({
  id: StepPath(...prefix, position),
  view: statement.view,
  title: statement.title ?? null,
  ...(statement.notes !== undefined && { notes: statement.notes }),
  ...(statement.becomes !== undefined && { becomes: statement.becomes }),
  ...(statement.anchor !== undefined && { anchor: statement.anchor }),
  ...(branchTitle !== undefined && { branchTitle }),
  astPath: statement.astPath,
})
```
(`statement` here is the parsed `StoryScene<A>` this iteration is processing — confirm the exact local variable name by reading the surrounding `walk` function before editing; it may not literally be called `statement`.)

**Step 4: Test**

Extend `packages/core/src/compute-view/story-view/compute.spec.ts` with a case asserting a scene with a parsed `anchor` produces a computed scene carrying the same `anchor` value, and a case asserting a scene with no `anchor` produces a computed scene with no `anchor` key at all (`expect(scene).not.toHaveProperty('anchor')` — matching this codebase's established pattern of asserting absence, not just `undefined`, per the containment plan's precedent in this same file).

Run `pnpm --filter @likec4/core test` and `pnpm exec tsc --build` — both should be clean; nothing consumes `anchor` yet, so this is a purely additive change.

**Step 5: Commit**

```bash
git add packages/core/src/types/view-parsed.story.ts packages/core/src/types/view-computed.ts packages/core/src/compute-view/story-view/compute.ts packages/core/src/compute-view/story-view/compute.spec.ts
git commit -m "feat(core): add anchor field to story scenes"
```

---

### Task 2: Language-server — `anchor` grammar, parsing, and example

**Files:**
- Modify: `packages/language-server/src/like-c4.langium` (`StorySceneBody`, `StoryViewProperty`, `StorySceneLayoutProperty`, `StorySceneLayoutValue`, `Id` reserved-keyword list)
- Modify: `packages/language-server/src/model/parser/ViewsParser.ts` (`parseStoryView`, `parseStoryScene`)
- Modify: `packages/language-server/src/ast.ts` (`ParsedAstStoryView`)
- Modify: `packages/language-server/src/model/__tests__/story-view.spec.ts` (fixtures)
- Modify: `packages/vscode/likec4.tmLanguage.json`, `apps/playground/likec4.tmLanguage.json`, `apps/docs/likec4.tmLanguage.json` (keyword highlighting)
- Modify: `examples/cloud-system/story.c4`

**Interfaces:**
- Consumes: `StoryScene<A>.anchor` (Task 1).
- Produces: `ast.StorySceneBody.anchor?: ast.StoryAnchorProperty` (new grammar field); `parseStoryScene` now returns a `StoryScene` with `anchor` populated.

**Step 1: Grammar**

In `packages/language-server/src/like-c4.langium`, remove the `sceneLayout` property entirely and add the new `anchor` property to `StorySceneBody`:

Before (lines 366-408):
```
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
```

After:
```
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
  ViewProperty
;

StoryStatement:
  StoryScene | StoryAlt | StorySubflow
;

StoryScene:
  'scene' view=[LikeC4View] body=StorySceneBody? ';'?
;

StorySceneBody: '{'
  props+=(ViewStringProperty | NotesProperty)*
  anchor=StoryAnchorProperty?
  rules+=StoryCorrespondenceRule*
'}'
;

StoryAnchorProperty:
  'anchor' ref=ElementRef ';'?
;
```
(`StoryViewProperty: ViewProperty` with the alternation collapsed to one member is fine to leave as a single-member rule rather than inlining `ViewProperty` directly into `StoryViewBody.props+=` — check whether Langium requires at least two alternatives in a `|`-rule; if it errors on a single-member alternation, inline `props+=ViewProperty*` directly into `StoryViewBody` instead and delete the `StoryViewProperty` rule entirely.)

In the `Id` reserved-keyword list (currently lines 1237-1252), remove `StorySceneLayoutValue` from the alternation (line 1247) and replace `'sceneLayout'` with `'anchor'` in the literal keyword list (line 1252):
```
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
  IconPositionValue |
  RankValue |
  // Allow reserved keywords as Id
  'element' | 'model' | 'group' | 'node' | 'deployment' | 'instance' | 'relationship' |
  'story' | 'stories' | 'scene' | 'anchor' | 'becomes';
```

Run `pnpm generate`. Verify `packages/vscode/src/meta.ts` is unchanged (revert if touched, per Global Constraints).

**Step 2: `ast.ts`**

In `packages/language-server/src/ast.ts`, `ParsedAstStoryView` (around line 216) currently has `sceneLayout: c4.StorySceneLayout | undefined`. Delete this field entirely — do not replace it with anything; `anchor` lives on the per-scene `c4.StoryScene` type (already updated in Task 1), not on `ParsedAstStoryView` itself.

**Step 3: Parser**

In `packages/language-server/src/model/parser/ViewsParser.ts`:

`parseStoryView` (currently lines 649-693) — delete the `sceneLayout` extraction (lines 677-679: `const sceneLayout = find(props, ast.isStorySceneLayoutProperty)?.value as c4.StorySceneLayout | undefined`) and remove `sceneLayout,` from the returned object literal (line 690). If `ast.isStorySceneLayoutProperty` becomes unused elsewhere in this file after this deletion, remove its import too.

`parseStoryScene` (currently lines 708-751) — add anchor extraction, following the exact resolution pattern `parseStoryCorrespondence` already uses for a single `ElementRef` (`elementRef(r)` → `this.resolveFqn(...)`):
```ts
parseStoryScene(node: ast.StoryScene): c4.StoryScene {
  // ... existing viewId/body/props/title/notes/becomes logic unchanged ...

  const anchor = body?.anchor
    ? this.resolveFqn(nonNullable(elementRef(body.anchor.ref), 'Anchor element ref not resolved'))
    : undefined

  return c4.exact({
    view: viewId,
    title: toSingleLine(title) ?? null,
    notes: removeIndent(notes),
    becomes: isNonEmptyArray(becomes) ? becomes : undefined,
    anchor,
    astPath: this.getAstNodePath(node),
  })
}
```
(`body?.anchor` refers to the new `StorySceneBody.anchor?: ast.StoryAnchorProperty` grammar field from Step 1; `body.anchor.ref` is `StoryAnchorProperty.ref: ast.ElementRef`. `elementRef` is already imported at the top of this file from `'../../utils/elementRef'`. Confirm the exact current variable name holding `node.body` in this method before editing — it may be `body` already, per the existing `parseStoryScene` shown in research, or may need adjusting.)

**Step 4: Update `story-view.spec.ts` fixtures**

`packages/language-server/src/model/__tests__/story-view.spec.ts` has fixtures using `sceneLayout anchored`/`sceneLayout independent` (lines ~23, ~51, ~76 per research) — these DSL strings no longer parse once the grammar drops `sceneLayout`. Remove the `sceneLayout ...` lines from each fixture (the story still parses fine without one; scenes simply won't have an anchor, which is valid per this plan's design). Also update the reserved-keyword test at line ~87 (`system sceneLayout` used to prove `sceneLayout` is still usable as an element name) — since `sceneLayout` is no longer a keyword at all after this change, that specific assertion is moot; replace `system sceneLayout` with `system anchor` to prove the NEW keyword `anchor` is still usable as an element name (mirroring the existing `story`/`scene`/`becomes` entries in the same test).

**Step 5: TextMate grammars**

In `packages/vscode/likec4.tmLanguage.json` and `apps/playground/likec4.tmLanguage.json`'s general keyword pattern, remove `sceneLayout` and add `anchor` (alphabetical position: right after `and`/before `and`... check exact alphabetical slot — `anchor` sorts before `and`). In `apps/docs/likec4.tmLanguage.json`'s single combined pattern, same edit. `scene`/`becomes`/`story`/`stories` stay — only `sceneLayout` is removed and `anchor` is added.

**Step 6: Update the example**

In `examples/cloud-system/story.c4`, delete line 6 (`sceneLayout anchored`) and add `anchor` statements to two of the three scenes, using elements confirmed (by this plan's research) to be present in both the outgoing and incoming views of each transition:
```
stories {

  story migration {
    title 'Migration to microservices'
    description 'How Cloud System moved from a single legacy backend to Cloud Next.'

    scene cloud_legacy {
      notes '
        Everything ships from one legacy backend.
        One deployment, one team, one database.
      '
    }
    scene dynamic-view-1 {
      title 'How a request flows today'
      anchor customer
      notes '
        A customer request travels through the dashboard, GraphQL,
        and the legacy backend before touching Amazon services.
      '
    }
    scene cloud_next {
      title 'Extracted into Cloud Next'
      anchor cloud.next.backend
      notes 'Legacy backend services split into a dedicated backend and a GraphQL API.'
      cloud.legacy.backend.services becomes cloud.next.backend, cloud.next.graphql
    }

    alt 'Two ways forward' {
      when 'Aggressive: cut over immediately' {
        scene cloud_next
      }
      else {
        scene cloud_legacy
      }
    }
  }

}
```
(`customer` is present in `cloud_legacy` via its `-> customer ->` include, and in `dynamic-view-1` via the explicit `customer -> ui.dashboard` step. `cloud.next.backend` is present in `dynamic-view-1`'s own steps and in `cloud_next`'s `group { include * }`, and is already one of the `becomes` targets declared two lines below — same element, two different declarations, no coupling required.)

The two occurrences of `scene cloud_next` / `scene cloud_legacy` inside the `alt` block are bare references (no body), so they carry no anchor — leave them exactly as-is. Per this plan's design, a scene with no anchor is valid (plain crossfade), not an error.

**Step 7: Build and test**

`pnpm exec tsc --build`, fix errors inside `packages/language-server` only. Run `packages/language-server`'s test suite — the fixture updates from Step 4 should make it green.

**Step 8: Commit**

```bash
git add packages/language-server examples/cloud-system/story.c4 packages/vscode/likec4.tmLanguage.json apps/playground/likec4.tmLanguage.json apps/docs/likec4.tmLanguage.json
git commit -m "feat(language-server): parse anchor <ElementRef> on story scenes, drop sceneLayout"
```

---

### Task 3: Language-server — validate anchor on a scene with no predecessor

**Files:**
- Modify: `packages/language-server/src/validation/story-view.ts`
- Modify: `packages/language-server/src/validation/index.ts`
- Test: extend `packages/language-server/src/validation/story-view.spec.ts`

**Interfaces:**
- Produces: a new `StoryScene`-keyed validation check rejecting `anchor` on a scene with no predecessor.

**Step 1: Write the depth-first "has no predecessor" check**

In `packages/language-server/src/validation/story-view.ts`, add a new factory following the file's existing pattern (each factory takes `services: LikeC4Services` and returns a `ValidationCheck<...>`, per `storySubflowChecks`/`storyViewChecks`/`storyAltChecks`):

```ts
/**
 * A scene with no predecessor has nothing to anchor against — declaring
 * `anchor` there can never have an effect, and per this feature's design
 * (`docs/superpowers/specs/2026-08-04-story-scene-anchor-design.md`) that's
 * treated as an author mistake, not silently ignored.
 *
 * "No predecessor" is determined the same way `computeStoryView`
 * (`packages/core/src/compute-view/story-view/compute.ts`) flattens scenes:
 * a depth-first pre-order walk over the story's `statements` tree. This walk
 * is duplicated at the AST level (rather than reusing the core-level walk)
 * because validation runs on the AST before any view is computed.
 */
export function storySceneChecks(_services: LikeC4Services): ValidationCheck<ast.StoryScene> {
  return (node, accept) => {
    if (!node.body?.anchor) {
      return
    }
    const story = AstUtils.getContainerOfType(node, ast.isStoryView)
    if (!story?.body) {
      return
    }
    let sawEarlierScene = false
    let isFirst = true
    const visit = (statements: readonly ast.StoryStatement[]) => {
      for (const statement of statements) {
        if (ast.isStoryScene(statement)) {
          if (statement === node) {
            isFirst = !sawEarlierScene
            return
          }
          sawEarlierScene = true
        } else if (ast.isStoryAlt(statement)) {
          for (const branch of statement.branches) {
            visit(branch.statements)
          }
        } else if (ast.isStorySubflow(statement)) {
          visit(statement.statements)
        }
      }
    }
    visit(story.body.statements)
    if (isFirst) {
      accept('error', 'The first scene in a story has no prior scene to anchor against', {
        node,
        property: 'body',
      })
    }
  }
}
```
(Confirm the exact accept-call signature — `node`/`property`/message-first-vs-options-first — against a neighboring factory in the same file, e.g. `storyAltChecks`, before finalizing; match its exact call shape rather than guessing. Confirm `AstUtils.getContainerOfType` is the correct current Langium import path used elsewhere in this codebase — grep for `getContainerOfType` in `packages/language-server/src` for the established import.)

**Step 2: Register it**

In `packages/language-server/src/validation/index.ts`, add `StoryScene: storySceneChecks(services),` to the registration block (alongside the existing `StoryView:`, `StorySubflow:`, `StoryAlt:` entries around lines 204-206). Import `storySceneChecks` from `./story-view` at the top of the file alongside the other three.

**Step 3: Test**

Extend `packages/language-server/src/validation/story-view.spec.ts` with:
- A story whose *first* scene declares `anchor` on an element present in that scene's own view → expect the error message above.
- A story whose *second* scene (after a first, anchor-less scene) declares `anchor` → expect no error.
- A scene inside an `alt` branch that is the very first scene overall (the alt is the first statement in the story) and declares `anchor` → expect the error (exercises the recursive branch-walk, not just the top-level list).
- A scene that is NOT the first overall, but is the first statement *inside* an `alt` branch (i.e., has a predecessor from before the alt started) and declares `anchor` → expect no error (confirms the walk correctly treats "predecessor" as "anywhere earlier in the whole flattened order," not "earlier within this branch only").

**Step 4: Build and test**

`pnpm exec tsc --build`, run `packages/language-server`'s suite.

**Step 5: Commit**

```bash
git add packages/language-server/src/validation
git commit -m "feat(language-server): reject anchor on a story's first scene"
```

---

### Task 4: Diagram — anchor-driven viewport continuity

**Files:**
- Modify: `packages/diagram/src/likec4diagram/state/utils.ts` (`findCorrespondingNode` or a sibling function)
- Modify: `packages/diagram/src/likec4diagram/state/machine.state.navigating.ts` (the `fromNode`/`toNode` branch)
- Test: extend or create `packages/diagram/src/likec4diagram/state/utils.spec.ts` (check if this file exists; if not, add a focused spec for the new/changed function only, matching this codebase's existing test-file-per-source-file convention)

**Interfaces:**
- Consumes: `ComputedStoryScene.anchor` (Task 1), `context.story: AnyStoryView | null` (already exists, from the containment redesign).
- Produces: the existing `findCorrespondingNode(context, event)` (or a new sibling) returns a non-null `{ fromNode, toNode }` pair when the incoming scene declares an anchor and that element is found in both node lists — even when `context.lastOnNavigate` is absent.

**Step 1: Read the exact current mechanism before editing**

Read `packages/diagram/src/likec4diagram/state/utils.ts`'s current `findCorrespondingNode`, `nodeRef`, and `packages/diagram/src/likec4diagram/state/machine.state.navigating.ts`'s `fromNode`/`toNode` branch (the block calling `xyflow.getInternalNode(fromNode.id)!.internals.positionAbsolute`, `xyflow.flowToScreenPosition(...)`, and `xystore.getState().panBy(...)`) in full. This plan's research already traced the shape (`fromNode`/`toNode` found via `nodeRef` correlation between `context.xynodes` and `eventWithXYData.xynodes`, keyed today off `context.lastOnNavigate?.fromNode`), but read the literal current code before changing it — don't work from paraphrase.

**Step 2: Add an anchor-based fallback correspondence source**

`findCorrespondingNode`'s job is: given some "this FQN should stay put" signal, find the matching node in the outgoing (`context.xynodes`) and incoming (`event.xynodes`) node lists via `nodeRef`. Today that signal is `context.lastOnNavigate?.fromNode`. Add a second source: when `context.lastOnNavigate` is absent (or after it, as a fallback — click-driven correspondence should still win if both are somehow present), look up the incoming scene's declared anchor:
```ts
const incomingScene = context.story?.scenes.find(s => s.view === event.view.id)
const anchorFqn = incomingScene?.anchor
```
Use whichever FQN (from `lastOnNavigate` or `anchorFqn`) is available to drive the same `nodeRef`-based lookup `findCorrespondingNode` already does, returning `{ fromNode: null, toNode: null }` when neither is present (unchanged from today) or when the FQN doesn't resolve to a node in one of the two lists (the graceful-degradation case this plan's design explicitly calls for — an anchor whose element isn't actually rendered in the outgoing or incoming view falls through to the existing `else` branch in `machine.state.navigating.ts`, which does the ordinary fit-to-bounds `calcViewportForBounds` path unchanged).

Do not change the `panBy`/`raiseSetViewport` mechanics in `machine.state.navigating.ts` at all — the existing "pan by the screen-space delta, then settle into the fit-bounds viewport after a short delay" behavior is exactly what this feature should produce for an anchored scene transition too; only the *source* of `fromNode`/`toNode` changes, not what happens once they're found.

**Step 2b: Sequence-mode dynamic views are handled by the same fallback, not a special case**

The design's edge-case list flags dynamic views shown in sequence mode (lifelines/messages, not free node positions) as a case where the anchor pan shouldn't apply. Do not add a special check for this — if `convertToXYFlow` doesn't produce a plain positioned node for the anchor's FQN when rendering in sequence mode, the `nodeRef` lookup in Step 2 simply won't find a match in one of the two node lists, and the existing fallback (ordinary `calcViewportForBounds` fit-to-bounds) already applies. Confirm this holds by testing it directly (a scene whose view is a dynamic view rendered in `sequence` mode, with an anchor declared) rather than assuming — if it turns out `nodeRef`/`convertToXYFlow` *does* produce a matching node in sequence mode with a misleading position, that's a real gap to report, not something to silently paper over.

**Step 3: Test**

Add or extend a spec covering: `findCorrespondingNode` (or whatever it's renamed to, if you introduce a new function instead of extending in place) returns a real `{ fromNode, toNode }` pair when `context.lastOnNavigate` is absent but the incoming scene declares an `anchor` matching a node present in both `context.xynodes` and `event.xynodes`; returns `{ fromNode: null, toNode: null }` when the anchor FQN isn't found in one of the two lists; and confirms `lastOnNavigate` still wins when both signals happen to be present (test this by giving them different target FQNs and asserting the `lastOnNavigate` one is used — pick whichever precedence you actually implemented in Step 2 and assert that behavior explicitly, don't leave it unspecified).

**Step 4: Build and test**

`pnpm exec tsc --build`, run `pnpm --filter @likec4/diagram test`.

**Step 5: Commit**

```bash
git add packages/diagram/src/likec4diagram/state
git commit -m "feat(diagram): pan the viewport to a story scene's declared anchor"
```

---

### Task 5: Diagram — StoryControls boundary buttons + dual controls for dynamic-view scenes

**Files:**
- Modify: `packages/diagram/src/navigationpanel/walkthrough/StoryControls.tsx`
- Modify: `packages/diagram/src/navigationpanel/NavigationPanel.tsx`
- Test: extend `packages/diagram/src/navigationpanel/walkthrough/StoryControls.spec.ts` if it exists (check first), or add one; check for an existing `NavigationPanel.spec.ts`/similar for the mode-derivation logic.

**Interfaces:**
- Consumes: `prevScene`/`nextScene` from `packages/diagram/src/navigationpanel/walkthrough/storyScenePosition.ts` (already exist, from the containment redesign).

**Step 1: Fix StoryControls' boundary visibility**

In `StoryControls.tsx`, the Previous and Next buttons currently use `disabled={!story}` (always enabled once inside a story, regardless of position). Change both to match `ActiveWalkthroughControls.tsx`'s existing convention for the exact same kind of boundary (`disabled={!hasPrevious}` / `disabled={!hasNext}`):
```tsx
<StoryControlButton
  key="story-prev"
  disabled={!prev}
  onClick={e => {
    e.stopPropagation()
    if (prev) {
      diagram.navigateTo(prev.view)
    }
  }}
  leftSection={<IconPlayerSkipBackFilled size={10} />}
>
  Previous
</StoryControlButton>
```
```tsx
<StoryControlButton
  key="story-next"
  disabled={!next}
  onClick={e => {
    e.stopPropagation()
    if (next) {
      diagram.navigateTo(next.view)
    }
  }}
  rightSection={<IconPlayerSkipForwardFilled size={10} />}
>
  Next
</StoryControlButton>
```
(`prev`/`next` are already computed in this component via `prevScene(story, viewId)`/`nextScene(story, viewId)` — this only changes which value drives `disabled`, not the click handlers, which already correctly no-op via their own `if (prev)`/`if (next)` guards.)

**Step 2: Make dynamic-view walkthrough coexist with story controls**

This is the real fix for "different sets of previous/next buttons for dynamic views inside stories." Today, `NavigationPanel.tsx`'s `mode` selector treats `context.activeWalkthrough` being set as an unconditional signal to replace the *entire* `NavigationPanelControls` row (which is `StoryControls`' only mount point) with `ActiveWalkthroughControls`. Read the current `select` selector and the JSX around it in full before editing (`mode: 'default' | 'walkthrough-flow' | 'walkthrough'`, and the `{mode === 'walkthrough' ? <ActiveWalkthroughControls /> : <NavigationPanelControls />}` swap).

Add a fourth mode, `'walkthrough-in-story'`, for exactly the case `context.story != null && isActiveWalkthrough`:
```tsx
const select = selectDiagramContext(s => {
  const isActiveWalkthrough = !!s.activeWalkthrough
  const isInStory = s.story != null
  if (isDynamicView(s.view) && isActiveWalkthrough) {
    const isSequenceView = s.dynamicViewVariant === 'sequence'
    if (isSequenceView && hasProp(s.view, 'flow')) {
      return { view: s.view, story: s.story, mode: 'walkthrough-flow' as NavigationPanelMode }
    }
    return {
      view: s.view,
      story: s.story,
      mode: (isInStory ? 'walkthrough-in-story' : 'walkthrough') as NavigationPanelMode,
    }
  }
  return { view: s.view, story: s.story, mode: 'default' as NavigationPanelMode }
})

type NavigationPanelMode =
  | 'default'
  | 'walkthrough-flow'
  | 'walkthrough'
  | 'walkthrough-in-story'
```
Then, where the JSX currently does `{mode === 'walkthrough' ? <ActiveWalkthroughControls /> : <NavigationPanelControls />}`, render both when `mode === 'walkthrough-in-story'` — put `StoryControls`' scene-stepping alongside `ActiveWalkthroughControls`' step-stepping in the same row, since `NavigationPanelControls` already composes multiple controls side by side (breadcrumbs, `DynamicViewControls`, `StoryControls`, search) in one `hstack`:
```tsx
{mode === 'walkthrough'
  ? <ActiveWalkthroughControls />
  : mode === 'walkthrough-in-story'
  ? (
    <>
      <ActiveWalkthroughControls />
      <StoryControls key="story-controls" />
    </>
  )
  : <NavigationPanelControls />}
```
(Confirm this JSX actually fits the surrounding layout sensibly when you run it in the dev server per Task 6's e2e check — `ActiveWalkthroughControls` and `StoryControls` were each designed to be the sole content of their row, so seeing both together for the first time may reveal a real layout adjustment is needed, e.g. wrapping, spacing, or which one goes first. Treat the code above as a starting point to get both mounted and interactive, not a guaranteed-final visual arrangement — use your own judgment once you see it rendered, and note what you changed and why in your report.)

**Step 3: Test**

If a spec exists for `NavigationPanel.tsx`'s mode derivation, extend it with a case asserting `mode === 'walkthrough-in-story'` when both `story` and `activeWalkthrough` are set on a dynamic view, and that it stays `'walkthrough-flow'` (not `'walkthrough-in-story'`) when the dynamic view is in sequence-with-flow mode regardless of story context (sequence-flow mode hides the panel entirely per the existing `mode !== 'walkthrough-flow'` gate — confirm this still holds by reading that gate's condition, don't just assume). If no such spec exists, add a minimal one testing just the `select` selector's pure logic (it's a `selectDiagramContext(...)` — check whether this codebase's existing pattern lets you unit-test the selector function directly against a hand-built context object, matching however other `selectX` functions in this file/sibling files are already tested, if at all).

**Step 4: Build and test**

`pnpm exec tsc --build`, run `pnpm --filter @likec4/diagram test`.

**Step 5: Commit**

```bash
git add packages/diagram/src/navigationpanel
git commit -m "fix(diagram): hide story controls at boundaries, keep them visible during a dynamic-view walkthrough"
```

---

### Task 6: SPA — simplify `StoryReact.tsx`

**Files:**
- Modify: `packages/likec4-spa/src/pages/StoryReact.tsx`

**Interfaces:**
- Consumes: `view={view}` and `story={story.$view}` passed straight through to `<LikeC4Diagram>` — no pre-transform.

**Step 1: Remove the resolve/pre-transform machinery**

In `packages/likec4-spa/src/pages/StoryReact.tsx`, delete:
- The import `import { positionsOf, resolveScene } from '@likec4/core'` and `import type { LayoutedView } from '@likec4/core/types'`.
- The `previousRef`/`previousStoryId` state and the `storyId`-change reset block.
- The `currentScene`/`resolved`/`resolvedView` computation.
- The `useEffect` committing `resolvedView` into `previousRef.current`.
- The now-unused `useEffect`/`useRef`/`useState` imports from `react`, if nothing else in the file still uses them (check before removing each).

Change the `<LikeC4Diagram>` JSX's `view` prop from `view={resolvedView}` to `view={view}` (the plain value already returned by `useCurrentView()`), and change the early-return guard from `if (!story || !view || !resolvedView)` to `if (!story || !view)`.

The rest of the file (`onNavigateTo`'s nested-vs-flat logic, `useDocumentTitle`, all other `<LikeC4Diagram>` props) is unrelated to this change and stays exactly as-is.

**Step 2: Build and test**

`pnpm exec tsc --build`, run `pnpm --filter @likec4/spa test` (or whatever this package's actual filter name is — confirm from `package.json`, both `likec4-spa` and `@likec4/spa` have appeared in different tasks' reports in this repo's history; use the one that actually resolves).

**Step 3: Commit**

```bash
git add packages/likec4-spa/src/pages/StoryReact.tsx
git commit -m "refactor(likec4-spa): stop pre-transforming scene geometry, diagram handles anchoring now"
```

---

### Task 7: Full-repo verification and docs

**Files:**
- Verify: dev-server smoke test
- Modify: `docs/rfcs/0002-story-containment-investigation.md` if it mentions `sceneLayout` (check first — it may only mention the containment redesign and never reference scene alignment at all; if so, no edit needed there)

**Step 1: Full-repo build/test/lint**

`pnpm exec tsc --build` (clean, repo-wide), `pnpm test` (or `pnpm test --no-typecheck`), `pnpm lint`. Fix anything red that's attributable to this plan's changes; if you find pre-existing, unrelated red (matching the pattern the containment-redesign plan's Task 9 already established — trace it to confirm it's byte-identical to `main` before assuming it's not yours), note it in your report rather than silently fixing or ignoring it.

**Step 2: End-to-end verification via the dev server**

Start the dev server (`cd packages/likec4-spa && pnpm dev`, workspace defaults to `../../examples`). Using a real browser or the repo's vendored `playwright-core` (per the containment-redesign plan's Task 7/Task 9 precedent — reuse that approach, don't invent a new one), verify on `/project/cloud-system/story/migration`:

1. **Anchor pan is visible and correct.** Step through `cloud_legacy → dynamic-view-1 → cloud_next` via Next. `customer`'s node should stay visually still (or very close to it, allowing for the brief fit-to-bounds settle afterward) across the first transition; `cloud.next.backend`'s node should stay visually still across the second. This is the actual proof this feature works — a `console.log` of the computed pan delta, or a before/after screenshot comparison of the anchor node's screen position, are both acceptable evidence; pick whichever is easier to capture reliably, matching how the containment-redesign plan's Task 7 captured its offset numbers.
2. **Story Previous/Next hide at the boundaries.** On `cloud_legacy` (first scene), confirm "Previous" is disabled/absent. On whichever scene is last in traversal order (including through the `alt` block — check `StoryFlow`'s actual last scene, don't assume it's `cloud_next`'s bare top-level declaration), confirm "Next" is disabled/absent.
3. **Dual controls render together on a dynamic-view scene.** Navigate to the `dynamic-view-1` scene, click "Start" to begin its own walkthrough, and confirm BOTH the dynamic view's own step Next/Prev AND the story's scene Next/Prev are visible and independently clickable — clicking the dynamic view's Next should NOT change the story's current scene, and clicking the story's Next should NOT be blocked by the dynamic-view walkthrough being active.
4. **Nothing else regressed**: redirect-to-first-scene, push-history back-button behavior, and the flat `/view/migration` 404 (all already verified once by the containment-redesign plan) still hold on this branch's tip.

Be honest in your report about which checks were live-browser observations vs. log/protocol-level substitutes, matching the standard the containment-redesign plan's Tasks 7-9 already set.

**Step 3: Docs**

If `docs/rfcs/0002-story-containment-investigation.md` or `docs/rfcs/0001-story-view.md` mention `sceneLayout: anchored | independent | unified` as current/shipped behavior (not just as historical design discussion), add a short note that it was superseded by the `anchor <ElementRef>` mechanism in this plan, citing this plan's file path. Do not rewrite either RFC's substantive content — a one- or two-sentence pointer is enough.

**Step 4: Commit**

```bash
git add docs/rfcs
git commit -m "docs: note that sceneLayout was superseded by explicit scene anchors"
```

## Self-Review Notes

- **Task 3's validation is deliberately narrower than the design spec** — see the "Deviation" section at the top of this plan. Don't let a reviewer send this back for "missing" the present-in-both-views check without first reading that section.
- **Task 5's dual-controls JSX is explicitly marked as a starting point, not a guaranteed-final layout** — the actual visual arrangement of two previously-mutually-exclusive control rows appearing together for the first time is exactly the kind of thing that looks fine in code and wrong on screen; Task 7's e2e check is what actually validates it, not Task 5's own unit tests.
- **Tasks 4 and 5 both touch only `packages/diagram`, with zero file overlap** (Task 4: `utils.ts`/`machine.state.navigating.ts`; Task 5: `StoryControls.tsx`/`NavigationPanel.tsx`) and Task 4 has no dependency on Task 5 or vice versa — both depend only on Task 1 (core's `anchor` field). If parallel execution is wanted, Task 5 can be dispatched in an isolated worktree branched from Task 1's commit while Task 4 runs on the main checkout, mirroring how the earlier containment-redesign plan parallelized its own Task 3/Task 6 — merge back before Task 6 (SPA), which doesn't strictly need either but is easiest to sequence after both land.
