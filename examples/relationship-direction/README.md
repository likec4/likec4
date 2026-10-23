# Relationship Direction

Demonstrates backward relationships: a layout hint that keeps the semantic direction of a relationship,
but lays it out from target to source (like `x <- y` in PlantUML).

Subscriptions point from consumer to producer (`billing -[subscribes]-> events`).\
With `autoLayout LeftRight`, Graphviz places the source of an edge before its target, so subscribers end up
to the left of the topic, even though the data flows the other way.

`direction back` reverses only the layout:

- the arrow still points from `billing` to `events`
- `include shop.billing -> shop.events` still matches it
- relationship details, navigation and the model keep the semantic direction

## Syntax

```likec4
specification {
  // all subscriptions are laid out backwards
  relationship subscribes {
    direction back
  }
}

model {
  // per relationship
  billing -> events {
    style {
      direction back
    }
  }
  // shorthand, same as `shipping -[subscribes]-> events` with `direction back`
  events <-[subscribes]- shipping
}

views {
  view forward extends index {
    // per view
    include shop.* -[subscribes]-> shop.events with {
      direction forward
    }
  }
}
```

## Views

- `index`: subscriptions are laid out backwards, so the flow reads left to right:
  `customer → orders → events → billing / shipping → bank / carrier`
- `forward`: same view with `direction forward`, subscribers are placed before the topic
