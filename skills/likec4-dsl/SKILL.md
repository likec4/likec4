---
name: likec4-dsl
description: |
  Auto-trigger when working with .c4 or .likec4 files, or when user asks to write, edit, or generate LikeC4 DSL code.
  Provides complete LikeC4 DSL syntax reference for writing correct architecture-as-code definitions.
---

# LikeC4 DSL Skill

Architecture-as-code tool. Describe systems in `.c4`/`.likec4` files and LikeC4 generates interactive diagrams.

## Rules

1. **Projects** - it is possible to have multiple likec4 projects in a workspace, project is determined by presence of a config file (`.likec4rc`, `likec4.config.{ts,js,json}`). LikeC4 files belong to the project of the nearest config file in the directory hierarchy.
2. **Top-level statements** — only `import`, `specification`, `model`, `deployment`, `views`, `global` are allowed. Blocks can repeat, but at least one must be present.
3. **Multi-file merge** — Top-level blocks across files are merged. For example, multiple `model { ... }` blocks combine into a single model.
4. **Strings** — `'single'`, `"double"` — all support multi-line. Escape quotes with backslash: `\'` or `\"`.
5. **Markdown** — properties like `summary`/`description`/`notes` can contain Markdown. Use triple quotes `'''` or `"""`. Begin a new line after opening quotes and indent Markdown content for better formatting and syntax highlighting.
6. **Comments** — `// single line` and `/* multi-line */` comments supported anywhere.
7. **Identifier** — letters, digits, hyphens, underscores only. No dots (dots are FQN separators). Can't start with a digit.
8. **References** — LikeC4 has lexical scoping with hoisting, nested scope may shadow outer, like in JavaScript. To reference across files, FQN must be used.

## Workflow

1. (Required) Find existing or create new project config (section below). Directory with project config defines the scope for all LikeC4 files in that directory and subdirectories. Ask user if you are uncertain about the scope.
2. (Required) Find existing or create new `specification { ... }`, this enables what kinds of elements/deployments/relationships/tags you can use. See Specification section below.
3. Architecture elements and relationships are defined in `model { ... }` block. See Model section below.
4. Deployment topology is defined in `deployment { ... }` block. See Deployment section below.
5. Diagrams are defined in `views { ... }` block. See Views section below.
6. After editing LikeC4 files, validate with the CLI

## Validation

```bash
npx likec4 validate --json --no-layout --file <edited-file> <project-dir> 2>/dev/null
```

- `--json` — structured output (stdout), logging goes to stderr
- `--no-layout` — skip layout drift checks (faster, only syntax+semantic)
- `--file <path>` — only report errors from this file (can repeat for multiple files)
- `<project-dir>` — path to the project directory

CLI version must be 1.53 or higher (check with `npx likec4 -v`)

Example output:

```json
{
  "valid": false,
  "errors": [
    {
      "message": "...",
      "file": "/abs/path.c4",
      "line": 5,
      "range": { "start": { "line": 5, "character": 2 }, "end": { "line": 5, "character": 20 } }
    }
  ],
  "stats": {
    "totalFiles": 100,
    "totalErrors": 500,
    "filteredFiles": 1,
    "filteredErrors": 1
  }
}
```

Broken specification/model in a large project can cascade into lots of errors across all files.
Always use `--file` to focus on the files you edited. If `filteredErrors` is 0 but `totalErrors` is high,
your files are clean but something else in the project is broken (not your problem).

## LikeC4 Project Configuration

Config file (`likec4.config.json`, `.likec4rc`, or `likec4.config.{ts,js}`) defines a project. Its location sets the project scope (LikeC4 files belong to the project of the nearest config file in the directory hierarchy).

```json
{
  "$schema": "https://likec4.dev/schemas/config.json",
  "name": "my-project",
  "title": "Project Title"
}
```

Key options: `name` (required, unique ID in the workspace), `title`

Full reference → `references/configuration.md`

## Quick Decision Trees

### "I need to create a diagram/view or show a flow or sequence"

```text
What kind of diagram?

├─ Interaction flow / sequence → Dynamic View
├─ Infrastructure / deployment → Deployment View
├─ From architecture model → Element View
│   ├─ Primary element known → Scoped view: `view name of element { ... }`
│   └─ Extend existing view → `view name extends other { ... }`
└─ Other → `view name { ... }`
```

### "My view doesn't show what I expect"

```text
View not showing correctly?
├─ Elements missing → Check include predicates
│   ├─ Unscoped view: `*` = top-level only
│   ├─ Scoped view (of X): `*` = X + direct children
│   ├─ Need children → include element.*
│   ├─ Need all descendants → include element.**
│   └─ Need relationships too → include source -> target
├─ Too many elements → Add exclude after include
│   └─ exclude only removes previously-included items
├─ Relationships not visible → Include both endpoints AND the relationship
│   └─ include frontend, backend, frontend -> backend
├─ Styles not applying → Check cascade order
│   └─ Spec defaults < global styles < local styles < view-level styles
├─ Where conditions → references/predicates.md
└─ Full predicate reference → references/predicates.md
```

### "I need to style ..."

```text
Styling?
├─ Style element(s) in a view → view rule, see `references/views.md`
├─ Style element globally → property inside element definition, see Model section
├─ Style all elements of a kind → property inside kind specification, see Specification section
├─ Style by tag → view rule, see `references/views.md`
├─ Style relationship(s) in a view → view rule, see `references/views.md`
├─ Style relationship globally → property inside relationship definition, see Model section
├─ Style all relationships of a kind → property inside kind specification, see Specification section
├─ Reuse same styles across views → see `references/views.md`
```

### "I need to organize across files"

```text
Multi-file project?
├─ Import elements → import { backend } from './shared.c4'
├─ Extend element → extend cloud.backend { service newSvc "New" }
├─ Extend relationship → extend cloud -> amazon { metadata { ... } }
├─ Metadata merge → Duplicate keys become arrays
├─ Organize views → views "Use Cases" { ... } (folder label)
└─ All blocks are mergeable across files
```

## Specification (Quick Reference)

Syntax:

```likec4
specification {
  // Define dict of tags, outside of specification used as #tag
  tag IDENTIFIER  
  // Define kind to use in model, with optional properties and style
  element IDENTIFIER {
    #tag-1 #tag-2 // tags to apply to all elements of this kind
    title "default title for this kind"
    technology "default tech for this kind"
    description "default description for this kind"
    notation "legend title for this kind"
    style { ... } // see Style section below
  }
  // Define kind to use in deployment model
  deploymentNode IDENTIFIER {
    // same properties and styles as element kind
  }  
  // Define relationship kind with default properties and styles
  relationship IDENTIFIER {
    technology "default tech for this relationship kind"
    description "default description for this relationship kind"
    style { ... } // default style for this relationship kind
  } 
}
```

**Important:**

- Specification is global, defined element kinds, tags etc. are available across all files in the project.
- Duplicate identifiers (same element kind, same tag, etc.) will cause a validation error.
- Multiple specification blocks (in one file or across files) are allowed, but not recommended.
- Prefer to keep specification in a single dedicated file, e.g. `specification.c4`.

Example:

```likec4
specification {
  element actor { notation "Person" style { shape person } }
  element service { description "Same for all of the kind" style { shape component } }
  element webapp { style { shape browser } }
  element queue { style { shape queue color secondary } }

  relationship async { color amber; line dotted; head diamond; tail vee }

  tag deprecated
  tag critical

  deploymentNode environment { notation "Environment"; style { color gray } }
  deploymentNode vm
}
```

## Model (Quick Reference)

Model is a hierarchical structure of elements, where each element can contain other elements. Relationships exist between any pair of elements, but not between parent and child elements and vice versa. Relationships can be defined on any level of the hierarchy. Element MUST have an identifier (unique within its parent scope) and a kind. Element may have a body `{ .. }` with tags, properties, nested elements and relationships. Identifiers are required for referencing elements, FQN (Fully Qualified Name) is constructed by concatenating all parent identifiers with dots.

Syntax:

```likec4
model {
  // Elements, top-levels are global, can be referenced anywhere in the project
  IDENTIFIER = KIND "title"           // with title, without body
  IDENTIFIER = KIND                   // without title, without body (title defaults to ID)
  KIND IDENTIFIER "title"             // if preferred by user to have kind before name  
  IDENTIFIER = KIND {
    TAGS                              // optional, but must come first if present, before any properties
    PROPERTIES                        // optional, but must come before nested elements and relationships

    // order of nested elements vs relationships doesn't matter
    // Nested elements, can be referenced in this file by id, but from other files only using FQN, i.e. parentid.childid
    IDENTIFIER = KIND "Child Title" {
       // Same as above, no limit to nesting levels
    }
    KIND IDENTIFIER "Child Title" // if preferred by user to have kind before name

    // Explicit Relationship, SOURCE and TARGET must be resolvable within the current scope
    SOURCE -> TARGET
    // Sourceless Relationship (current element is SOURCE implicitly)
    -> TARGET "Relationship title"
    -> TARGET "Relationship title" {
      TAGS                            // optional, but must come first if present, before any properties
      PROPERTIES                      // optional
    }
    // Relationship with kind
    -[REL_KIND]-> TARGET "Relationship title" 
    .REL_KIND -> TARGET "Relationship title"   // Alternative syntax for relationship with kind
    // "it" and "this" refer to the current element
    SOURCE -> it     // Incoming relationship to current element
    this -> TARGET   // Outgoing relationship from current element
  }

  // Relationships on top level MUST have SOURCE
  SOURCE -> TARGET "Relationship title"    //without body
  SOURCE -> TARGET "Relationship title" {
    TAGS                                   // optional, but must come first if present, before any properties
    PROPERTIES                             // optional
  }
  SOURCE -[REL_KIND]-> TARGET
  SOURCE .REL_KIND TARGET

  // Extend existing element by FQN, e.g. from another file
  extend FQN { 
    TAGS                   // additional tags to apply to this element
    PROPERTIES             // additional properties to merge into this element, allowed `metadata` and `link` only

    NESTED_ELEMENTS | RELATIONSHIPS
  }
}
```

Example:

```likec4
model {
  customer = actor "Customer" { description "End user" }

  cloud = system "Cloud" {
    ui = container "Frontend" {
      style { shape browser }
      dashboard = app "Dashboard" { technology "React" }
    }
    backend = container "Backend" {
      api = service "API" { #critical; technology "Node.js"; icon tech:nodejs }
      db = database "DB" { icon tech:postgresql }
      api -> db "reads/writes"
    }
    ui.dashboard -> backend.api "calls" { technology "HTTPS" }
  }

  customer -> cloud.ui.dashboard "browses" {
    navigateTo browse-flow
    metadata { protocol "HTTPS" }
  }
}
```

**Element properties:** `title`, `description`, `summary`, `technology`, `metadata`, `style`, `link`
**Relationship properties:** `title`, `description`, `technology`, `metadata`, `style`, `link`, `navigateTo`

## Property (Quick Reference)

| Category        | Values                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **title**       | String, prefer single line                                                                                       |
| **description** | String, prefer Markdown (in triple quotes)                                                                       |
| **summary**     | String, short description, prefer Markdown                                                                       |
| **technology**  | String, no multi-line                                                                                            |
| **metadata**    | Syntax: `metadata { KEY VALUE }`, where key must be valid identifier and value can be string or array of strings |
| **link**        | Syntax: `link URL "Optional title"`, may be used several times                                                   |
| **navigateTo**  | ID of dynamic view to navigate to                                                                                |
| **style**       | Syntax: `style { ... }`, see Style section below                                                                 |

## Style (Quick Reference)

Style is a dict of properties to define the visual appearance, example:

```likec4
style {
  color primary   
  icon tech:claude
}
```

| style property   | Values                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| **color**        | `primary`, `secondary`, `muted`, `slate`, `blue`, `indigo`, `sky`, `red`, `gray`, `green`, `amber`            |
| **shape**        | `rectangle`, `component`, `person`, `browser`, `mobile`, `cylinder`, `storage`, `queue`, `bucket`, `document` |
| **border**       | `solid`, `dashed`, `dotted`, `none`                                                                           |
| **opacity**      | `0%` - `100%`                                                                                                 |
| **size**         | `xs`, `sm`, `md`, `lg`, `xl`                                                                                  |
| **padding**      | same as size                                                                                                  |
| **textSize**     | same as size                                                                                                  |
| **icon**         | relative path, URL, or from icon pack (`aws:`, `azure:`, `gcp:`, `tech:`, `bootstrap:`)                       |
| **iconColor**    | same as color                                                                                                 |
| **iconSize**     | same as size                                                                                                  |
| **iconPosition** | `top`, `left`, `right`, `bottom`                                                                              |
| **multiple**     | `true`/`false`                                                                                                |

Icon packs are bundled set of icons, referenced by prefix.
For example, `icon aws:simple-storage-service` will use `@likec4/icons/aws/simple-storage-service` (scan package to find available icons, use lower-kebab-case).

Relationship style properties:

- `color` (line color): same as element colors
- `line` (line style): `solid`, `dashed`, `dotted`
- `head` (arrowhead style): `none`, `normal`, `onormal`, `dot`, `odot`, `diamond`, `odiamond`, `crow`, `open`, `vee`
- `tail` (arrow tail style): same as head

## Deployment (Quick Reference)

Deployment has similar syntax as model, but is defined in `deployment` block and uses `deploymentNode` kinds.
It allows "deploying" instances of elements from the model inside deployment nodes, using the `instanceOf` keyword.

Example:

```likec4
specification {
  element webapp
  deploymentNode vm
}
model {
  webapp myapp
}
deployment {
  vm vm1 {
    instanceOf myapp
  }
  vm vm2 {
    instanceOf myapp
  }
}
```

## Views (Quick Reference)

Syntax:

```likec4
views {
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

**View properties:** `title`, `description`, `metadata`, `link`

Dynamic view reference → references/dynamic-views.md
Element view rules reference → references/views.md

## Reference Index

| File                          | Purpose                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `references/configuration.md` | Project config options, multi-project setup, styles, generators, include/exclude |
| `references/views.md`         | Element view rules, include/exclude, style rules, groups, autoLayout             |
| `references/predicates.md`    | Predicate syntax, wildcards, where conditions, with overrides, global groups     |
| `references/dynamic-views.md` | Steps, parallel, chained, variants, notes, navigateTo, complete examples         |
| `references/deployment.md`    | Deployment nodes, instances, relationships, deployment views, multi-env examples |
