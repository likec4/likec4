# @likec4/leanix-bridge

Bridge from the LikeC4 semantic model to LeanIX-shaped inventory artifacts. LikeC4 remains the canonical source of truth.

- **Dry-run**: identity manifest, LeanIX-shaped artifacts (fact sheets + relations), configurable mapping.
- **Live sync** (optional): `syncToLeanix(manifest, dryRun, client)` to create/update fact sheets and relations in the LeanIX API (auth, rate limiting, idempotency).
- **Draw.io ↔ LeanIX**: `manifestToDrawioLeanixMapping(manifest)` for round-trip mapping (likec4Id ↔ LeanIX fact sheet id) after sync.

## Scope

- **In scope**: identity manifest, dry-run, configurable mapping, **LeanIX API sync** (create/update fact sheets and relations), **Draw.io–LeanIX mapping** for round-trip, tests, usage via custom generator.
- **Out of scope**: AI features, new top-level CLI namespaces.

## Usage

Use from a **custom generator** in your LikeC4 project config:

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
    'leanix-dry-run': async ({ likec4model, ctx }) => {
      const manifest = toBridgeManifest(likec4model, { mappingProfile: 'default' })
      const dryRun = toLeanixInventoryDryRun(likec4model, { mappingProfile: 'default' })
      const report = toReport(manifest, dryRun)

      await ctx.write({ path: ['out', 'bridge', 'manifest.json'], content: JSON.stringify(manifest, null, 2) })
      await ctx.write({ path: ['out', 'bridge', 'leanix-dry-run.json'], content: JSON.stringify(dryRun, null, 2) })
      await ctx.write({ path: ['out', 'bridge', 'report.json'], content: JSON.stringify(report, null, 2) })
    },
  },
})
```

Then run:

```bash
likec4 gen leanix-dry-run
```

### Optional: sync to LeanIX API

After generating the dry-run artifacts, you can push them to LeanIX (requires an API token):

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
// Use mapping.likec4IdToLeanixFactSheetId for Draw.io round-trip
```

## API

- **`toBridgeManifest(model, options?)`** – builds the identity manifest (canonical IDs + placeholder external IDs).
- **`toLeanixInventoryDryRun(model, options?)`** – builds LeanIX-shaped fact sheets and relations (no live IDs).
- **`toReport(manifest, leanixDryRun)`** – builds a summary report with counts and artifact names.
- **`LeanixApiClient(config)`** – GraphQL client with Bearer auth and rate limiting (`apiToken`, `baseUrl?`, `requestDelayMs?`).
- **`syncToLeanix(manifest, leanixDryRun, client, options?)`** – syncs dry-run to LeanIX API; returns updated manifest with `external.leanix.factSheetId` and relation IDs. Options: `idempotent?`, `likec4IdAttribute?`.
- **`manifestToDrawioLeanixMapping(manifest)`** – returns `{ likec4IdToLeanixFactSheetId, relationKeyToLeanixRelationId }` for Draw.io bridge-managed export or re-import from LeanIX.

Mapping is configurable via `options.mapping` (kinds → fact sheet types, relation kinds → relation types). LeanIX GraphQL schema varies by workspace; fact sheet types and relation types are meta-model specific.

## Contracts

- **canonicalId**: LikeC4 FQN (e.g. `cloud.backend.api`).
- **viewId**: LikeC4 view id (e.g. `index`, `landscape.overview`).
- **relationId** + **compositeKey**: `sourceFqn|targetFqn|relationId` for stable relation identity.
- **manifestVersion**, **generatedAt**, **bridgeVersion**, **mappingProfile**: manifest metadata.

## References

- [ADR-001: LeanIX bridge dry-run slice](../../docs/architecture-intelligence/adr-001-leanix-bridge-dry-run.md)
- [Implementation brief](../../docs/architecture-intelligence/implementation-brief.md)
