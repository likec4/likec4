# Views

Three types of views are supported:

1. Element views - projections of the model, based on predicates
2. Dynamic views - step-by-step sequence of interactions between elements
3. Deployment views - projections of the deployment model, based on predicates

View IDENTIFIER must be unique within the project, available across all files. Duplicate identifiers will result in a validation error.
There is special view - `index`, if not defined, it will be automatically created to include all top-level elements.

Syntax:

```
views {

  LOCAL_STYLE_RULES     // optional style rules, applied to all views in this block

  // element view
  view IDENTIFIER {
    TAGS                // optional tags, must come first if present, before any properties
    PROPERTIES          // optional, but must come before any view rules
    ELEMENT_VIEW_RULES    
  }
  // element view can also be scoped to a specific element, explained below
  view IDENTIFIER of ELEMENT_ID {     
    TAGS
    PROPERTIES
    ELEMENT_VIEW_RULES    
  }
  // dynamic views
  dynamic view IDENTIFIER {
    TAGS
    PROPERTIES  
    DYNAMIC_VIEW_RULES
  }
  // deployment views
  deployment view IDENTIFIER {
    TAGS
    PROPERTIES
    DEPLOYMENT_VIEW_RULES
  }
}
```

## Element View Rules

Syntax:

```
include PREDICATE, PREDICATE, ...
exclude PREDICATE, PREDICATE, ...
style EXPRESSION, ... {
   // Apply style properties to elements matching the expressions
}
autoLayout TopBottom|BottomTop|LeftRight|RightLeft [rankSep] [nodeSep]
```

Rules order matters, as every next rule applies on top of the previous, accumulating result.
I.e `exclude` rule only removes elements that were included by previous rules, and `style` rule overrides previously applied styles.

See [Predicates](./predicates.md) for more information on predicates and expressions.

## Dynamic View Rules

Syntax:

```
STEP ::=
   SOURCE -> TARGET [LABEL]       // forward message
   | SOURCE <- TARGET [LABEL]     // backward message
   [{
      RELATIONSHIP_PROPERTIES
      RELATIONSHIP_STYLE_PROPERTIES
   }]


DYNAMIC_VIEW_STYLE_RULE ::=
   style EXPRESSION, ... {
      // Apply style properties to elements matching the expressions
   }


DYNAMIC_VIEW_RULES ::=
   STEP
   STEP
   DYNAMIC_VIEW_STYLE_RULE
   ...
```

Rules order matters, as every next rule applies on top of the previous, accumulating result.
I.e `exclude` rule only removes elements that were included by previous rules, and `style` rule overrides previously applied styles.

See [Predicates](./predicates.md) for more information on predicates and expressions.

## Local Style Rules

Styles placed inside `views {}` but outside any `view {}` apply to all views in that block:

```likec4
views {
  // This style applies to ALL views in this block
  style * { color green }

  view index {
    include *
    style backend { color red }    // Overrides green for backend only
  }

  view other {
    include *
    // backend is green (from local style, no override here)
  }
}
```

## Global Style Groups

Reusable style groups defined in `global { ... }`:

```likec4
global {
  styleGroup brandColors {
    style * { color primary }
    style element.tag = #deprecated { color muted; opacity 30% }
    style element.tag = #critical { color red; border dashed }
  }
}

views {
  view index {
    include *
    global style brandColors    // Apply the style group
  }
}
```

Style groups can contain multiple `style` rules. They are applied in the order defined within the group. When used in a view, global styles sit between local styles and view-level styles in the cascade.
