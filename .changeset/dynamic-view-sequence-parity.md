---
'@likec4/language-server': minor
'@likec4/core': minor
'@likec4/layouts': minor
'@likec4/diagram': minor
'@likec4/generators': minor
---

feat(dynamic-view): control-flow blocks + Mermaid sequenceDiagram export

Adds LikeC4-flavored sequence-diagram constructs to `dynamic view` for full Mermaid parity:

- Conditional branching: `if cond { … } else if cond { … } else { … }`
- Optional blocks: `optional cond { … }`
- Loops with label: `repeat label { … }`
- Multi-branch parallel: `parallel { branch 'a' { … } branch 'b' { … } }` (backward-compatible with legacy flat form)
- Grouping: `group 'label' { … }`
- Critical path with fallbacks: `critical 'label' { … } on 'fallback' { … }*`
- Break on condition: `break cond { … }`
- Standalone notes: `note over A, B 'text'` / `note left of A 'text'` / `note right of A 'text'`
- Activation tracking: `activate A` / `deactivate A`
- Participant lifecycle: `create A` / `destroy A`
- View property: `autonumber` / `autonumber from N step M`

New Mermaid `sequenceDiagram` exporter routes `dynamic view` with `variant: 'sequence'` through these constructs. All blocks nest arbitrarily and linearize to Mermaid keywords. Backward-compatible — existing `parallel { stepA stepB }` and step chains unchanged.
