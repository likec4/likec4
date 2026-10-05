---
type: Architecture Decision Record
title: 'ADR-0002: Model diffs'
description: Planned changes of the model as diff blocks, the model "as is" invariant, in-place apply, the overlap policy, diffs in static builds, public names and delivery.
status: draft
date: 2026-10-05
tags: [adr, model-diffs, dsl]
---

# 2. Model diffs

## Context

Proposals for architecture changes have no place in the model: changing the model hides what exists, and keeping
a proposal outside the model hides its effect on the views. Removing an element is risky, and proposals of different
teams can collide. The [RFC](../requirements/model-diffs/rfc.md) describes the design and the alternatives.

This record keeps the decisions D1–D7 of the RFC (section 12). It is a draft until the RFC review;
after the review it records the decisions as accepted.

## Decisions

1. **Proposals are `diff` blocks in the DSL** (D1). A diff has `remove` entries (elements, relationships) and an
   `add` block with the syntax of a `model` block. Diffs with the same name in several files are one diff.
   The keywords `diff`, `add` and `remove` stay valid as names.

2. **The model "as is" never changes because of a diff** (D2). Diffs are a separate, optional field of the model data
   (`diffs`); `elements` and `relations` keep their meaning. The to-be model is a pure function in `@likec4/core`
   (`applyModelDiff`). Compare views are derived from both states and are never saved; read-only diff data reaches
   the UI through the `likec4:diffs` virtual module, not through RPC.

3. **Apply edits the source text in place** (D3). Edits are targeted text edits with fixed placement rules; the DSL
   generator is not used. Only the model changes are kept: the title, description and comments of the diff are
   deleted with it. A preview carries a token, and apply runs only if the edits did not change. Other diffs are
   never edited.

4. **Overlaps are never resolved automatically** (D4). Two diffs that change the same part of the model, or depend
   on each other, get a warning on both. Applying an overlapping diff needs an explicit confirmation that the owners
   of both diffs agreed.

5. **Static builds include diffs** (D5). The docs show how to exclude diff files in the project configuration.
   A dedicated configuration option is added only on request.

6. **Public names** (D6): LSP requests `likec4/fetch-diffs`, `likec4/layout-compare-view`,
   `likec4/fetch-removal-impact`, `likec4/preview-model-edit`, `likec4/apply-model-edit`,
   `likec4/rollback-model-edit`; CLI commands `likec4 diff list | apply | discard` and `likec4 safe-delete`;
   MCP tools `list-diffs` and `removal-impact`; virtual module `likec4:diffs`; style tokens `likec4.diff.*`;
   SDK getters `modelDiffs`, `removalImpact`, `modelEdits`.

7. **Delivery in three PRs** (D7): DSL and model; edits and tooling; UI. Each PR has its docs and a `patch`
   changeset, and passes `pnpm typecheck` and `pnpm test` on its own.

## Consequences

- Projects without diffs are not affected: no change in model data, views or output.
- Three new keywords and a new top-level block must stay stable.
- Every consumer (language server, CLI, Vite plugin, UI) computes the to-be model and compare views with the same
  core functions.
- Stale diffs stay in the sources until someone applies or discards them; validation reports entries that no longer
  match the model.
- The reasons of a diff do not survive the apply: they go into the model (`description`) or the commit message.
