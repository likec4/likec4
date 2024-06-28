<div align="center">
  <h1>
    Architecture as a code
  </h1>
  <h4>
    Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code
  </h4>

[docs](https://likec4.dev/) | [playground](https://playground.likec4.dev/) | [demo](https://template.likec4.dev/view/cloud)

![vscode extension](https://github.com/likec4/likec4/assets/824903/d6994540-55d1-4167-b66b-45056754cc29)

</div>

## What is LikeC4? Why "like"?

LikeC4 is a modeling language for describing software architecture and tools to generate diagrams from the model.

LikeC4 is inspired by [C4 Model](https://c4model.com/) and [Structurizr DSL](https://github.com/structurizr/dsl), but provides some flexibility.
You customize or define your own notation, element types, and any number of nested levels in architecture model.\
Perfectly tailored to your needs.

## What does LikeC4 look like?

LikeC4 source:

<div align="center">
  <img src="https://github.com/likec4/.github/assets/824903/c0f22106-dba6-469e-ab47-85e7b8565513" width="675px">
</div>

Run [CLI](./packages/likec4/README.md) to preview:

```sh
npx likec4 start
```

And result:

<div align="center">
  <img src="https://github.com/likec4/likec4/assets/824903/27eabe54-7d97-47a8-a7e4-1bb44a8e03e5" width="984px">
</div>

Template repository - [likec4/template](https://github.com/likec4/template)\
Deployed - [https://template.likec4.dev](https://template.likec4.dev/view/cloud)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/likec4/template?file=src%2Fmodel.c4&initialpath=%2Fview%2Findex)

> StackBlitz does not support extensions, so no validation, syntax highlighting and etc.\
> You can try with [github.dev](https://github.dev/likec4/template/blob/main/src/model.c4) and suggested extension.

Check [Tutorial](https://docs.likec4.dev/tutorial/) - for a quick overview of LikeC4.

## About this repository

### Top-level layout

This repository's contents are divided into four primary sections:

- `/docs` contains the content for our docs site at [likec4.dev](https://likec4.dev)
- `/examples` our local development / examples project
- `/integration` integration tests (not yet implemented)
- `/packages` contains the source for packages

### Packages

- `core`: model and type definitions
- `create-likec4`: scaffolding tool
- `diagram`: react components rendering diagrams
- `generators`: _LikeC4 -> Other formats_
- `language-server`: parser and language server
- `layouts`: layout algorithms for views
- `likec4`: CLI, published to npm as `likec4`
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

## License

This project is released under the [MIT License](LICENSE)
