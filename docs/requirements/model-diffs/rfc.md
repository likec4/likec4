---
type: RFC
title: 'RFC: Model diffs'
description: Planned changes of the model as diffs, compare views before and after a diff, apply or discard a diff, and safe delete of elements.
status: proposed
date: 2026-10-05
authors: [Endre Deak]
discussion: https://github.com/likec4/likec4/discussions/1192
tags: [rfc, model-diffs, safe-delete, dsl]
---

# RFC: Model diffs

| Field           | Value                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status          | Proposed (draft → proposed → accepted or rejected → implemented)                                                                                                       |
| Authors         | Endre Deak                                                                                                                                                             |
| Created         | 2026-10-05                                                                                                                                                             |
| Discussion      | [#1192](https://github.com/likec4/likec4/discussions/1192), approach from [this comment](https://github.com/likec4/likec4/discussions/1192#discussioncomment-11214267) |
| Decision record | [ADR-0002](../../adrs/0002-model-diffs.md), draft, set to accepted after the review                                                                                    |
| Implementation  | Done in three PRs (section 13). Code-level guide: [implementation.md](./implementation.md)                                                                             |
| User docs       | `apps/docs/src/content/docs/dsl/diff.mdx`                                                                                                                              |

## 1. Summary

Add a `diff` block to the DSL: a named, planned change of the model (an RFC, a proposal).
The model stays "as is" until the diff is applied. LikeC4 shows each view before and after the diff,
applies or discards the diff as a text edit of the sources, reports diffs that change the same part of the model,
and removes elements safely together with everything that references them.

This RFC asks the maintainers to accept the design and the decisions in section 12.

## 2. Motivation

### Problems

1. **A proposal has no place in the model.** If the author changes the model, the model no longer shows what exists.
   If the proposal stays outside the model (a document, a branch), nobody can see its effect on the views.
2. **Reviewers cannot see the change.** A review of `.c4` text does not show which views change and how.
3. **Removing an element is risky.** Relationships, deployed instances, view predicates, style rules, dynamic view
   steps and other projects reference it. The author finds them by hand, and orphans stay behind.
4. **Proposals collide.** Two teams can plan changes of the same element. Today they find out at merge time,
   as a text conflict, without the context of the model.

### Goals

- A proposal is part of the model sources, in the same DSL, with the same editor support and validation.
- The model "as is" never changes because of a proposal.
- Any view can be compared before and after a proposal, with the changes marked.
- An accepted proposal becomes the model with one action, and the result is reviewable as a normal source change.
- Removal of an element shows its impact first, and leaves no dangling references.
- Collisions between proposals are visible early, and people (not the tool) resolve them.

### Non-goals

- A versioning system for models. Git stays the history and the safety net.
- Automatic merge or conflict resolution between proposals.
- Changes of deployment models, views or specification inside a diff (section 12).

## 3. Proposal

### Write a diff

```likec4
diff rfc1 'RFC-1: Payments service' {
  description 'Replace the SOAP gateway with a Payments service'

  remove {
    shop.legacyPayments                          // the element, its descendants and their relationships
    shop.orders -> bank 'checks fraud score'     // a relationship
  }

  add {
    extend shop {
      payments = container 'Payments Service'
    }
    shop.orders -> shop.payments 'requests payments'
    extend shop.orders {
      #next                                      // tags, links and metadata of an existing element
    }
  }
}
```

- `remove` lists elements and relationships of the model. `add` has the syntax of a `model` block.
- A diff can span several files. Diffs with the same name are one diff.
- Views can reference elements that a diff adds. In the model "as is" these references are ignored.

### See the change

Each view gets a compare view: the view before and after the diff in one diagram.
Three modes share one layout, so nodes do not move when you switch:

- **As-is**: the model before the diff.
- **Changes**: both states; added items in green, removed items in red (faded), modified items in orange.
- **To-be**: the model after the diff.

### Apply or discard the diff

- **Apply** removes the `remove` entries with everything that references them, merges the `add` items into the
  element definitions, and deletes the diff. The result is a normal source change, reviewable in a PR.
- **Discard** deletes the diff. The model does not change.
- Only the model changes are kept. The title, description and comments of the diff are deleted with it.

### Overlapping diffs

Two diffs overlap if both change the same element or relationship, or if one depends on what the other removes
or adds. Both diffs get a warning. Applying an overlapping diff needs an explicit confirmation that the owners
of both diffs agreed. The tool never edits another diff: it reports the diffs that an edit breaks.

### Safe delete

Safe delete removes an element and everything that references it in one edit. A dry run reports relationships,
deployed instances, affected views and orphans (elements left without relationships, only suggested for removal).

### Where it is available

| Surface                             | What the user can do                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Editor (VS Code, other LSP clients) | Validation, overlap warnings, code actions: Apply diff, Discard diff, Safe delete                              |
| Playground                          | Compare modes, review the changes of each file, apply, roll back, removal impact                               |
| `likec4 start` and `likec4 build`   | Compare modes (read-only)                                                                                      |
| CLI                                 | `likec4 diff list`, `likec4 diff apply` and `discard` (`--dry-run`, `--accept-overlaps`), `likec4 safe-delete` |
| SDK                                 | `likec4.modelDiffs`, `likec4.removalImpact`, `likec4.modelEdits`                                               |
| MCP                                 | `list-diffs`, `removal-impact` (read-only)                                                                     |

## 4. Detailed design

Section numbers in brackets point to [implementation.md](./implementation.md).

### 4.1 Syntax and validation [4.1, 4.4]

```langium
ModelDiff:      'diff' name=Id title=String? '{' (props+=DiffStringProperty | removes+=DiffRemove | adds+=DiffAdd)* '}';
DiffRemoveEntry: source=FqnRef (RelationConnector target=FqnRef title=String?)? ';'?;
DiffAdd:        'add' '{' elements+=ModelElement* '}';
```

- `diff`, `add` and `remove` become keywords. They stay valid as names in every place where they were valid
  before (identifiers, global group names, custom colors, `#add`). Tests cover each place.
- A removed relationship is matched by source, target, kind, title and direction.
- Errors: a removed entry that does not exist (the model changed since the diff was written), a removed element
  that a diff adds, `extend` of a relationship, an added element that exists. Warnings: an empty diff, an overlap.

### 4.2 Model data and the "as is" invariant [4.2, 4.3]

- `add` blocks are indexed and scoped like `model` blocks, so diff-added elements resolve everywhere.
- The model "as is" is built from `model` blocks only. Diffs are a separate, optional field:
  `ParsedLikeC4ModelData.diffs?: Record<DiffId, ModelDiff>` (`remove`, `add`, `modify`).
  Without diffs the field is absent, and the model data does not change.
- When the model is computed, view references to diff-only elements are dropped.
  A view scoped to a diff-only element does not exist in the model "as is".

### 4.3 The to-be model [4.5]

`applyModelDiff(data, diff)` in `@likec4/core` is a pure function that returns the model data after the diff.
Removed elements take their descendants, relationships and deployed instances. Added elements need an existing
parent; added relationships need existing endpoints. Every consumer computes the to-be model the same way.

### 4.4 Compare views [4.5]

1. Build two models: "as is", and the result of `applyModelDiff`.
2. Compute the view in both states. References to elements missing in a state are dropped first.
3. Merge: nodes match by id; edges match by id, then by step (dynamic views), then by source and target.
   Each item gets `diffStatus` (`added`, `removed`, `modified`). A modified item keeps its previous properties in
   `diffBefore`, so the as-is mode shows it as it was.
4. Lay out the merged view once (Graphviz, unchanged). The UI filters it per mode without a new layout.

Compare views are derived data. They are never saved, and they do not take part in manual layouts.

### 4.5 Model edits: apply, discard, safe delete [4.6]

- Edits are targeted text edits of the sources. The DSL generator is not used: it drops comments and formatting.
- Placement: `extend` of an element goes into its definition (tags and links added if missing, metadata keys
  override, children at the end of the body); a relationship goes to the `model` block that defines the root of
  its source; a new root element goes to the `model` block with the most root elements.
- Apply refuses a diff with errors. It refuses an overlapping diff without the confirmation.
- Preview returns the text of each changed file before and after, with a token. Apply with the token runs only if
  the edits are still the same; otherwise the user reviews again.
- References inside other diffs are never changed. The result lists errors left in the changed files and new errors
  in other files, with the diff each error is in.
- Write path: with an LSP connection, `workspace/applyEdit` (the client asks for confirmation if it supports it).
  Without a connection (CLI, SDK), direct file writes. If a write fails, the files written before it are restored;
  the result names a file that cannot be restored.
- Roll back: the last 20 edits are kept in memory. Roll back restores the files if they did not change since.

### 4.6 Overlap rules [4.6]

From a footprint of each diff (removes, adds, relationships, elements it extends, relates to or adds children to,
metadata keys), two diffs overlap when:

- both remove the same element (or an ancestor of it) or the same relationship;
- both add the same element or relationship;
- both set the same metadata key of an element to different values;
- one removes an element that the other uses;
- one uses an element that only the other adds.

### 4.7 Architecture fit [4.6–4.13]

| Package                    | Role in this design                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `core`                     | Types and pure functions: apply, compare views, removal impact, line diff                              |
| `language-server`          | Grammar, parsing, validation, services for diffs, edits and removal impact, LSP requests, code actions |
| `language-services`        | SDK getters on the `LikeC4` class                                                                      |
| `vite-plugin`              | `likec4:diffs` virtual module with diff summaries and laid-out compare views. No RPC for this data     |
| `likec4-spa`               | Diff selector and compare modes; data from route loaders and a context provider                        |
| `diagram`, `style-preset`  | CSS classes per `diffStatus`, colors as semantic tokens `likec4.diff.*`. No diff state in the diagram  |
| `likec4` (CLI), `mcp`      | Commands and tools on top of the SDK. MCP tools are read-only                                          |
| `layouts`, `manual-layout` | Not changed                                                                                            |

This follows the repository rules: read-only model data goes through virtual modules, RPC stays for mutations,
the SPA does not import the language server, and the diagram does not know where data comes from.

### 4.8 Public surface [5]

| Area         | Addition                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DSL          | `diff` block with `remove` and `add`                                                                                                                                                                                              |
| Model data   | `diffs` (optional) in parsed, computed and layouted data; `diffStatus`, `diffBefore` (optional) on view nodes and edges                                                                                                           |
| Core         | `applyModelDiff`, `createCompareModels`, `computeCompareViews`, `filterCompareView`, `computeRemovalImpact` and related functions; `diffLines`                                                                                    |
| LSP          | `likec4/fetch-diffs`, `likec4/layout-compare-view`, `likec4/fetch-removal-impact`, `likec4/preview-model-edit`, `likec4/apply-model-edit`, `likec4/rollback-model-edit`; notification `likec4/onRequestRemovalImpact`; 4 commands |
| SDK          | `LikeC4.modelDiffs`, `LikeC4.removalImpact`, `LikeC4.modelEdits`                                                                                                                                                                  |
| CLI          | `likec4 diff list`, `likec4 diff apply`, `likec4 diff discard`, `likec4 safe-delete`                                                                                                                                              |
| MCP          | `list-diffs`, `removal-impact`                                                                                                                                                                                                    |
| Vite plugin  | `likec4:diffs`, `likec4:diffs/<projectId>`                                                                                                                                                                                        |
| Style preset | `likec4.diff.added`, `.modified`, `.removed`, `.orphan`                                                                                                                                                                           |

All additions are new. No existing API changes.

## 5. Compatibility

- Projects without diffs: no change in model data, views or output.
- Sources that use `diff`, `add` or `remove` as names keep parsing.
- Consumers that ignore the `diffs` field see the same model as before.
- LSP clients without support for the new requests keep working. The removal impact preview is offered only to
  clients that ask for it (`initializationOptions.removalImpactPreview`).
- No new dependencies.

## 6. Security and privacy

- Edits change only the files listed in the preview. In editors the user confirms the edit. `--dry-run` writes nothing.
- MCP tools cannot change the model.
- Static builds publish the diffs of their sources, so a published site shows planned changes.
  The docs explain how to exclude diff files in the project configuration (decision D5).
- No network access, no code execution.

## 7. Performance

- Language server: compare models are computed on demand and cached per model instance; a compare view is laid
  out on request. Overlaps are computed once per project per link cycle.
- Vite plugin: the `likec4:diffs` module lays out every affected compare view. Static builds do it once;
  the dev server repeats it on each model change while the module is loaded.
- Edits: previews build the new texts in memory; apply writes only the changed files.

## 8. Testing and validation

- Unit tests in each package: grammar keywords, parsing and building (multi-file diffs, validation errors),
  apply and compare views, removal impact, overlaps, apply text equal to `applyModelDiff`, preview, stale token,
  roll back, write failures, SDK, MCP tools, virtual module ([implementation.md](./implementation.md), section 9).
- e2e: diff selector and compare modes in a static build.
- Manual checks: playground (compare, review, apply, roll back, safe delete), dev server with hot reload,
  static build.
- Each of the three PRs passes `pnpm typecheck` and `pnpm test` on its own.

## 9. Drawbacks

- Three new keywords and a new top-level block: more language to learn and to keep stable.
- Diffs live in the sources, so stale diffs can pile up. Validation reports entries that no longer match.
- Apply edits text by fixed placement rules. The result can need a manual move of a new item.
- The notes of a diff are deleted on apply. Reasons must go to the model (`description`) or the commit message.
- Roll back lasts only while the language server runs.
- The dev server lays out compare views again on each model change while a diff is loaded.

## 10. Alternatives considered

| Alternative                                         | Why not                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proposals as git branches only (today)              | Invisible to the model and diagrams of `main`; no compare view; no validation against the current model; collisions found only as text conflicts at merge |
| A separate overlay format (for example `*.c4diff`)  | Needs a new parser, formatter and editor support; a `diff` block reuses the model syntax and all tooling                                                  |
| Status tags on elements (`#planned`, `#deprecated`) | No named, atomic change set; cannot remove relationships or keep two alternative proposals; no apply                                                      |
| A copy of the model as a separate to-be project     | Duplicated sources that drift; no merged compare view                                                                                                     |
| Regenerate files with the DSL generator on apply    | Lossy: comments and formatting outside the change are lost                                                                                                |
| Resolve overlaps automatically                      | Hides decisions: the owners of both proposals must agree                                                                                                  |
| Compare views over dev-server RPC                   | Not available in static builds; RPC is for mutations                                                                                                      |
| Edit history on disk                                | A new file format, cleanup and conflicts with git; git is the durable history                                                                             |

## 11. Prior art

- **IcePanel Drafts**: a draft forks the live model, changes are marked as future state, reviewers see the
  changes, and a merge creates a new model version; conflicts block the merge, and drafts do not interact with each
  other. Model diffs bring the same review flow to architecture as code: the diff is source text reviewed in PRs,
  several diffs coexist in one model, and overlaps are reported while authoring.
- **ArchiMate** models transitions with plateaus (stable states) and gaps (differences between plateaus).
  A diff is a gap between the as-is and the to-be state.
- **Terraform** `plan` and `apply`: preview the exact changes, then apply what was previewed.
  The preview token plays the role of a saved plan.
- **IDE safe delete refactoring** (for example IntelliJ IDEA): find usages before deleting.

## 12. Decisions requested

The committee is asked to accept or change each decision. The recommendation is in bold.

| #  | Decision                                                                                                                          | Recommendation                           |
| -- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| D1 | Proposals are `diff` blocks in the DSL, with the keywords `diff`, `add`, `remove` (still valid as names)                          | **Accept**                               |
| D2 | The model "as is" never changes because of a diff; diffs are a separate, optional field of the model data                         | **Accept**                               |
| D3 | Apply edits the source text in place with the placement rules of 4.5, and keeps only the model changes                            | **Accept**                               |
| D4 | Overlaps are warnings on both diffs, never resolved automatically; applying an overlapping diff needs a confirmation              | **Accept**                               |
| D5 | Static builds include diffs; the docs show how to exclude diff files. A config option to leave diffs out is added only on request | **Accept, revisit on user request**      |
| D6 | Public names of section 4.8 (LSP requests, commands, CLI, MCP tools, virtual module, tokens, SDK getters)                         | **Accept, or rename before PR 2 merges** |
| D7 | Delivery in three PRs (section 13)                                                                                                | **Accept**                               |

Out of scope, possible later work:

- compare views in the VS Code preview panel;
- views defined inside a diff, and changes of deployment models, views or specification inside a diff;
- rename or move of an element;
- diff status in exports (Mermaid, PlantUML, Markdown);
- a CI check that fails on overlapping diffs;
- notifications to the owners of overlapping diffs.

## 13. Rollout

The feature is opt-in: it has an effect only when the sources contain a `diff` block. No feature flag is needed.
Three PRs, each with its own docs and a `patch` changeset, merged in this order:

1. **DSL and model**: grammar, parsing, model data, validation (without overlaps), core apply, compare views and
   removal impact; docs for the syntax and validation.
2. **Edits and tooling**: apply, discard, safe delete, overlaps, LSP requests and code actions, SDK, CLI, MCP;
   docs for these.
3. **UI**: diagram markers and tokens, `likec4:diffs` virtual module, SPA, playground, e2e test;
   docs for compare views.

After acceptance, [ADR-0002](../../adrs/0002-model-diffs.md) records the decisions as accepted.

## 14. Approval

Review in [discussion #1192](https://github.com/likec4/likec4/discussions/1192) or in the PR that adds this RFC.

| Reviewer | Role | Decision (accept, accept with changes, reject) | Decisions changed | Date |
| -------- | ---- | ---------------------------------------------- | ----------------- | ---- |
|          |      |                                                |                   |      |
|          |      |                                                |                   |      |

Outcome: to be filled in after the review (status, accepted decisions, follow-up actions).
