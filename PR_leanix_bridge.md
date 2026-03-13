# LeanIX bridge (dry-run) + Draw.io bridge-managed profile

## Summary

This PR adds a **dry-run** bridge from the LikeC4 model to LeanIX-shaped artifacts (no sync with the LeanIX API) and a **bridge-managed** Draw.io export profile for interoperability and identity round-trip.

- **Phase 1A**: Package `@likec4/leanix-bridge` with identity manifest, LeanIX-shaped dry-run, and configurable mapping.
- **Phase 1B**: Draw.io export profile `leanix` (bridge-managed metadata: `likec4Id`, `likec4RelationId`, etc.) and CLI `likec4 export drawio --profile leanix`.
- **Integrity extras**: Draw.io parser optionally reads `likec4Id` / `likec4RelationId` from cell styles; FQN assignment uses `likec4Id` when present (identity round-trip). E2E test (skipped in CI) for `export drawio --profile leanix`.

## Scope

| Area | Content |
|------|---------|
| **New package** | `packages/leanix-bridge`: contracts, mapping, `toBridgeManifest`, `toLeanixInventoryDryRun`, `toReport`, fixtures and tests (incl. boundary tests in `mapping.spec.ts`). |
| **Generators** | Draw.io: `DrawioExportProfile`, options `profile`, `projectId`, `leanixFactSheetTypeByKind`; bridge-managed styles on nodes and edges. |
| **CLI** | `likec4 export drawio --profile leanix` (and `--project` when using multiple projects). |
| **Draw.io parser** | Optional fields `likec4Id` (vertex) and `likec4RelationId` (edge); FQN assignment uses `likec4Id` when present. |
| **E2E** | Test (skipped in CI) for export drawio with `--profile leanix` validating presence of bridge-managed styles. |
| **Docs / repo** | leanix-bridge package README; `.gitignore` updated (`docs/architecture-intelligence/`; existing entries for PR_BODY*.md, etc.). |

## Main files

- `packages/leanix-bridge/` – new package (src, specs, README)
- `packages/generators/src/drawio/generate-drawio.ts` – leanix profile and bridge-managed styles
- `packages/generators/src/drawio/parse-drawio.ts` – reading `likec4Id` / `likec4RelationId` and FQN from `likec4Id`
- `packages/likec4/src/cli/export/drawio/handler.ts` – `--profile leanix` option
- `e2e/src/likec4-cli-export-drawio.spec.ts` – skipped test for `--profile leanix`
- `.changeset/leanix-bridge-and-drawio-profile.md` – changeset for release

## How to test

```bash
pnpm install
pnpm generate
pnpm build
pnpm typecheck
pnpm test
```

- Bridge tests: `pnpm test --packages/generators --packages/leanix-bridge` (or filter by `leanix-bridge`, `generate-drawio`, `parse-drawio`).
- Manual export: `likec4 export drawio <srcdir> -o out --profile leanix` and inspect `.drawio` (styles `bridgeManaged=true`, `likec4Id=...`, etc.).
- Import a .drawio exported with profile leanix: verify elements get the same FQN (identity round-trip when `likec4Id` is present).

## Breaking changes

None. Draw.io profile is opt-in (`--profile leanix`); parser accepts additional optional styles; new package is additive.

## References

- Changeset: `.changeset/leanix-bridge-and-drawio-profile.md`
- AGENTS.md (boundaries, priorities)
- Package README: `packages/leanix-bridge/README.md`
