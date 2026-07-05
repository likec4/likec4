# Agent Instructions

- when your changes relate to views (types or model), update View-drifts detection/auto-applying (`src/manual-layout`) accordingly.
  - if you are not sure what leads to layout drifts or can be auto-applied, ask for confirmation.

## Builder

- `Builder` in `src/builder/` uses a phantom-type ledger (`Types`, `Types.AddFqn`, `Types.ToAux`) to track added FQNs / view ids / kinds at compile time. The reverse direction is `Types.FromAux<A>` (in `src/builder/_types.ts`).
- `Builder.fromParsed(data)` is the runtime → builder seeding entry. It is overloaded:
  - When `data: ParsedLikeC4ModelData<A>` carries a typed `Aux`, the returned builder preserves those types.
  - When `A` is `UnknownParsed`, the returned helpers are runtime-only (no compile-time autocomplete on existing kinds/FQNs).
- `Builder.build()` produces `ParsedLikeC4ModelData<Types.ToAux<T>>`; `Builder.toLikeC4Model()` additionally runs `computeLikeC4Model`.
