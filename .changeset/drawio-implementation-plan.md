---
"@likec4/generators": minor
"@likec4/docs-astro": patch
---

Draw.io integration — export-only (this PR). Implementation plan phases 1.2, 1.3, 2.2, 4.5.

- **Export:** Add `likec4StrokeColor` on vertex when element has stroke color; add `likec4Metadata` on edge when relationship has metadata. Round-trip comment parsing for layout/stroke/waypoints (re-export from Playground/CLI).
- **Docs:** Draw.io integration page updated for export (comment blocks, round-trip summary). Import (e.g. `// <likec4.layout.drawio>`, `// <likec4.strokeColor.vertices>`, `likec4Metadata`, native `link` parsing) planned in a follow-up PR.
