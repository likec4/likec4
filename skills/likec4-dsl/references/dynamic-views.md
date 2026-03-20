### "I need to show a flow or sequence"

```
Flow / sequence diagram?
├─ Basic steps → source -> target "title"
├─ Response / backward → source <- target "returns"
├─ Parallel actions → parallel { ... } (also: par { ... })
├─ Chained steps → customer -> frontend "x" -> backend "y"
├─ Step with notes → step { notes 'Markdown content' }
├─ Link to another view → step { navigateTo other-view }
├─ Sequence variant → dynamic view name { variant sequence }
└─ Full reference → references/dynamic-views.md
```

# Dynamic Views — Detailed Reference

Dynamic views show interactions between elements. They can render as animated flow diagrams or UML sequence diagrams.

## Basic Structure

```likec4
views {
  dynamic view checkout-flow {
    title "Checkout Flow"
    description "How customers complete a purchase"
    // variant sequence   // Optional: UML sequence diagram
    // variant diagram    // Default: animated box-and-line diagram

    // Steps go here (ordered top to bottom)
    customer -> frontend "opens app"
    frontend -> backend "requests data"
    backend <- database "returns results"     // Backward step

    // Include/exclude, style, autoLayout also work here
  }
}
```

## Steps

Each step represents an interaction between two elements:

```likec4
// Forward step
customer -> frontend "opens app"

// Backward step (response/return flow)
frontend <- backend "returns data"

// Step with full properties
customer -> frontend "places order" {
  title "Customer places an order"       // Override step label
  description "Detailed description"
  technology "HTTPS"
  notes '''
    Additional notes displayed in sidebar.
    Supports **Markdown** formatting.
  '''
  navigateTo order-detail                // Link to another view
}
```

Step properties: `title`, `description`, `technology`, `notes`, `navigateTo`.

### Chained Steps

Steps can be chained to reduce repetition:

```likec4
customer
  -> frontend "opens"
  -> backend "requests"
  -> database "queries"
  <- backend "responds"          // Backward in chain
  <- frontend "displays"
```

Each arrow in the chain creates a separate step. The target of the previous step becomes the source of the next.

## Parallel Steps

Use `parallel` (or `par`) blocks for concurrent interactions:

```likec4
dynamic view flow {
  frontend -> backend "requests data"

  parallel {
    backend -> cache "checks cache"
    backend -> database "queries DB"
    backend -> external-api "fetches enrichment"
  }

  backend -> frontend "returns aggregated data"
}
```

Parallel blocks can be nested and mixed with sequential steps.

## Variants

| Variant             | Rendering                     | Use case                           |
| ------------------- | ----------------------------- | ---------------------------------- |
| `diagram` (default) | Animated box-and-line diagram | General flow visualization         |
| `sequence`          | UML sequence diagram          | API call sequences, protocol flows |

```likec4
dynamic view api-sequence {
  variant sequence

  client -> gateway "POST /orders"
  gateway -> auth "validate token"
  auth <- gateway "200 OK"
  gateway -> orders "create order"
  orders -> db "INSERT"
  orders <- db "order_id"
  gateway <- orders "201 Created"
  client <- gateway "201 Created"
}
```

Sequence diagrams work best with leaf elements (not containers).

## Include/Exclude in Dynamic Views

Dynamic views support the same predicates as element views, used to add context elements that don't participate in steps:

```likec4
dynamic view flow {
  customer -> frontend "opens"
  frontend -> backend "requests"

  // Add parent containers as visual context
  include cloud with {
    color muted
    opacity 10%
  }
  include amazon

  exclude deprecated-service
}
```

## Styling in Dynamic Views

Same styling rules as element views:

```likec4
dynamic view flow {
  customer -> frontend "opens"
  frontend -> backend "requests"

  style customer { color green }
  style * { size sm }
  style cloud { opacity 40%; color muted }
  style frontend -> backend { color red }

  autoLayout TopBottom
}
```

## Global Dynamic Predicate Groups

For reusable predicates specific to dynamic views:

```likec4
global {
  dynamicPredicateGroup commonContext {
    include customer
    include frontend
    style customer { color green }
  }
}

views {
  dynamic view flow1 {
    customer -> frontend "action 1"
    global predicate commonContext
  }
  dynamic view flow2 {
    customer -> frontend "action 2"
    global predicate commonContext
  }
}
```

## Complete Example — E-Commerce Order Flow

```likec4
views "Use Cases" {
  dynamic view place-order {
    title "Placing an Order"
    description "End-to-end order placement flow"

    customer -> frontend "places products in cart"
    frontend -> cart "creates or updates cart"
    customer -> frontend "enters shipping info" {
      notes 'Customer enters shipping information to get cost estimates.'
    }
    customer -> frontend "enters payment info"
    frontend -> checkout "initiates payment"
    checkout -> db "persists order"
    checkout -> shipping "reserves inventory"
    checkout <- shipping "confirms reservation"

    parallel {
      checkout -> cart "marks cart as purchased"
      checkout -> email "sends order confirmation"
      checkout -> payments "creates payment"
    }

    payments -> payment-gateway "processes payment"
    payments <- payment-gateway "confirms with webhook"
    checkout <- payments "payment confirmed"

    parallel {
      checkout -> shipping "requests fulfillment" {
        navigateTo order-fulfillment
      }
      checkout -> email "sends confirmation"
      checkout -> db "updates order status"
    }

    include boutique with { color gray; opacity 10% }
    style customer { color green }
    style payment-gateway { color muted }
  }
}
```
