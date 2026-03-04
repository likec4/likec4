---
"@likec4/generators": patch
---

Draw.io: infer shape person on re-import for round-trip fidelity

- **Import:** `inferKind()` now treats `shape=actor` as actor (alongside `umlactor` and `shape=person`). `inferShape()` returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get `actor 'title'` and an explicit `style { shape person }` in the emitted .c4 source, making the round-trip symmetric with export (person → shape=actor; shape=actor → actor with shape person).
