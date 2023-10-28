<div align="center">
  <h1>
    Architecture as a code
  </h1>
  <h4>
    Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code
  </h4>
  
  [docs](https://likec4.dev/docs/) | [playground](https://likec4.dev/playground/) | [example](https://likec4.dev/examples/bigbank/likec4/)

![vscode extension](https://github.com/likec4/likec4/assets/824903/d6994540-55d1-4167-b66b-45056754cc29)

</div>

## What is LikeC4? Why "like"?

LikeC4 is a modeling language for describing software architecture, and tools to generate diagrams from the model.

LikeC4 is inspired by [C4 Model](https://c4model.com/) and [Structurizr DSL](https://github.com/structurizr/dsl), but provides some flexibility.
You customize or define your own notation, element types, and any number of nested levels in architecture model.  
Perfectly tailored to your needs.

## What does LikeC4 look like?

LikeC4 source ([full source on github](https://github.com/likec4/likec4/blob/develop/docs/likec4/index-page/index-page.c4)):

<div align="center">
  <img src="https://github.com/likec4/.github/assets/824903/feb8a707-4556-4628-a083-29e2559f75d7" width="705px">
</div>

CLI to generate react components (or export to other format):

```sh
likec4 codegen react -o likec4-generated.tsx
```

Website:

```tsx
import { LikeC4View } from '$/likec4-generated'

// ...
;<LikeC4View viewId='index' />
```

And this is rendered:

<div align="center">
  <img src="https://github.com/likec4/.github/assets/824903/954093f2-c164-4aa9-9ba6-3627206eeb4e" width="1048px">
</div>

Check the [Tutorial](https://likec4.dev/docs/#tutorial) - a bit better overview of LikeC4.

## About this repository

### Top-level layout

This repository's contents is divided across four primary sections:

- `/docs` contains the content for our docs site at [likec4.dev](https://likec4.dev)
- `/examples` our local development / examples project
- `/integration` integration tests (not yet implemented)
- `/packages` contains the source for packages

### Packages

- `core`: model definitions
- `create-likec4`: scaffolding tool
- `diagrams`: react components for rendering diagrams
- `generators`: _LikeC4 -> Other formats_
- `graph`: Architecture model graph, compute views
- `language-server`: parser and language server
- `layouts`: layout algorithms for views
- `likec4`: the main package, published to npm as `likec4`
- `tsconfig`: typescript configuration
- `vscode`: vscode extension
- `vscode-preview`: preview panel in vscode extension

### Local development

Development tasks:

- `yarn typecheck`: TypeScript compilation
- `yarn build`: Build packages
- `yarn test`: Test packages
- `yarn vitest:ui`: Opens Vitest UI

For VSCode:

- Task `Run Extension` to start a new VSCode instance with the extension loaded.
