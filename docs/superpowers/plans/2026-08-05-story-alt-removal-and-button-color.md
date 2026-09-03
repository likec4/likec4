# Story `alt` Removal and Button Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate `alt` the same way the other not-yet-implemented flow-control keywords already are (grammar admits it, validation rejects it), removing the story-view feature's only branching mechanism — which is also the direct, sole cause of the scene-identity/repeated-view-id limitation just documented in `docs/superpowers/plans/2026-08-04-story-scene-anchor.md`. Make the story walkthrough's own Previous/Next controls unmistakably distinct from a dynamic view's own walkthrough Previous/Next controls when both render together in the `walkthrough-in-story` mode — via both a distinct color (grape) AND distinct button text ("Previous Scene"/"Next Scene" vs. "Previous Step"/"Next Step"), since color alone is easy to miss and the two pairs currently read identically ("Previous"/"Next") at a glance.

**Architecture:** No grammar or core-type changes. `alt` already parses today via `StoryAlt`/`StorySubflow` (reused from dynamic views' `SubflowKind`); this plan changes only the validation layer, exactly mirroring the existing pattern that already gates `opt`/`par`/`parallel`/`loop`/`break` with a "not yet supported in stories" diagnostic. The example DSL and RFC 0001 both currently describe `alt` as MVP-shipped; both need updating to reflect that it's now future work, for the same reason as its siblings.

**Tech Stack:** Langium validation (`ValidationCheck`), Mantine (`Button` `color` prop).

**Reference documents:** `docs/rfcs/0001-story-view.md` (original spec — has the section and table this plan edits), `docs/superpowers/plans/2026-08-04-story-scene-anchor.md` (has the "Known limitation" section this plan's docs point back to).

## Global Constraints

- Branch: continue directly on `story-view-implementation` (no worktree needed — both tasks are small and touch different packages).
- `origin` is upstream `likec4/likec4` — never push there. Fork remote is `fork`. Do not push unless explicitly asked.
- Stage explicit paths only — never `git add -A`.
- No changesets (unreleased POC branch).
- Commit after each task, Conventional Commits style.

---

### Task 1: Gate `alt` in validation, update the example, update RFC 0001

**Files:**
- Modify: `packages/language-server/src/validation/story-view.ts` (`storyAltChecks`, lines 170-178)
- Modify: `packages/language-server/src/validation/story-view.spec.ts` (existing `alt`-related tests)
- Modify: `packages/language-server/src/model/__tests__/story-view.spec.ts` (existing `alt`-using fixtures, if any now fail)
- Modify: `examples/cloud-system/story.c4`
- Modify: `docs/rfcs/0001-story-view.md`

**Interfaces:**
- Produces: `storyAltChecks` now rejects every `ast.StoryAlt` node unconditionally with the message `'"alt" is not yet supported in stories'`, matching the exact wording convention `storySubflowChecks` already uses for `opt`/`par`/`parallel`/`loop`/`break` (`` `"${el.kind}" is not yet supported in stories` ``).

**Step 1: Gate `alt` in `storyAltChecks`**

In `packages/language-server/src/validation/story-view.ts`, replace the current `storyAltChecks` (lines 170-178):

```ts
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

with:

```ts
/**
 * `alt` was the MVP's only implemented branching construct, but it is the
 * direct and sole cause of the scene-identity limitation documented in
 * `docs/superpowers/plans/2026-08-04-story-scene-anchor.md`'s "Known
 * limitation" section: a story's flattened scene list can repeat a view id
 * only when an `alt` branch revisits an already-declared scene, and nothing
 * in the current routing/diagram-context identity can then tell the
 * occurrences apart. Rather than ship a branching mechanism with a known,
 * silently-degrading failure mode, `alt` now joins the same "grammar admits
 * it, validation gates it" treatment RFC 0001 already uses for `opt` / `par`
 * / `parallel` / `loop` / `break` (see `storySubflowChecks` above) — parsed
 * for forward compatibility, rejected until the scene-identity design work
 * lands. See RFC 0001's "Recommended adoption order" table for the updated
 * tier.
 */
export const storyAltChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryAlt> => {
  return tryOrLog((el, accept) => {
    accept('error', '"alt" is not yet supported in stories', { node: el })
  })
}
```

Do not touch `storySubflowChecks` — the nested `when`/`if`/`else` branches inside a now-always-rejected `alt` still individually pass their own check (their container genuinely is a `StoryAlt`), which is fine: one clear error on the enclosing `alt` node is the right amount of diagnostic noise, not a cascade of errors on every nested branch.

**Step 2: Fix existing tests that assumed `alt` worked**

Read `packages/language-server/src/validation/story-view.spec.ts` in full. Several existing tests use `alt { when ... } else { ... }` as a *valid* construct (e.g. `'accepts a valid story'`, the two `anchor`-inside-`alt` tests, the two repeated-view-id-warning tests, the two `becomes`/duplicate-anchor-inside-`alt` tests from the previous plan). Every one of these now gets a `'"alt" is not yet supported in stories'` error it didn't get before. For each:
- If the test's actual point was about something OTHER than alt (e.g. "does the repeated-view-id warning fire" or "does the duplicate-anchor check fire"), keep the `alt` usage (that's still the only way to construct a repeated-view-id scenario in this test file today) but update the assertion to also expect the alt-rejection error alongside whatever the test was actually checking — e.g. `expect(errors).toContain('"alt" is not yet supported in stories')` added alongside the existing expected error/warning, and any `expect(errors).toEqual([])` changed to expect the alt error instead.
- If the test's whole point WAS `alt` working (e.g. `'rejects an empty alt'`, `'rejects a non-branch block directly inside alt'`, `'rejects an alt branch outside alt'`), these are now testing behavior that's moot once every `alt` is rejected regardless of its internal shape. Replace or remove them — read each one and decide based on what it was actually verifying: `'rejects an empty alt'` becomes redundant with the new blanket rejection (delete it, or repurpose it to explicitly assert an empty `alt {}` still gets the new message, whichever reads more clearly). `'rejects a non-branch block directly inside alt'` and `'rejects an alt branch outside alt'` test `storySubflowChecks`' own logic (unrelated to whether `alt` itself is gated) — these should stay as-is; confirm they still pass (they test `StorySubflow`/branch-kind validation, which this task does not change).
- Add one new, explicit test: `'rejects alt entirely, even a well-formed one'` — a syntactically valid `alt { when 'x' { scene v1 } else { scene v2 } }` with no other issues, asserting `errors` contains exactly `'"alt" is not yet supported in stories'` and nothing else. This is the test that directly proves this task's actual change.

Also check `packages/language-server/src/model/__tests__/story-view.spec.ts` for any fixture using `alt` that asserts on diagnostics/errors (not just structural parsing) — the earlier anchor plan added a test there (`'parses a story with scenes, alt and becomes'`) asserting `errors: []` plus two repeated-view-id warnings; this now needs the alt-rejection error added to its expected diagnostics too.

**Step 3: Update the example**

In `examples/cloud-system/story.c4`, remove the `alt { ... }` block entirely, leaving a flat, linear 3-scene story:

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
  }

}
```

This also means the story can now be walked to its true last scene (`cloud_next`) without hitting the repeated-view-id stall — the story-scene-anchor plan's "Known limitation" section describes exactly this bug and its cause; removing the only DSL construct that could produce a repeated view id resolves it for this example specifically, though the underlying fail-safe/warning machinery stays in the code as generic protection for whenever branching returns.

**Step 4: Update RFC 0001**

In `docs/rfcs/0001-story-view.md`:

1. **"### Branching" section (currently lines 118-155):** after the existing depth-first-traversal explanation (ending "...this step is elaborated in another dynamic view", around line 155), add a short note:
   > **Update:** `alt` (and its `when`/`if`/`else` branches) shipped in the initial MVP but was pulled back to "not yet supported" — see `docs/superpowers/plans/2026-08-04-story-scene-anchor.md`'s "Known limitation" section. The routing/diagram-context identity used to address a scene is currently the target *view* id, and `alt` was the only construct that could make a story's flattened scene list repeat a view id; once that happens, nothing client-observable can tell the repeated occurrences apart, which silently breaks scene stepping, boundary detection, and per-scene anchors. `alt` now joins the same "grammar admits it, validation gates it" treatment described below for `opt`/`par`/`parallel`/`loop`/`break`, pending a design pass on making the scene's own `StepPath` (not the view id) part of that identity.

2. **"### Flow control beyond `alt` — speculative" section header and opening paragraph (lines 157-162):** the header and opening sentence ("`alt` is the only block the MVP implements...") are no longer accurate — `alt` is no longer implemented either. Update the header to "### Flow control — speculative" (drop "beyond `alt`") and rewrite the opening paragraph to say all `SubflowKind` keywords, `alt` included, are grammar-admitted-but-validation-gated pending future work, rather than singling `alt` out as the one exception.

3. **"#### Recommended adoption order" table (currently lines 267-276):** move `alt`, `when`, `if`, `else` out of the `MVP` row. Delete the `MVP` row entirely (nothing is MVP-shipped anymore) and add `alt`, `when`, `if`, `else` as a new row — recommend placing it above `opt` (branching is more fundamental to the RFC's original narrative-variation goal than any of the label-only annotations), e.g.:

   | Order    | Keyword                     | Rationale                                                      |
   | -------- | ---------------------------- | --------------------------------------------------------------- |
   | Next     | `alt`, `when`, `if`, `else`  | Needed for branching; pulled from MVP pending a scene-identity fix (see "Branching," above). |
   | Next     | `opt`                        | Clearest narrative reading; reuses collapse-to-skip machinery.   |
   | Next     | `loop` (label only)          | Matches a real migration pattern; cheap as an annotation.        |
   | Later    | `try` / `catch` / `finally`  | Resolve the vocabulary question first.                          |
   | Later    | `par` / `parallel`           | Resolve the rendering question first.                           |
   | Deferred | `break`                      | Meaningless until fork prompts exist.                            |

4. **"### Validations" table (currently around lines 653-661):** the row `` `alt` block has no branches | error | language-server `` no longer describes real behavior (an empty `alt` and a well-formed `alt` are now rejected identically). Replace it with:

   | Check                                              | Severity                               | Location        |
   | --------------------------------------------------- | --------------------------------------- | --------------- |
   | `alt` (any use at all, well-formed or not)          | error — "not yet supported in stories" | language-server |

   Keep the existing `` `alt` branch is not a `when` / `if` / `else` block `` row as-is — that's `storySubflowChecks`' own logic, unchanged by this task, and still fires (in addition to the new blanket `alt` rejection) for a malformed branch kind inside an alt.

Do not rewrite the "Branching" section's own code example (lines 122-135) or its depth-first-traversal explanation — those describe the design's intent accurately; only the "shipped in MVP" framing is now wrong, which the added note (item 1 above) corrects without touching the example itself.

**Step 5: Build and test**

`pnpm exec tsc --build` (repo root) — must stay fully clean (no type changes in this task, so this should be trivially true, but confirm). Run `packages/language-server`'s test suite, make it green with the updated/added tests from Step 2.

**Step 6: Commit**

```bash
git add packages/language-server/src/validation examples/cloud-system/story.c4 docs/rfcs/0001-story-view.md
git commit -m "fix(language-server): gate alt the same as the other unimplemented flow-control keywords"
```

---

### Task 2: Distinguish story walkthrough buttons from dynamic-view walkthrough buttons (color + label)

**Files:**
- Modify: `packages/diagram/src/navigationpanel/walkthrough/StoryControls.tsx` (`StoryControlButton` lines 31-47; the `story-prev`/`story-next` button children, lines ~95-107 and ~158-170)
- Modify: `packages/diagram/src/navigationpanel/walkthrough/ActiveWalkthroughControls.tsx` (`prev`/`next` `PrevNextButton` children, lines ~90-97 and ~124-131)

**Interfaces:** None — pure styling/copy change, no new props or exports.

**Rationale:** These two button pairs can render side by side simultaneously (the `walkthrough-in-story` mode added by the anchor plan's Task 5 renders `<ActiveWalkthroughControls />` and `<StoryControls />` together). Today both pairs say exactly "Previous"/"Next" with only an icon-and-color difference (story: no color/theme default; dynamic view: `color="orange"`), which reads as one confusing set of controls rather than two. Color alone is easy to miss at a glance — this task adds distinct button text on top of a distinct color, so the two pairs are unambiguous even in a screenshot or a quick glance, not just on close inspection.

**Step 1: Add grape color and rename to "Previous Scene" / "Next Scene" in `StoryControls.tsx`**

`StoryControlButton` (lines 31-47) currently:

```tsx
export const StoryControlButton = forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<'button'>>((
  props,
  ref,
) => (
  <Button
    variant="light"
    size="xs"
    fw="500"
    {...props}
    ref={ref}
    component={m.button}
    whileTap={{
      scale: 0.95,
    }}
    layout="position"
  />
))
```

Add `color="grape"`:

```tsx
export const StoryControlButton = forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<'button'>>((
  props,
  ref,
) => (
  <Button
    variant="light"
    color="grape"
    size="xs"
    fw="500"
    {...props}
    ref={ref}
    component={m.button}
    whileTap={{
      scale: 0.95,
    }}
    layout="position"
  />
))
```

`{...props}` is spread *after* `color="grape"`, so a caller could still override it — confirm no call site in `StoryControls.tsx` itself passes its own `color` prop to `StoryControlButton` (it doesn't, per the current file — both the `story-prev` and `story-next` usages only pass `disabled`/`onClick`/`leftSection`/`rightSection`/`key`/children), so `grape` is what actually renders for both buttons.

Then rename the button text at both call sites. The `story-prev` button (currently, around line 95-107):

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

Change the child text from `Previous` to `Previous Scene`. The `story-next` button (currently, around line 158-170):

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

Change the child text from `Next` to `Next Scene`. Do not touch any other prop on either button.

**Step 2: Rename to "Previous Step" / "Next Step" in `ActiveWalkthroughControls.tsx`**

This keeps the pairing symmetric ("Scene" vs. "Step" is the actual distinction between what each control steps through) so the two pairs read as unmistakably different controls even without color, and remains accurate on its own when a dynamic view's walkthrough runs outside any story (the sole pre-existing usage). The `prev` button (currently, around line 90-97):

```tsx
      <PrevNextButton
        key="prev"
        disabled={!hasPrevious}
        onClick={() => diagram.walkthroughStep('prev')}
        leftSection={<IconPlayerSkipBackFilled size={10} />}
      >
        Previous
      </PrevNextButton>
```

Change the child text from `Previous` to `Previous Step`. The `next` button (currently, around line 124-131):

```tsx
      <PrevNextButton
        key="next"
        disabled={!hasNext}
        onClick={() => diagram.walkthroughStep('next')}
        rightSection={<IconPlayerSkipForwardFilled size={10} />}
      >
        Next
      </PrevNextButton>
```

Change the child text from `Next` to `Next Step`. Do not add a `color` prop to `PrevNextButton` (lines 16-26 of `Button.withProps({...})`) — it sets no `color` itself, so it renders Mantine's theme default (`primaryColor: 'indigo'`, set in `packages/diagram/src/context/DefaultMantineProvider.tsx:12`). Indigo (dynamic-view controls, unchanged) and grape (story controls, from Step 1) are adjacent-but-distinguishable Mantine hues; combined with the text change this task makes, that's sufficient — this task changes text only in this file, not color. (The `Stop` button on line ~79, `TriggerWalkthroughButton` with an explicit `color="orange"`, is a separate, unrelated component — do not confuse it with `PrevNextButton`.)

**Step 3: Check for any test or snapshot asserting the old button text**

Grep `packages/diagram/src` for the literal strings `'Previous'` and `'Next'` (or `>Previous<`, `>Next<` in snapshot files) to check whether any `.spec.ts`/`.spec.tsx` or `__snapshots__` fixture asserts on the old button text in either `StoryControls` or `ActiveWalkthroughControls`. Update any that do; if none exist (most likely, since AGENTS.md notes this package's stateful features are tested via pure selector/derivation functions, not full component-render snapshots), note that in the report.

**Step 4: Verify visually**

Start the dev server (`cd packages/likec4-spa && pnpm dev`), visit `/project/cloud-system/story/migration`, and confirm the story's buttons render grape and read "Previous Scene"/"Next Scene". Then visit the `dynamic-view-1` scene inside the story, click "Start" to enter its own walkthrough, and confirm both button pairs render together, are visually distinct by color, and read "Previous Scene"/"Next Scene" (grape) vs. "Previous Step"/"Next Step" (orange).

**Step 5: Build and lint**

`pnpm exec tsc --build` (repo root) — must stay fully clean. `pnpm exec oxlint packages/diagram/src/navigationpanel/walkthrough/StoryControls.tsx packages/diagram/src/navigationpanel/walkthrough/ActiveWalkthroughControls.tsx` — must stay clean (or show only the same pre-existing warnings already present before this change).

**Step 6: Commit**

```bash
git add packages/diagram/src/navigationpanel/walkthrough/StoryControls.tsx packages/diagram/src/navigationpanel/walkthrough/ActiveWalkthroughControls.tsx
git commit -m "style(diagram): make story walkthrough controls visually distinct from dynamic-view walkthrough controls"
```

## Self-Review Notes

- **Task 1's test-fixing step (Step 2) is deliberately open-ended** rather than enumerating every exact before/after assertion, because the previous plan (`2026-08-04-story-scene-anchor.md`) added several `alt`-using fixtures whose exact current line numbers and content this plan's author has not re-verified line-by-line since that plan's last merge commit (`3d42a944b`). The implementer must read `story-view.spec.ts` and `model/__tests__/story-view.spec.ts` fresh and decide, per the guidance given, which tests to fix vs. delete vs. leave alone — this is a judgment call the task brief equips them to make, not a gap.
- **No core or grammar changes are needed** — confirmed by reading `packages/core/src/compute-view/story-view/compute.ts`'s `walk` function during this plan's research: it already handles `StoryAlt`/`StorySubflow` generically as part of the same tree-walk that handles plain scenes, and that logic has no `alt`-specific special-casing to remove. It stays fully intact and dormant (unreachable via any validation-passing DSL) until some future flow-control keyword is un-gated.
