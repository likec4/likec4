# Dynamic Views — Flow & Sequence Diagrams

Dynamic views model temporal interactions and flows between elements. They render as animated flow diagrams or (optionally) UML sequence diagrams.

## Syntax Overview

```likec4
views {
  dynamic view name {
    variant sequence  // optional: render as UML sequence diagram

    title "Flow title"
    description "Flow description"
    
    SOURCE -> TARGET "step title"
    SOURCE <- TARGET "return flow"

    // flow-control blocks (each takes an optional title, can nest)
    parallel 'optional' {                 // also: par, opt, loop, break
      SOURCE_1 -> TARGET_1 "parallel action 1"
      SOURCE_2 -> TARGET_2 "parallel action 2"
    }
    alt 'optional' {                          // mutually exclusive branches
      when 'condition' { SOURCE -> TARGET }
      else { SOURCE -> TARGET }
    }
    try 'optional' { SOURCE -> TARGET }
    catch 'optional' { SOURCE -> TARGET }
    finally 'optional' { SOURCE -> TARGET }
  }
}
```

## Basic Steps

### Forward step

```likec4
dynamic view checkout-flow {
  customer -> frontend "opens cart"
  frontend -> backend "requests checkout"
  backend -> payment-service "initiates payment"
  payment-service -> bank "authorizes card"
}
```

- Renders as directed arrow from source to target.
- Title appears on the arrow/step.

### Return step (response arrow)

```likec4
dynamic view checkout-flow {
  customer -> frontend "opens cart"
  frontend -> backend "requests checkout"
  frontend <- backend "payment result"  // Return flow
}
```

- `<-` denotes response/return flow.
- Renders as dotted or dashed arrow depending on theme.
- Semantically indicates flow **back** to the source.

### Chained steps

```likec4
dynamic view multi-hop {
  customer
    -> frontend "request"
    -> backend "forwards"
    -> db "query"
}
```

Keep the chain as one compound expression when the prompt explicitly asks for chained syntax.

### Hop-local body (exactness for evals)

```likec4
dynamic view checkout-flow {
  customer -> frontend
    -> api {
      technology 'HTTPS'
      navigateTo payment-detail
    }
}
```

Attach the body only to the requested hop. Do not move the block onto the whole chain unless the prompt allows it.

## Flow Control Blocks

Steps can be grouped into **flow-control blocks**. `parallel` is one of these blocks — not a special case. Every block:

- takes an **optional title** (a `String`) right after the keyword, then wraps a `{ ... }` body of steps;
- may be **nested to any depth** — the only exception is `parallel`/`par`, which cannot nest inside another `parallel`/`par`.

Block keyword map:

| Block                 | Keyword(s)                  | Meaning                                         |
| --------------------- | --------------------------- | ----------------------------------------------- |
| Parallel              | `parallel` / `par`          | Steps inside run concurrently                   |
| Optional              | `opt`                       | Steps that may be skipped                       |
| Loop                  | `loop`                      | Steps that repeat                               |
| Break                 | `break`                     | Interrupts the enclosing flow (e.g. exits loop) |
| Alternatives          | `alt`                       | Container of mutually exclusive branches        |
| Branch (inside `alt`) | `when` / `if` / `else`      | One branch of an `alt` (`if` is a `when` alias) |
| Error handling        | `try` / `catch` / `finally` | Happy path plus optional error handling         |

### Parallel — `parallel` / `par`

Steps inside run concurrently. Use for fan-outs (one source to multiple targets):

```likec4
dynamic view fan-out {
  backend -> cache "write to cache"
  parallel {
    backend -> db "save record"
    backend -> audit-log "log event"
    backend -> notification-service "send notification"
  }
}
```

- `par { ... }` is an exact alias for `parallel { ... }`.
- Renders with time-aligned horizontal layout.
- **Cannot nest**: `parallel { parallel { ... } }` (or with `par`) is a validation error — `Nested parallel blocks are not allowed`. A `parallel` block may still live inside `opt` / `loop` / `try` / an `alt` branch.
- When the prompt asks for one fan-out, keep sibling actions in **one** `parallel { ... }` block; do not split them into multiple one-step blocks.

### Optional — `opt`

A block of steps that may be skipped:

```likec4
opt 'if not cached' {
  api -> db 'load and cache'
}
```

### Loop — `loop`

A block of steps that repeats:

```likec4
loop 'until success' {
  api -> auth 'retry authentication'
}
```

### Break — `break`

Interrupts the enclosing flow (typically exits a `loop`):

```likec4
loop 'poll for result' {
  api -> db 'check status'
  break 'when ready' {
    api -> web 'return result'
  }
}
```

### Alternatives — `alt` with `when` / `if` / `else`

`alt` groups mutually exclusive branches. Its **direct children must be branches** — `when`, `if`, or `else` (with an optional title each):

```likec4
alt {
  when 'authorized' {
    app -> api 'requests data'
  }
  else 'not authorized' {
    app -> customer 'shows login'
  }
}
```

- `if` is an alias for `when`; both are branch keywords.
- `when` / `if` / `else` are only valid **inside** `alt`. Using them at the top level or inside `loop` / `parallel` / `opt` is a validation error (`"when" alternative branch must be inside "alt"`).
- Putting a non-branch block (`loop`, `opt`, `parallel`, `try`) as a **direct** child of `alt` is a validation error (`"loop" can not be used as an alternative branch`). Nest those blocks **inside** a branch instead.

### Try / catch / finally — `try`

Models the happy path with optional error handling. `catch` and `finally` are both optional, but order is fixed: `try` → `catch?` → `finally?`.

```likec4
try {
  api -> db 'query'
} catch 'on failure' {
  api -> web 'shows error'
} finally {
  api -> api 'release resources'
}
```

- `try` alone, `try { } catch { }`, `try { } finally { }`, and `try { } catch { } finally { }` are all valid.
- A `catch` with no preceding `try`, or a `catch` after `finally`, is a validation error.
- `try` cannot be a direct child of `alt` (only branches can) — put it inside a `when` / `else` branch.

### Nesting

Blocks combine and nest to any depth (except `parallel` inside `parallel`):

```likec4
dynamic view resilient-sync {
  variant sequence
  loop 'until synced' {
    try {
      alt {
        when 'online' {
          web -> api 'sync changes'
        }
        else 'offline' {
          opt {
            web -> web 'queue locally'
          }
        }
      }
    } finally {
      web <- api 'ack'
    }
  }
}
```

## Step Properties (Body)

Attach a body block `{ ... }` to a step for additional metadata:

```likec4
dynamic view with-notes {
  customer -> frontend "view product" {
    title "View Product Detail"
    technology "HTTPS"
    description "Customer opens product page"
  }
  
  frontend -> backend "fetch product data" {
    notes """
      Includes:
      - Product info
      - Pricing
      - Available inventory
    """
  }

  backend -> db "query" {
    metadata {
      latency "50ms"
      cached false
    }
  }
}
```

**Available properties inside step body:**

- `title` — alternative or longer title
- `technology` — technology/protocol used
- `description` — detailed description
- `notes` — markdown-formatted notes/commentary
- `metadata` — key-value pairs for custom data

## Navigation & Drill-down

Link to another view from a step:

```likec4
dynamic view high-level {
  customer -> frontend "browse"
  frontend -> backend "request data" {
    navigateTo data-fetch-details  // Link to another view
  }
}

dynamic view data-fetch-details {
  // Detailed flow of the "data-fetch" step
}
```

- `navigateTo <view-name>` — renders as a clickable link to drill down.
- Use for progressive disclosure: high-level flows → detailed sub-flows.

## Variant: Sequence Diagram

Render the dynamic view as a UML-style sequence diagram:

```likec4
dynamic view checkout-sequence {
  variant sequence  // Switch to sequence diagram rendering
  
  customer -> frontend "click checkout"
  frontend -> backend "POST /checkout"
  backend -> payment-service "charge card"
  payment-service <- bank "authorization"
  backend <- payment-service "charge approved"
  frontend <- backend "200 OK"
  customer <- frontend "show confirmation"
}
```

- `variant sequence` — tells LikeC4 to render as sequence diagram.
- Timeline flows top-to-bottom (instead of left-to-right flow diagram).
- Actors (lifelines) are participants; return arrows are dashed.

### Comparing flow vs. sequence rendering

| Aspect        | Flow Diagram                   | Sequence Diagram (variant sequence) |
| ------------- | ------------------------------ | ----------------------------------- |
| Layout        | Left-to-right or top-down flow | Top-to-bottom lifelines             |
| Return arrows | Style varies                   | Dashed lines standard               |
| Parallel feel | Horizontal alignment           | Time-based with spacing             |
| Best for      | System interactions            | Message exchange protocols          |

## Response Arrow Patterns (exactness)

If the prompt asks for response arrows back out, prefer `<-` steps over inventing extra forward steps:

```likec4
dynamic view checkout-flow {
  customer -> frontend -> api
  customer <- frontend <- api  // Prefer chained <- for responses
}
```

NOT:

```likec4
dynamic view checkout-flow {
  customer -> frontend -> api
  api -> frontend "returns"  // Wrong: not a response arrow (missing symmetry)
  frontend -> customer "returns"
}
```

## Common Patterns

### Fan-out with return

```likec4
dynamic view fan-out-return {
  backend -> cache "check"
  backend -> db "if miss"
  backend <- db "result"
  backend -> client "send"
}
```

Order: send to multiple targets, then collect responses separately when they differ.

### Pipeline / staged flow

```likec4
dynamic view data-pipeline {
  source -> ingester "submit"
  ingester -> parser "parse"
  parser -> validator "validate"
  validator -> storage "store"
  validator <- storage "ack"
}
```

- Linear chain: each stage outputs to the next.
- Use for ETL/processing workflows.

### Conditional/branching

Prefer an `alt` block with `if` / `when` / `else` branches — this renders as an explicit alternative frame in the `sequence` variant:

```likec4
dynamic view payment-decision {
  customer -> frontend "enter amount"
  frontend -> backend "validate"
  alt {
    when 'within limit' {
      backend -> payment-service "charge"
      backend <- payment-service "result"
    }
    else 'over limit' {
      backend -> frontend "rejected"
    }
  }
}
```

- Reach for `opt` for an "if without else" (a step group that may be skipped), and `try` / `catch` for success-vs-failure paths.
- `notes` on a step remains a lightweight way to document decision logic when a full branch block is not warranted.

## Anti-Patterns to Avoid

| Anti-pattern                                      | Problem                                     | Solution                                            |
| ------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Nested `parallel { parallel { ... } }`            | `Nested parallel blocks are not allowed`    | Put all concurrent steps in one `parallel {}`       |
| `when` / `if` / `else` outside `alt`              | `alternative branch must be inside "alt"`   | Wrap branches in an `alt { ... }` block             |
| `loop`/`opt`/`parallel`/`try` direct in `alt`     | `can not be used as an alternative branch`  | Nest them inside a `when` / `else` branch           |
| `catch` without `try`, or `catch` after `finally` | Invalid try/catch/finally order             | Keep order `try` → `catch?` → `finally?`            |
| Too many steps in one view                        | Diagram becomes unreadable                  | Split into sub-views with `navigateTo`              |
| Using `<-` for side-by-side actions               | Implies return; violates sequence semantics | Use forward `->` or group with `parallel`           |
| Forgetting `variant sequence` when UML needed     | Wrong rendering                             | Add `variant sequence` if sequence diagram required |

## Predicate Filters in Dynamic Views

Dynamic views do not use predicates to generate or filter interaction steps. Steps must be listed explicitly.

You may still use normal include predicates to add context elements that do not participate in steps:

```likec4
dynamic view critical-flow {
  frontend -> api "request"
  api -> db "query"

  include cloud.* where tag is #critical
  include cloud.* where metadata.region is "eu"
}

dynamic view with-cache {
  // Alternative flow with cache layer
  frontend -> cache "check"
  cache -> backend "if miss"
}
```

## Reference and Examples

Full LikeC4 dynamic view docs: https://likec4.dev/dsl/views/dynamic/

Common scenarios:

- **Authentication flow** — customer → login → auth-service → database
- **CQRS pattern** — command → service → write-db (parallel: query-handler → read-db)
- **Webhook callback** — external-system → api (parallel within with navigateTo service-webhook-handler)
- **Pub/Sub flow** — publisher → message-bus → consumer (with parallel for multiple subscribers)

When the prompt asks for one parallel fan-out, keep sibling actions inside one `parallel { ... }` block. Do not split the three steps into separate one-step blocks.

### Sequence variant

```likec4
dynamic view checkout-flow {
  variant sequence
  customer -> frontend -> api
  customer <- frontend <- api
}
```

Use `variant sequence` when the prompt explicitly asks for UML-style sequence rendering.

## Quick anti-patterns

- Rewriting a requested chain as separate top-level steps
- Using forward arrows where the prompt explicitly asks for response arrows back out
- Spreading one requested parallel fan-out across multiple `parallel` blocks
- Omitting required hop-local tokens such as `technology` or `navigateTo`
- Placing `when` / `if` / `else` anywhere but directly inside `alt`
- Putting `loop` / `opt` / `parallel` / `try` as a direct child of `alt` instead of inside a branch
- Nesting `parallel` inside `parallel` (only block that cannot nest)
- Breaking try/catch/finally order (`try` → `catch?` → `finally?`)
