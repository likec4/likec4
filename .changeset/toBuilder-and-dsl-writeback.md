---
'likec4': minor
'@likec4/core': minor
'@likec4/language-services': minor
---

Add programmatic enrichment + DSL writeback for loaded workspaces (resolves #2833).

- `Builder.fromParsed(data, mode?)` — seed a `Builder` from an existing `ParsedLikeC4ModelData`. The returned builder is `Builder<AnyTypes>` (kinds/FQNs unknown at compile time); pass an explicit generic to opt back into a typed Builder. `mode` (`'strict'` | `'editable'`, default `'strict'`) controls duplicate handling: in `editable` mode re-declaring an existing FQN with the same kind edits it in place.
- `LikeC4.parsedModel(project?)` — exposes the parsed model on the public `LikeC4` instance.
- `LikeC4.toBuilder(mode?, project?)` — returns a Builder seeded from the parsed workspace; chain `.model(...)` / `.deployment(...)` / `.views(...)` to extend it. Defaults to `editable` (re-declaring a loaded element edits it); pass `'strict'` for a builder where duplicate FQNs throw.
- `LikeC4.toTypedBuilder({ specification, mode?, project? })` — validates the given specification against the loaded model (subset semantics — every declared kind/tag/metadata key must exist) and returns a Builder typed by it (`Builder<Types.FromSpecification<Spec>>`), replacing the unchecked `as unknown as Builder<...>` cast. Backed by the new `assertSpecificationCompatible` helper exported from `@likec4/core/builder`.
- `LikeC4.toDSL(project?)` — renders the parsed model back to `.c4` DSL source via `@likec4/generators/likec4`.
- `writeDSL(likec4, targetDir, options?)` — Node-only helper exported from `likec4` (and `@likec4/language-services/node`) that writes the rendered DSL to disk.

The DSL round-trip is intentionally LOSSY: comments, source positions and original formatting are not preserved.
