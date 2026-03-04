---
"@likec4/generators": patch
---

Draw.io: infer shape person on re-import for round-trip fidelity

- **Import:** `inferKind()` now treats `shape=actor` as actor (alongside `umlactor` and `shape=person`). `inferShape()` returns `'person'` when the DrawIO cell style contains `shape=actor`, `shape=person`, or `umlactor`. Re-imported actor cells thus get `actor 'title'` and an explicit `style { shape person }` in the emitted .c4 source. Round-trip: export may emit person as `shape=actor` or `shape=umlActor`; import recognizes both via `inferKind()` and `inferShape()` so cells become actor with shape person.
