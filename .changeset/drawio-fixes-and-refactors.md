---
"@likec4/generators": patch
"@likec4/log": patch
---

Draw.io export/import: fixes and robustness

- **Import:** Correctly detect self-closing `<mxCell />` tags; pass UserObject inner XML to preserve `<data>` at UserObject level; decompress errors report which step failed (base64/inflate/URI decode); layout round-trip block supports multi-line JSON; waypoints key includes edge id for parallel edges; container title cell is a child of the container so it moves with it in Draw.io.
- **Export:** Waypoints lookup uses composite key (source|target|edgeId) so parallel edges keep distinct waypoints; generateDrawioMulti no longer regex-parses XML (uses internal generateDiagramContent + wrapInMxFile).
- **Log:** Safer error stringification in formatters (extracted safeStringify helper).
