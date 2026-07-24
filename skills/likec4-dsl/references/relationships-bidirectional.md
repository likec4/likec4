# Bidirectional vs. Unidirectional Relationships

## Key distinction: model relationships vs. view predicates

LikeC4 supports `<->` in two places with related but different meanings:

- In `model { ... }`, `<->` declares one semantic bidirectional relationship.
- In `views { ... }`, `A <-> B` is a binary predicate that includes relationships between two element sets in either direction.

## Declaring relationships in the model

The short snippets in this reference are fragments unless they include their own element declarations. Declare the
referenced elements in your model before using them.

Use `->` when one element initiates the relationship:

```likec4
model {
  frontend -> api "REST call"
}
```

Use `<->` when both elements actively communicate as one mutual interaction:

```likec4
model {
  frontend <-> backend "synchronizes"
}
```

Bidirectional model relationships render with arrows at both ends by default. Style can still override the rendered arrow tail, but the relationship remains semantically bidirectional for view predicates such as `include -> frontend`.

## Kinded bidirectional relationships

Use `-[kind]->` for a directed kinded relationship and `-[kind]<->` for a bidirectional kinded relationship:

```likec4
specification {
  element component
  relationship sync
  relationship async
}

model {
  component frontend
  component backend

  frontend -[async]-> backend "publishes events"
  frontend -[sync]<-> backend "replicates state"
}
```

The relationship kind participates in extension matching. When extending a kinded relationship, include the kind in `extend`; also include the title whenever the relationship is titled.

## Extending bidirectional relationships

Bidirectional relationship extensions are matched by source, target, kind, title, and bidirectionality. Endpoint order is normalized for bidirectional relationships, so these match the same relationship:

```likec4
model {
  frontend <-> backend "sync"

  extend backend <-> frontend "sync" {
    metadata {
      protocol "websocket"
    }
  }
}
```

Directed and bidirectional matchers are not interchangeable:

```likec4
model {
  frontend -> backend "calls"
  frontend <-> backend "sync"

  // Matches only the directed relationship.
  extend frontend -> backend "calls" { metadata { protocol "https" } }

  // Matches only the bidirectional relationship.
  extend frontend <-> backend "sync" { metadata { protocol "websocket" } }
}
```

## When to use one bidirectional relation vs. two directed relations

Use one `<->` relationship when the model has one mutual interaction:

```likec4
model {
  primaryDb <-> replicaDb "replicates"
}
```

Use two directed relationships when each direction has separate meaning, labels, technology, or lifecycle:

```likec4
model {
  frontend -> backend "request"
  backend -> frontend "callback"
}
```

By default LikeC4 may merge opposite relationships into one bidirectional-looking edge. Set `multiple true` in the relationship kind or view style when each direction must render as a separate edge.

## Relationship predicates in views

Inside views, `<->` is the "any relationship between both sides" predicate. It is binary and matches relationships between the two sides in either direction:

```likec4
views {
  view backend-detail of backend {
    include *
    include -> backend
    include backend ->
    include -> backend ->
    include backend <-> frontend
  }
}
```

- `-> X` includes incoming relationships to `X`; semantic bidirectional relationships involving `X` are also included.
- `X ->` includes outgoing relationships from `X`.
- `-> X ->` includes both incoming and outgoing relationships of `X`.
- `A <-> B` includes relationships between `A` and `B` in either direction.

There is no prefix `<-> X` predicate. Use `-> X ->` when you need both incoming and outgoing relationships around one scope.

## Summary

| Syntax              | Where          | Meaning                                                     |
| ------------------- | -------------- | ----------------------------------------------------------- |
| `A -> B`            | model          | Directed relationship: A initiates/calls/sends to B         |
| `A <-> B`           | model          | One bidirectional relationship between A and B              |
| `A -[kind]-> B`     | model          | Directed relationship with relationship kind                |
| `A -[kind]<-> B`    | model          | Bidirectional relationship with relationship kind           |
| `A -> B` + `B -> A` | model          | Two separate directed relationships                         |
| `-> X`              | view predicate | Incoming relationships to X, plus bidirectional involving X |
| `X ->`              | view predicate | Outgoing relationships from X                               |
| `-> X ->`           | view predicate | Both incoming and outgoing relationships of X               |
| `A <-> B`           | view predicate | Relationships between A and B in either direction           |

When in doubt, use `->` for request-response patterns where one side initiates. Use `<->` for one mutual interaction, and use two `->` relationships when each direction should be modeled independently.
