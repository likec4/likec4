---
"likec4": patch
---

Draw.io: CLI --roundtrip, Playground E2E, DrawioContextMenu getSourceContent

- **CLI:** `likec4 export drawio --roundtrip` reads all `.c4`/`.likec4` in the workspace, parses round-trip comment blocks (layout, stroke colors/widths, edge waypoints), and applies them when generating each view's `.drawio` file.
- **Docs:** CLI reference updated with `--roundtrip` and `--all-in-one` options.
- **Playground:** `DrawioContextMenu` component accepts optional `getSourceContent` for round-trip export when used outside the provider.
- **E2E:** New Playwright config and test for Draw.io context menu in the Playground (`pnpm test:playground` from e2e/).
