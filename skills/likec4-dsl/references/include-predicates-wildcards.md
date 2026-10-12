# Include Predicates and Wildcards in Views

## Wildcard semantics

LikeC4 view predicates use the wildcard `*` and the selector suffixes `parent.*`, `parent._` and `parent.**`.
`_` and `**` exist **only** as suffixes on an element reference: bare `include **` and `exclude _` are parse errors.

### `*` — immediate children and direct contains-relationships

```likec4
views {
  view container-overview {
    include *
  }
}
```

- Includes **direct children** of the scoped element (one level down).
- Includes **direct relationships** defined at the same scope.
- Does **not** include grandchildren or descendant chains.

### `parent._` — expand (children that have relationships)

```likec4
views {
  view connected-children {
    include customer
    include cloud._
  }
}
```

- Includes `cloud` and only those direct children of `cloud` that have relationships with visible elements; other children are omitted.
- Same as `include cloud` + `include -> cloud.* ->`.
- `_` is **not** a "match anything" wildcard. To exclude every visible element with a tag, use `exclude * where tag is #deprecated`.

### `parent.**` — recursive descent (descendants)

```likec4
views {
  view full-tree {
    include cloud.**
  }
}
```

- Includes **all descendants** recursively (grandchildren, great-grandchildren, etc.).
- **Not** the same as `include cloud.*` (which is immediate children only).
- Use when you want nested hierarchies visible in a single view.

## Scoped view base semantics

In a **scoped view** (`view name of parent { ... }`), the `include` base set has special meaning:

```likec4
views {
  view backend-overview of cloud.backend {
    include *                  // Base set: cloud.backend + its immediate children
    include -> cloud.backend   // Add: inbound relationships to the scope
    include -> *               // Add: outbound relationships from children
  }
}
```

**Key facts:**
- `include *` in a scoped view = the scoped parent + **direct children only**
- Grandchildren inside `*` context are **not** included (you'd need `include cloud.backend.**` or explicit FQN inclusion)
- Relationship predicates like `->` and `<->` can further expand what neighbors appear

## Common filter patterns

### Show a container and its components

```likec4
views {
  view container-details of cloud.backend.api {
    include *              // api (parent) + all components
    include -> api         // Add external callers
  }
}
```

### Show descendants recursively

```likec4
views {
  view system-tree of cloud {
    include cloud.**       // All descendants of cloud (full tree)
  }
}
```

### Filter by kind

```likec4
views {
  view services-only {
    include * where kind is service
    include cloud.** where kind is service  // All services at any depth inside cloud
  }
}
```

### Filter by tag

```likec4
views {
  view critical-view {
    include * where tag is #critical
    exclude * where tag is #deprecated  // Removes deprecated elements at any depth
  }
}
```

## Relationship predicate expansion

In scoped views, you can expand what neighboring elements appear via relationship predicates:

```likec4
views {
  view backend-with-neighbors of cloud.backend {
    include *                // Base: backend scope + direct children
    include -> cloud.backend // Add: inbound edges from outside scope
  }
}
```

This **does not change the base set of elements**; it only **includes relationships** that end in the visible elements. Neighbors of the scope that have incoming edges *do* appear because they are needed to render those edges visually.

## Wildcard `**` vs. explicit include

### Using `**` (recursive)

```likec4
views {
  view all-elements {
    include cloud.**
  }
}
```

- Automatically includes all descendants.
- Used when hierarchy depth is unknown or variable.

### Using `*` + explicit FQNs

```likec4
views {
  view two-levels {
    include *              // Level 1
    include cloud.*        // Level 2 under cloud
  }
}
```

- More explicit; requires knowing the hierarchy.
- Useful when you want fine-grained control.

## Common mistakes

| Wrong | Right | Why |
|---|---|---|
| Bare `include **` or `exclude _` | `include cloud.**`, `exclude * where tag is #deprecated` | `**` and `_` are suffixes on an element reference, not standalone wildcards |
| `include cloud.**` expecting only immediate children | `include cloud.*` | `**` is recursive; use `*` for one level |
| Forgetting to add relationship filters in scoped view | `include *` + `include -> parent` | Relationships may not auto-render without explicit inclusion |
| Assuming `include *` includes grandchildren | Use `include cloud.**` instead | `*` is immediate children only |

## Summary table

| Form | Matches | Scope context |
|---|---|---|
| `*` | Direct children + sibling relationships | One level down |
| `parent._` | `parent` + direct children that have relationships with visible elements | One level down |
| `parent.**` | All descendants recursively | Any depth |
| `include -> element` | Inbound relationships to element | Shows external sources |
| `include element ->` | Outbound relationships from element | Shows targets |
| `include a <-> b` | Relationships between `a` and `b` in either direction | Shows symmetric dependencies |

**In scoped views:** `include *` establishes a base set of the scope parent + immediate children. Relationship predicates like `->` and `<->` can bring in neighboring elements needed to render those relationships.
