# LeanIX API sync + Draw.io round-trip + E2E export drawio

## Summary

This PR adds **sync with the LeanIX API**, **Draw.io ↔ LeanIX round-trip** mapping, and **re-enables E2E** tests for `likec4 export drawio` (and `--profile leanix`).

## Changes

### 1. Sync with LeanIX API

- **`LeanixApiClient`** (`packages/leanix-bridge/src/leanix-api-client.ts`): GraphQL client with Bearer token auth and configurable rate limiting (`requestDelayMs`). Calls `POST {baseUrl}/services/pathfinder/v1/graphql`.
- **`syncToLeanix(manifest, leanixDryRun, client, options?)`** (`packages/leanix-bridge/src/sync-to-leanix.ts`):
  - **Idempotency**: optional lookup by name+type (`allFactSheets` filter); if found, skip create and count as updated.
  - **Create fact sheets**: `createFactSheet` with optional patches (description, custom attribute for likec4Id).
  - **Create relations**: `createRelation(source, target, type)` (schema varies by workspace).
  - Returns **updated manifest** with `external.leanix.factSheetId` and `relationId` filled, plus counts and errors.
- **Options**: `idempotent?`, `likec4IdAttribute?` (custom LeanIX attribute key for likec4Id).

### 2. Draw.io ↔ LeanIX round-trip

- **`manifestToDrawioLeanixMapping(manifest)`** (`packages/leanix-bridge/src/drawio-leanix-roundtrip.ts`): Builds `{ likec4IdToLeanixFactSheetId, relationKeyToLeanixRelationId }` from a manifest that has been synced to LeanIX. Use for re-exporting Draw.io with LeanIX IDs or for import-from-LeanIX flows.

### 3. E2E: export drawio tests re-enabled

- **`e2e/src/likec4-cli-export-drawio.spec.ts`**: Removed `test.skip` from both export drawio tests. Fixed workspace resolution by running the CLI with **`cwd` set to the project root** (`src/likec4`): `likec4 export drawio . -o <outDirAbs> --project e2e` with `.cwd(projectRoot)`. Output dir is absolute so it works when cwd is the project dir. This allows CI (and local) to find likec4.config and .c4 sources.

## How to test

- **Unit**: `pnpm test` in `packages/leanix-bridge` (existing tests; sync is integration-style and can be tested with a mocked client in a follow-up if needed).
- **E2E**: From repo root, `pnpm pretest:e2e` then `cd e2e && pnpm typecheck` to run the Vitest CLI tests (including export drawio and export drawio --profile leanix).

## Breaking changes

None. New exports are additive; E2E tests are re-enabled (no longer skipped).

## References

- Changeset: `.changeset/leanix-sync-drawio-e2e.md`
- README: `packages/leanix-bridge/README.md` (updated with sync and round-trip API)
