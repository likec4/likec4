---
'@likec4/core': patch
'@likec4/config': patch
'@likec4/language-server': patch
---

Automatically derive element technology from icon name when not set explicitly.
Elements with `aws:`, `azure:`, `gcp:`, or `tech:` icons will get a human-readable technology label
(e.g. `tech:apache-flink` → "Apache Flink"). Can be disabled via `inferTechnologyFromIcon: false` in project config.
