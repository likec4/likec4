---
"@likec4/generators": patch
---

Draw.io: infer shape person on re-import for round-trip fidelity

- **Import:** `inferShape()` now returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get an explicit `style { shape person }` in the emitted .c4 source, making the round-trip symmetric with export (person → shape=actor; shape=actor → actor with shape person).
