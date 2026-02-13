---
"@likec4/generators": minor
"@likec4/docs-astro": patch
---

Draw.io integration: complete implementation plan (Phases 1.2, 1.3, 2.2, 4.5)

- **Import:** Emit layout as comment block `// <likec4.layout.drawio>` (view → nodes geometry) for round-trip/tooling. Emit vertex strokeColor as comment block `// <likec4.strokeColor.vertices>` (DSL has no element strokeColor). Parse and emit relationship `likec4Metadata` as `metadata { ... }` block. Parse Draw.io native style `link` and emit element `link 'url'` when no likec4Links.
- **Export:** Add `likec4StrokeColor` on vertex when element has stroke color; add `likec4Metadata` on edge when relationship has metadata.
- **Docs:** Draw.io integration page updated with comment blocks, metadata, native link, and round-trip summary.
