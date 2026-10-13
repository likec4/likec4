# @likec4/generators

Converts a [LikeC4](https://likec4.dev) model to other formats: Mermaid, PlantUML, D2, Draw.io, Markdown, LikeC4 DSL, and generates typings for Model API and React.

Most users do not need this package directly: the `likec4` CLI uses it under the hood (`likec4 gen`, `likec4 export`).

## Installation

```sh
npm install @likec4/generators
```

## Diagram generators

Diagram generators take a view model, which you get from a `LikeC4Model`.
Views must be [layouted](https://likec4.dev/tooling/model-api/) for Draw.io; other formats work with computed views.

```ts
import { generateD2, generateMermaid, generatePuml } from '@likec4/generators'
import { LikeC4 } from 'likec4'

const likec4 = await LikeC4.fromWorkspace('./architecture')
const model = await likec4.computedModel()
const view = model.view('index')

console.log(generateMermaid(view))
console.log(generatePuml(view))
console.log(generateD2(view))
```

### Draw.io

```ts
import { generateDrawio, generateDrawioMulti } from '@likec4/generators'

const model = await likec4.layoutedModel()

// One view
const xml = generateDrawio(model.view('index'))

// All views in a single file, one tab per view
const all = generateDrawioMulti([...model.views()])
```

### Markdown

Renders the project title and every authored view as a Mermaid diagram.

```ts
import { generateMarkdown } from '@likec4/generators'

const md = generateMarkdown(model, { description: 'Our architecture' })
```

## Typings

```ts
import { generateLikeC4Model, generateReactTypes } from '@likec4/generators'

// TypeScript declarations for typed Model API and React components
const dts = generateReactTypes(model)

// TypeScript module exporting the model
const ts = generateLikeC4Model(model)
```

## LikeC4 DSL

Import from `@likec4/generators/likec4`.

### Generate DSL from model data

```ts
import { generate } from '@likec4/generators/likec4'

const dsl = generate(model.$data) // parsed model data

// Or directly from the SDK
const same = await likec4.toDSL()

// Custom indentation (spaces count or string)
const tabs = generate(model.$data, { indent: '\t' })
```

The output includes specification, model, deployment and views (element, deployment and dynamic views, including `loop`, `opt`, `par` and `break` blocks).

> [!NOTE]
> Generation is one-way: comments, source positions and original formatting are not preserved.

### Print a single piece of DSL

Operations (`ops`) render a part of the model. Use `print` with an operation and its input:

```ts
import { ops, print } from '@likec4/generators/likec4'

print(ops.expression(), {
  ref: { model: 'cloud.frontend' },
  selector: 'descendants',
})
// cloud.frontend.**

print(ops.model(), {
  elements: [
    { id: 'cloud', kind: 'system' },
    { id: 'cloud.api', kind: 'component', shape: 'component' },
  ],
})
// model {
//   cloud = system {
//     api = component {
//       style {
//         shape component
//       }
//     }
//   }
// }
```

`printWithTabIndent` does the same with tab indentation.

### Compose custom operations

Operations are composable functions over a context. Low-level helpers (`materialize`, `withctx` etc) are exported to build your own:

```ts
import { materialize, ops } from '@likec4/generators/likec4'

const print = materialize(ops.likec4data())

// Usage:
// print({
//   elements: {},
//   relations: {},
//   views: {}
// })
```

## License

MIT
