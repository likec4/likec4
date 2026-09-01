---
'@likec4/generators': patch
---

Fix generated output using CRLF line endings on Windows. Markdown, Mermaid, D2, PlantUML and LikeC4 DSL exports now always emit LF, so generated files are byte-identical across platforms.
