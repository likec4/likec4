# Project Working Rules

## Architecture constraints
- LikeC4 is the canonical semantic source of truth.
- Draw.io is a visual interoperability layer, never the source of truth.
- LeanIX diagram interoperability and LeanIX inventory sync are separate concerns.
- AI features must operate on the semantic graph and typed model, not on raw Draw.io XML.

## Implementation boundaries
- Do not move LeanIX-specific logic into @likec4/core.
- Prefer additive changes over rewrites.
- Prefer a focused package `packages/leanix-bridge` over broad abstractions.
- Prefer pure functions and tested modules.
- Prefer existing custom generator infrastructure before adding new top-level CLI commands.

## Current implementation priority
- First implement inventory dry-run artifacts and identity manifest.
- Do not implement live LeanIX sync yet.
- Do not implement AI commands yet.
- Do not implement generic Draw.io import promises yet.

## Delivery expectations
- Inspect the repository before editing.
- Reuse existing model-loading and generator APIs where possible.
- Add tests for all new bridge behavior.
- Summarize changed files, commands run, tests run, and assumptions made.
