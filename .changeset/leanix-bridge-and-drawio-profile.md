---
"@likec4/leanix-bridge": minor
"@likec4/generators": patch
"@likec4/likec4": patch
---

LeanIX bridge (dry-run) and Draw.io bridge-managed export profile

**@likec4/leanix-bridge (new package)**
- Identity manifest and LeanIX-shaped dry-run artifacts (no live sync)
- Pure functions: `toBridgeManifest`, `toLeanixInventoryDryRun`, `toReport`
- Configurable mapping (kinds → fact sheet types, relation kinds → relation types)
- Outputs: manifest.json, leanix-dry-run.json, report.json
- Use via custom generator; see package README

**@likec4/generators**
- Draw.io export profile `leanix`: adds bridge-managed metadata (bridgeManaged, likec4Id, likec4Kind, likec4ViewId, likec4ProjectId, likec4RelationId, optional leanixFactSheetType) for round-trip and LeanIX interoperability
- New options: `profile`, `projectId`, `leanixFactSheetTypeByKind`
- Export type `DrawioExportProfile`

**@likec4/likec4**
- CLI: `likec4 export drawio --profile leanix` to emit bridge-managed .drawio files
