# @likec4/language-services

This package provides initialization of language services from given workspace directory, or in-memory from sources.

It is designed to be browser-compatible and bundled within the main [`likec4`](https://www.npmjs.com/package/likec4) package.

> [!WARNING]
> **This package is intended for internal use within other LikeC4 packages.**
>
> Please use the main [`likec4`](https://www.npmjs.com/package/likec4) package instead.

## Features

- **Browser and Node.js Support** - Dual runtime compatibility with separate entry points
- **Source Parsing** - Parse LikeC4 DSL from strings or workspace directories
- **Model Building** - Build and validate architecture models from parsed sources
- **View Computation** - Compute views with predicates and element filtering
- **Layout Engine** - Graphviz-based automatic layout for diagrams
- **Multi-project Support** - Handle multiple LikeC4 projects in a workspace

## Installation

```bash
npm install @likec4/language-services
# or
pnpm add @likec4/language-services
```

## Usage

### Browser Environment

```typescript
import { fromSource, fromSources } from '@likec4/language-services/browser'

// From a single source string
const likec4 = await fromSource(`
  model {
    customer = person 'Customer'
    system = softwareSystem 'System'

    customer -> system 'uses'
  }
`)

// From multiple source files
const likec4 = await fromSources({
  'model.c4': 'model { ... }',
  'views.c4': 'views { ... }',
  /**
   * Optional, but allows to inject project config
   * with theme customization
   */
  'likec4.config.json': '{ "name": "project-name" }',
})

// Get computed model
const model = await likec4.computedModel()

// Get layouted diagrams
const diagrams = await likec4.diagrams()
```

### Node.js Environment

```typescript
import { fromWorkdir, fromWorkspace } from '@likec4/language-services/node'

// From a workspace directory
const likec4 = await fromWorkspace('./architecture')

// From current working directory
const likec4 = await fromWorkdir()

// Get layouted model
const model = await likec4.layoutedModel()

// Get all projects
const projects = likec4.projects()
```

> [!NOTE]
> There is a separate entry point for node.js environment without MCP support: `@likec4/language-services/node/without-mcp`
>
> Useful to reduce bundle size

## API

### Factory Functions

#### Browser

- `fromSource(source: string): Promise<LikeC4>` - Create from a single source string
- `fromSources(sources: Record<string, string>): Promise<LikeC4>` - Create from multiple source files

> [!NOTE]
> `fromSource` and `fromSources` are available in both browser and node.js environments.

#### Node.js

- `fromWorkspace(path: string, options?: FromWorkspaceOptions): Promise<LikeC4>` - Create from a workspace directory
- `fromWorkdir(options?: FromWorkspaceOptions): Promise<LikeC4>` - Create from current working directory
- `fromSources(sources: Record<string, string>, options?: InitOptions): Promise<LikeC4>` - Create from multiple source files
- `fromSource(source: string, options?: InitOptions): Promise<LikeC4>` - Create from a single source string

### LikeC4 Class

- `computedModel(project?: ProjectId): Promise<LikeC4Model.Computed>` - Build model with computed views (no layout)
- `layoutedModel(project?: ProjectId): Promise<LikeC4Model.Layouted>` - Build model with layout applied
- `diagrams(project?: ProjectId): Promise<LayoutedView[]>` - Get all layouted diagrams
- `projects(): NonEmptyArray<ProjectId>` - Get all project IDs
- `validate(): Promise<ValidationResult>` - Validate all documents
- `export(format: ExportFormat): Promise<string>` - Export to various formats

## Runtime Compatibility

The package provides conditional exports for browser and Node.js environments:

- **Browser**: Uses in-memory workspace, no filesystem access
- **Node.js**: Full filesystem support, workspace scanning, and file watching

The appropriate version is automatically selected based on your environment.

## Getting help

We are always happy to help you get started:

- [Join Discord community](https://discord.gg/86ZSpjKAdA) – it is the easiest way to get help
- [GitHub Discussions](https://github.com/likec4/likec4/discussions) – ask anything about the project or give feedback

## Contributors

<a href="https://github.com/likec4/likec4/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=likec4/likec4" />
</a>

[Become a contributor](../../CONTRIBUTING.md)

## Support development

LikeC4 is a MIT-licensed open source project with its ongoing development made possible entirely by your support.\
If you like the project, please consider contributing financially to help grow and improve it.\
You can support us via [OpenCollective](https://opencollective.com/likec4) or [GitHub Sponsors](https://github.com/sponsors/likec4).

## License

This project is released under the [MIT License](LICENSE)
