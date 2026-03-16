---
"@likec4/docs-astro": patch
"@likec4/generators": minor
"@likec4/leanix-bridge": minor
"likec4": minor
---

feat(leanix-bridge): Phase 2 & 3, CLI, tooling docs (Draw.io + CLI)

**@likec4/leanix-bridge**
- Phase 2: `leanixInventorySnapshot`, `reconcile` (inbound)
- Phase 3: `buildDriftReport`, `buildImpactReport`, `generateAdrReport`, `runGovernanceChecks`
- Refactors: sync-to-leanix, to-bridge-manifest, to-leanix-inventory-dry-run, report, leanix-api-client, drawio-leanix-roundtrip

**likec4 (CLI)**
- `gen leanix-inventory-snapshot`, `gen leanix-reconcile`; `sync leanix` (dry-run / apply)
- Shared LeanIX API client for snapshot and sync

**@likec4/docs-astro**
- Draw.io: Export profiles (default / leanix), bridge-managed metadata
- CLI: `--profile` option for Export to DrawIO

**@likec4/generators**
- Parse Draw.io: compatibility with bridge-managed metadata
