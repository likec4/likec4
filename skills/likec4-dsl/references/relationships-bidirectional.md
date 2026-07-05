# Bidirectional vs. Unidirectional Relationships

## Key distinction: model relationships vs. view predicates

The `<->` operator is **only** a relationship-inclusion predicate used inside views.
It is **not** valid in the `model { ... }` block — relationships are always declared
with the directed `->` operator. Writing `frontend <-> backend` in the model throws a
parsing error.

To represent a bidirectional/mutual interaction in the model, declare two directed
relationships.

### Declaring relationships in the model (`->` only)

```likec4
model {
  frontend -> backend
  backend -> database
}
```

**Use `->` when:**

- One element sends a request or message to another _without_ an explicit return path.
- Example: frontend **calls** API (backend responds, but the call is primarily one-way from frontend's perspective).
- Example: worker **processes** job from queue (job flows in one direction).
- Example: service **publishes** event to event bus (unidirectional publish).

### Modeling a bidirectional/mutual interaction

There is no `<->` operator in the model. Declare two directed relationships when both
elements actively drive the interaction:

```likec4
model {
  frontend -> backend "request"
  backend -> frontend "response"

  microservice1 -> microservice2 "RPC sync"
  microservice2 -> microservice1 "RPC sync"
}
```

**Use two relationships when:**

- Both elements actively communicate with each other _in both directions_ as part of the same logical interaction.
- Example: service A and service B (service A calls B _and_ B calls A, not just a request-response pair).
- Example: two databases synchronized (bidirectional replication).

> Rendering note: by default LikeC4 merges two opposite relationships between the same
> two elements into a single **bidirectional edge**. Set `multiple true` (in the
> specification for a relationship kind, or per-view with `with { multiple true }`) to
> render each direction as its own edge with its own label.

### When a request-response is one-way

In most REST APIs, even though the server responds, we still model it as a single `->` because:

```likec4
frontend -> api "REST call"
```

The **relationship itself** is directional: frontend initiates. The response is implicit in the interaction model.

**Exception:** If the system model emphasizes that _both elements drive interaction_, declare two relationships as shown above.

## Relationship predicates in views (`->` and `<->`)

Inside views, `<->` _is_ a valid operator — the **"Any relationship"** predicate. It is
**binary** (between two element sets) and matches relationships between the two sides in
either direction. Because both endpoints are known, this predicate is also customizable
(e.g. `cloud.* <-> amazon.* with { color red }`), unlike an open-ended `cloud.* ->`:

```likec4
views {
  view backend-detail of cloud.backend {
    include *
    include -> cloud.backend         // incoming: relationships pointing TO the scope
    include cloud.backend ->         // outgoing: relationships FROM the scope
    include -> cloud.backend ->      // both incoming and outgoing of the scope
    include cloud.backend <-> cloud.frontend  // relationships between the two, either direction
  }
}
```

- `-> X` — _inbound_ relationships from outside pointing into `X`.
- `X ->` — _outbound_ relationships from `X` pointing out.
- `-> X ->` — _both_ inbound and outbound relationships of `X`.
- `A <-> B` — "Any relationship": relationships between `A` and `B` in **either** direction.

> Note: there is no prefix `<-> X` predicate. To capture both directions of a single
> scope, use `-> X ->`. The `<->` operator is always binary (`A <-> B`).

## Summary

| Syntax              | Where          | Meaning                                                   |
| ------------------- | -------------- | --------------------------------------------------------- |
| `A -> B`            | model          | Directed relationship: A initiates/calls/sends to B       |
| `A -> B` + `B -> A` | model          | Mutual interaction modeled as two directed relationships  |
| `A <-> B`           | model          | ⛔️ Invalid — parsing error; `<->` is not a model operator |
| `-> X` (in view)    | view predicate | Inbound: relationships pointing to X                      |
| `X ->` (in view)    | view predicate | Outbound: relationships from X                            |
| `-> X ->` (in view) | view predicate | Both inbound and outbound relationships of X              |
| `A <-> B` (in view) | view predicate | Relationships between A and B in either direction         |

**When in doubt:** use `->` in the model for request-response patterns (REST, async jobs, events) and model mutual interactions as two directed relationships. Use `<->` only as a binary `A <-> B` predicate inside views.
