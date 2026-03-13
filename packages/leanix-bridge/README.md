# @likec4/leanix-bridge

Bridge from the LikeC4 semantic model to LeanIX-shaped inventory artifacts. **Dry-run only**; no live LeanIX API sync. LikeC4 remains the canonical source of truth.

## Scope

- **In scope**: identity manifest, LeanIX-shaped dry-run (fact sheets + relations), configurable mapping, tests, usage via custom generator.
- **Out of scope**: live LeanIX transport, Draw.io LeanIX profile, AI features, new top-level CLI namespaces.

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

## API

- **`toBridgeManifest(model, options?)`** – builds the identity manifest (canonical IDs + placeholder external IDs).
- **`toLeanixInventoryDryRun(model, options?)`** – builds LeanIX-shaped fact sheets and relations (no live IDs).
- **`toReport(manifest, leanixDryRun)`** – builds a summary report with counts and artifact names.

Mapping is configurable via `options.mapping` (kinds → fact sheet types, relation kinds → relation types). See [docs/architecture-intelligence/mapping-likec4-drawio-leanix.md](../../docs/architecture-intelligence/mapping-likec4-drawio-leanix.md).

## Contracts

- **canonicalId**: LikeC4 FQN (e.g. `cloud.backend.api`).
- **viewId**: LikeC4 view id (e.g. `index`, `landscape.overview`).
- **relationId** + **compositeKey**: `sourceFqn|targetFqn|relationId` for stable relation identity.
- **manifestVersion**, **generatedAt**, **bridgeVersion**, **mappingProfile**: manifest metadata.

## References

- [ADR-001: LeanIX bridge dry-run slice](../../docs/architecture-intelligence/adr-001-leanix-bridge-dry-run.md)
- [Implementation brief](../../docs/architecture-intelligence/implementation-brief.md)
