# @likec4/leanix-bridge

Bridge from the LikeC4 semantic model to LeanIX-shaped inventory artifacts. LikeC4 remains the canonical source of truth.

- **Dry-run**: identity manifest, LeanIX-shaped artifacts (fact sheets + relations), configurable mapping.
- **Sync plan** (optional): `planSyncToLeanix(dryRun, client)` queries LeanIX (read-only) and returns a plan artifact describing what would be created vs updated; use before live sync to review changes.
- **Live sync** (optional): `syncToLeanix(manifest, dryRun, client)` to create/update fact sheets and relations in the LeanIX API (auth, rate limiting, idempotency).
- **Draw.io ↔ LeanIX**: `manifestToDrawioLeanixMapping(manifest)` for round-trip mapping (likec4Id ↔ LeanIX fact sheet id) after sync.

## Scope

- **In scope**: identity manifest, dry-run, configurable mapping, **LeanIX API sync**, **Draw.io–LeanIX mapping**, **Phase 2 inbound** (inventory snapshot, reconciliation), **Phase 3** (impact analysis, drift detection, ADR generation, governance checks), tests.
- **Out of scope**: AI features, new top-level CLI namespaces.

## Usage

### First-class CLI (recommended)

From the project root:

```bash
# Generate bridge artifacts (manifest, leanix-dry-run.json, report) to out/bridge
likec4 gen leanix-dry-run -o out/bridge

# Sync workflow: write artifacts and optional sync-plan (read-only when LEANIX_API_TOKEN is set)
likec4 sync leanix --dry-run -o out/bridge

# Live sync to LeanIX (requires LEANIX_API_TOKEN)
likec4 sync leanix --apply -o out/bridge

# Phase 2 inbound: fetch LeanIX inventory (read-only), then reconcile with manifest
# Fetch LeanIX inventory snapshot (read-only) to out/bridge
likec4 gen leanix-inventory-snapshot -o out/bridge
# Run reconciliation between manifest and LeanIX inventory, output to out/bridge
likec4 gen leanix-reconcile -o out/bridge
```

Export Draw.io with LeanIX profile (includes bridge-managed metadata for round-trip sync):

```bash
likec4 export drawio --profile leanix -o ./diagrams
```

The `--profile leanix` flag selects the LeanIX export profile so vertices and edges carry likec4Id, likec4ViewId, likec4RelationId, and bridgeManaged attributes for sync and round-trip.

### Custom generator (alternative)

You can still wire the bridge in your LikeC4 config:

```ts
// likec4.config.ts
import { defineConfig } from '@likec4/config'
import {
  toBridgeManifest,
  toLeanixInventoryDryRun,
  toReport,
} from '@likec4/leanix-bridge'

export default defineConfig({
  name: 'my-project',
  generators: {
    'my-leanix': async ({ likec4model, ctx }) => {
      const manifest = toBridgeManifest(likec4model, { mappingProfile: 'default' })
      const dryRun = toLeanixInventoryDryRun(likec4model, { mappingProfile: 'default' })
      const report = toReport(manifest, dryRun)

      await ctx.write({ path: ['out', 'bridge', 'manifest.json'], content: JSON.stringify(manifest, null, 2) })
      await ctx.write({ path: ['out', 'bridge', 'leanix-dry-run.json'], content: JSON.stringify(dryRun, null, 2) })
      await ctx.write({ path: ['out', 'bridge', 'report.json'], content: JSON.stringify(report, null, 2) })

      // Phase 2 (programmatic): e.g. import { reconcile } from '@likec4/leanix-bridge', then
      // reconciliation = reconcile(manifest, snapshot) and ctx.write(..., JSON.stringify(reconciliation, null, 2))
    },
  },
})
```

Then run: `likec4 gen my-leanix`

### Optional: sync plan (review before sync)

Before pushing to LeanIX, you can produce a **sync plan** that queries LeanIX (read-only) to see what would be created vs updated:

```ts
import { LeanixApiClient, planSyncToLeanix } from '@likec4/leanix-bridge'

const client = new LeanixApiClient({
  apiToken: process.env.LEANIX_API_TOKEN!,
  baseUrl: 'https://app.leanix.net',
  requestDelayMs: 200,
})
const plan = await planSyncToLeanix(dryRun, client, { idempotent: true })
// plan.summary: { factSheetsToCreate, factSheetsToUpdate, relationsToCreate }
// plan.factSheetPlans: [{ likec4Id, name, type, action: 'create'|'update', existingFactSheetId? }]
// Write plan to out/bridge/sync-plan.json for review, then run sync
```

### Optional: sync to LeanIX API

After generating the dry-run artifacts (and optionally the sync plan), you can push them to LeanIX (requires an API token):

```ts
import { LeanixApiClient, syncToLeanix, manifestToDrawioLeanixMapping } from '@likec4/leanix-bridge'

const client = new LeanixApiClient({
  apiToken: process.env.LEANIX_API_TOKEN!,
  baseUrl: 'https://app.leanix.net',
  requestDelayMs: 200,
})
const result = await syncToLeanix(manifest, dryRun, client, { idempotent: true })
// result.manifest has external.leanix.factSheetId per entity
const mapping = manifestToDrawioLeanixMapping(result.manifest)
// Use mapping.likec4IdToLeanixId for Draw.io round-trip
```

## API

- **`toBridgeManifest(model, options?)`** – builds the identity manifest (canonical IDs + placeholder external IDs).
- **`toLeanixInventoryDryRun(model, options?)`** – builds LeanIX-shaped fact sheets and relations (no live IDs).
- **`toReport(manifest, leanixDryRun)`** – builds a summary report with counts and artifact names.
- **`LeanixApiClient(config)`** – GraphQL client with Bearer auth and rate limiting (`apiToken`, `baseUrl?`, `requestDelayMs?`).
- **`planSyncToLeanix(leanixDryRun, client, options?)`** – queries LeanIX (read-only) and returns a **sync plan** (`SyncPlan`): per–fact sheet and per-relation actions (`create` / `update`), summary counts, and any query errors. Use before `syncToLeanix` to review what would change. Options: `idempotent?`, `generatedAt?`.
- **`syncToLeanix(manifest, leanixDryRun, client, options?)`** – syncs dry-run to LeanIX API; returns updated manifest with `external.leanix.factSheetId` and relation IDs. Options: `idempotent?`, `likec4IdAttribute?`.
- **`manifestToDrawioLeanixMapping(manifest)`** – returns `{ likec4IdToLeanixId, relationKeyToLeanixRelationId }` for Draw.io bridge-managed export or re-import from LeanIX.

Mapping is configurable via `options.mapping` (kinds → fact sheet types, relation kinds → relation types). LeanIX GraphQL schema varies by workspace; fact sheet types and relation types are meta-model specific.

## Contracts

- **canonicalId**: LikeC4 FQN (e.g. `cloud.backend.api`).
- **viewId**: LikeC4 view id (e.g. `index`, `landscape.overview`).
- **relationId** + **compositeKey**: `sourceFqn|targetFqn|relationId` for stable relation identity.
- **manifestVersion**, **generatedAt**, **bridgeVersion**, **mappingProfile**: manifest metadata.

## References

- [ADR-001: LeanIX bridge dry-run slice](../../docs/architecture-intelligence/adr-001-leanix-bridge-dry-run.md)
- [Implementation brief](../../docs/architecture-intelligence/implementation-brief.md)
