# LeanIX Bridge — Roadmap (local / fork-only)

**Purpose:** Track what is implemented vs what the ADR (AI-first Architecture Bridge) defines. For internal use; upstream does not need to implement or review this checklist.

**Reference:** [ADR-ai-first-architecture-bridge.md](adrs/ADR-ai-first-architecture-bridge.md)

---

## Strategy (from ADR)

- **LikeC4** = canonical source of truth.
- **Draw.io** = visual interchange format (adapter only, never source of truth).
- **LeanIX** = separate adapter (inventory sync + diagram interoperability).
- **Bridge package** first; LeanIX-specific behaviour stays outside `@likec4/core`.

---

## Phase 1 (ADR)

| Item | Status | Notes |
|------|--------|------|
| Bridge package | ✅ Done | `packages/leanix-bridge` |
| Identity manifest | ✅ Done | `toBridgeManifest()`, `BridgeManifest` |
| Draw.io profile metadata | ✅ Done | `generateDrawio(..., { profile: 'leanix', projectId?, leanixFactSheetTypeByKind? })` adds `bridgeManaged`, `likec4Id`, `likec4Kind`, `likec4ViewId`, `likec4ProjectId`, `likec4RelationId` (and optional `leanixFactSheetType`) to vertices/edges/root |
| LeanIX dry-run artifact generation | ✅ Done | `toLeanixInventoryDryRun()`, `toReport()` |

---

## Phase 2 (ADR)

| Item | Status | Notes |
|------|--------|------|
| Dry-run sync planning | ✅ Done | `planSyncToLeanix(dryRun, client, options)` queries LeanIX (read-only) and returns a `SyncPlan` artifact: per-fact sheet / per-relation actions (create vs update), summary counts; use before sync to review |
| Optional live sync behind explicit flags | ✅ Done | `syncToLeanix(manifest, dryRun, client, options)` in `@likec4/leanix-bridge`; used from custom generator or script, not from default CLI |

---

## Phase 3 (ADR)

| Item | Status | Notes |
|------|--------|------|
| Impact analysis | ❌ Not started | |
| Drift detection | ❌ Not started | |
| ADR generation | ❌ Not started | |
| Governance checks | ❌ Not started | |

---

## What's missing for "complete" LeanIX flow (local view)

1. **Documentation for upstream:** PR description and/or docs that explain clearly: what is the LeanIX profile for DrawIO, how is it used with LeanIX, and how it fits the bridge strategy. → Use [PR-LEANIX-BRIDGE-DESCRIPTION.md](PR-LEANIX-BRIDGE-DESCRIPTION.md) for the PR.
2. **Phase 3:** Impact analysis, drift detection, ADR generation, governance — all still out of scope for this PR.

---

## Where things live

- **DrawIO export with LeanIX metadata:** `@likec4/generators` — `generateDrawio(..., { profile: 'leanix', ... })`.
- **Bridge manifest, dry-run, sync plan, sync, DrawIO–LeanIX mapping:** `@likec4/leanix-bridge` — see `packages/leanix-bridge/README.md`.
- **Usage:** Custom generator in `likec4.config.ts` that calls `toBridgeManifest`, `toLeanixInventoryDryRun`, and optionally `planSyncToLeanix`, exports DrawIO with `profile: 'leanix'`, and/or calls `syncToLeanix` + `manifestToDrawioLeanixMapping`.
