# PR: LeanIX Bridge — Draw.io bridge-managed export + bridge package

**Copy this into the GitHub PR description** so upstream maintainers understand what this adds and how it fits the strategy.

---

## Overview and intention

**Goal:** Enable **LeanIX interoperability** (inventory sync and diagram round-trip) while keeping **LikeC4 as the single source of truth** and **Draw.io as a visual interchange format**, not as the source of truth.

**Strategy from the start (ADR):**

- **LikeC4** = canonical semantic model (`.c4` files, typed elements, views). Nothing here changes that.
- **Draw.io** = adapter for visual interchange. We add an optional export *profile* so diagrams can carry **bridge-managed metadata** (LikeC4 IDs, view IDs, relation IDs) that LeanIX and other tools can use. Draw.io is never the editing source of truth.
- **LeanIX** = separate adapter. A new **bridge package** (`@likec4/leanix-bridge`) produces identity manifests, LeanIX-shaped dry-run artifacts, an optional **sync plan** (what would be created/updated), and optional **live sync** to the LeanIX API. All LeanIX-specific behaviour stays outside `@likec4/core`.

**Differential:**

- **Semantic-first:** Architecture stays in LikeC4 DSL; Draw.io and LeanIX are outputs/adapters.
- **No lock-in:** Default Draw.io export is unchanged; LeanIX is opt-in via custom generators.
- **Review before sync:** Dry-run artifacts + **sync plan** (`planSyncToLeanix`) let you see what would change in LeanIX before calling the API.
- **Round-trip ready:** After sync, a mapping links LikeC4 IDs to LeanIX IDs so diagrams and tooling can stay in sync.

**How to use (high level):** Define a custom generator that (1) exports views to Draw.io with `profile: 'leanix'`, (2) builds manifest + dry-run (+ optionally sync plan), and (3) optionally runs live sync. No new top-level CLI; everything is generator-driven. See `packages/leanix-bridge/README.md` for a full example.

---

## Summary (technical)

This PR has two main parts:

1. **DrawIO export profile `leanix`** in `@likec4/generators`: when exporting to Draw.io, callers can pass `profile: 'leanix'` so that vertices, edges, and the diagram root get **bridge-managed metadata** (e.g. `likec4Id`, `likec4Kind`, `likec4ViewId`, `likec4ProjectId`, `likec4RelationId`, `bridgeManaged`, and optionally `leanixFactSheetType`). That metadata allows round-trip and mapping to LeanIX fact sheets/relations after a sync.

2. **New package `@likec4/leanix-bridge`**: builds an identity manifest, LeanIX-shaped dry-run artifacts (fact sheets + relations), a **sync plan** (read-only query to LeanIX to see create vs update), optional **live sync** to the LeanIX API, and a **Draw.io ↔ LeanIX mapping** so that after sync you know which LeanIX fact sheet / relation corresponds to which LikeC4 element (for round-trip or tooling).

LikeC4 stays the **single source of truth**. Draw.io is only an interchange format; LeanIX is a separate adapter.

---

## What already existed (unchanged)

- **Draw.io export and import** in `@likec4/generators`: export of views to Draw.io XML and import from Draw.io back to LikeC4 source. No change to default behaviour.
- **Custom generators** in `@likec4/config` and the CLI: projects can define custom generators (e.g. `likec4 gen my-gen`).

---

## What's new

### 1. DrawIO export options (`@likec4/generators`)

- **`profile: 'leanix'`** — Adds bridge-managed style attributes on vertices, edges, and root cell:
  - `bridgeManaged=true`
  - `likec4Id`, `likec4Kind`, `likec4ViewId`, `likec4ProjectId` (on vertices/root)
  - `likec4RelationId`, `bridgeManaged` (on edges)
  - Optional **`leanixFactSheetTypeByKind`** so vertices get `leanixFactSheetType=<value>` by element kind.

- **How to use:** When exporting (e.g. from CLI or custom generator), pass:

  `generateDrawio(viewmodel, { compressed: false, profile: 'leanix', projectId: 'my-project', leanixFactSheetTypeByKind: { system: 'Application', component: 'ITComponent' } })`

  Default export (no `profile` or `profile: 'default'`) is unchanged and does not add these attributes.

### 2. Package `@likec4/leanix-bridge`

- **Identity manifest:** `toBridgeManifest(model, options)` — canonical IDs (e.g. FQN, viewId, relationId) and placeholders for external IDs.
- **LeanIX dry-run:** `toLeanixInventoryDryRun(model, options)` — LeanIX-shaped fact sheets and relations (no API calls).
- **Report:** `toReport(manifest, dryRun)` — summary of manifest and dry-run.
- **Sync plan (Phase 2):** `planSyncToLeanix(dryRun, client, options)` — queries LeanIX **read-only** and returns a `SyncPlan` artifact: per–fact sheet and per-relation actions (create vs update), summary counts. Use before live sync to review what would change.
- **Optional live sync:** `LeanixApiClient` + `syncToLeanix(manifest, dryRun, client, options)` — creates/updates fact sheets and relations in LeanIX; returns manifest with `external.leanix.factSheetId` etc.
- **Draw.io ↔ LeanIX mapping:** `manifestToDrawioLeanixMapping(manifest)` — after sync, returns `likec4IdToLeanixFactSheetId` and `relationKeyToLeanixRelationId` for use in Draw.io round-trip or tooling.

Usage is via a **custom generator** (see `packages/leanix-bridge/README.md`): e.g. `likec4 gen leanix-dry-run` writes manifest + dry-run + report to `out/bridge/`. Optionally run `planSyncToLeanix` to produce a sync plan, then call `syncToLeanix` from that generator or from a separate script; sync is not a default CLI command.

### Phase 2 implementation (complete)

- **Dry-run sync planning:** Implemented via `planSyncToLeanix`. Produces a dedicated artifact (e.g. `sync-plan.json`) describing what would be created vs updated in LeanIX, using read-only API queries (find by name+type). No writes until you call `syncToLeanix`.
- **Optional live sync behind explicit flags:** Implemented via `syncToLeanix(manifest, dryRun, client, options)`; used from custom generator or script only. Idempotent by default (find existing fact sheets by name+type before creating).

---

## How this is used with LeanIX (end-to-end)

1. **LikeC4** = source of truth (`.c4` model and views).
2. **Export to Draw.io** with `profile: 'leanix'` so the diagram carries `likec4Id`, `likec4RelationId`, etc., in cell styles.
3. **Generate bridge manifest and LeanIX dry-run** via custom generator (`toBridgeManifest`, `toLeanixInventoryDryRun`).
4. **(Optional)** **Sync plan:** Call `planSyncToLeanix(dryRun, client)` to get a plan (create/update counts and per-item actions); review before syncing.
5. **(Optional)** **Sync to LeanIX** with `syncToLeanix(...)` so fact sheets and relations exist in LeanIX; manifest is updated with LeanIX IDs.
6. **Mapping** from `manifestToDrawioLeanixMapping(manifest)` links LikeC4 IDs to LeanIX IDs for round-trip or integration (e.g. re-import from LeanIX or other tools).

Draw.io is never the source of truth; it is an interchange format that can carry bridge metadata for LeanIX interoperability.

---

## Strategy (for maintainers)

- **Core:** LikeC4 model and existing Draw.io export/import stay unchanged by default. No LeanIX-specific types or behaviour in `@likec4/core`.
- **Generators:** Only an extra **option** on existing Draw.io export (`profile: 'leanix'` + optional `projectId`, `leanixFactSheetTypeByKind`). Default remains round-trip only.
- **Bridge:** All LeanIX-specific logic (manifest, dry-run, sync plan, sync, mapping) lives in `@likec4/leanix-bridge`. Adoption is opt-in via custom generators and export options.

This keeps the core clean and allows enterprises to plug in LeanIX without forcing upstream to own LeanIX semantics.

---

## Tests and CI

- **DrawIO:** Tests in `packages/generators/src/drawio/` cover default export and the `leanix` profile (bridge-managed metadata on vertices, edges, root; optional `leanixFactSheetType`; actor export/round-trip).
- **LeanIX bridge:** Tests in `packages/leanix-bridge` cover manifest, dry-run, **sync plan** (`planSyncToLeanix`), and mapping.
- **Lockfile:** `pnpm-lock.yaml` was updated to fix the missing `obuild` entry that caused CI failure.

---

## Docs and ADR (local/fork)

- **ADR:** `docs/adrs/ADR-ai-first-architecture-bridge.md` describes the bridge strategy (LikeC4 canonical, Draw.io adapter, LeanIX adapter, bridge package first).
- **Roadmap (local):** `docs/LEANIX-BRIDGE-ROADMAP-LOCAL.md` tracks what is implemented vs ADR phases (Phase 1 and Phase 2 complete); for internal/fork use only.
