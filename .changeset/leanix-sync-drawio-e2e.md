---
"@likec4/leanix-bridge": minor
---

LeanIX API sync, Draw.io–LeanIX round-trip, E2E export drawio re-enabled

**@likec4/leanix-bridge**
- **Sync with LeanIX API**: `LeanixApiClient` (Bearer auth, rate limiting), `syncToLeanix(manifest, dryRun, client, options?)` to create/update fact sheets and relations; idempotent by name+type or optional custom attribute for likec4Id.
- **Draw.io ↔ LeanIX**: `manifestToDrawioLeanixMapping(manifest)` for round-trip mapping (likec4Id → LeanIX fact sheet id, relation keys → LeanIX relation id) after sync.

**E2E**
- Re-enabled `likec4 export drawio` and `likec4 export drawio --profile leanix` tests: run CLI with `cwd` set to project root so workspace resolution finds likec4.config and .c4 sources in CI and locally.
