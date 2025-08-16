# LikeC4

<a href="https://www.npmjs.com/package/likec4" target="_blank">![NPM Version](https://img.shields.io/npm/v/likec4)</a>
<a href="https://www.npmjs.com/package/likec4" target="_blank">![NPM Downloads](https://img.shields.io/npm/dm/likec4)</a>

`likec4` package is a composition of language services, react components, vite plugin and CLI.

Features:

- Preview diagrams in a local web server (with lightning-fast updates) ⚡️
- Build a static .website (deploy to github pages, netlify...) 🔗
- Export to PNG, JSON, Mermaid, Dot, D2 (if you need something static) 🖼️
- Vite Plugin (for embedding diagrams into your Vite-based application) ⚙️
- Generate React components (for custom integrations ) 🛠️

## Install

> **Compatibility Note:**\
> LikeC4 requires [Node.js](https://nodejs.org/en/) version 20+

### Local installation

If you're using it in an npm project, install it as a development dependency:

```sh
npm install --save-dev likec4
```

You can reference it directly in the `package.json#scripts` object:

```json5
{
  scripts: {
    dev: 'likec4 serve ...',
    build: 'likec4 build ...'
  }
}
```

### Global installation

To use the CLI globally, you can call it with [`npx`](https://docs.npmjs.com/cli/v10/commands/npx):

```sh
npx likec4 [command]
```

If you want to use it in any arbitrary project without [`npx`](https://docs.npmjs.com/cli/v10/commands/npx), install it globally:

```sh
npm install --global likec4

# Then, you can call `likec4` directly:
likec4 [command]
```

## CLI Usage

> Refer to the help:
>
> ```sh
> likec4 build -h
> likec4 codegen react -h
> ```
>
> Almost all commands have a `--help` option and provide usage examples.

### Preview diagrams

In a folder with LikeC4 sources:

```sh
likec4 serve

# Aliases:
likec4 start
likec4 dev
```

This recursively searches for `*.c4`, `*.likec4` files in the current folder, parses and serves diagrams in a local web server.\
Any change in the sources triggers a hot update in the browser.

> **Tip:**\
> You can use `likec4 start [path]` in a separate terminal window and keep it running while you're editing diagrams in editor, or even serve multiple projects at once.

### Build static website

Build a single HTML with diagrams, ready to be embedded into your website:

```sh
likec4 build -o ./dist
```

Demo - [https://template.likec4.dev](https://template.likec4.dev/view/boutique/)

> **Tip:**\
> [likec4/template](https://github.com/likec4/template) repository demonstrates how to deploy to github pages.

### Generate React components

```sh
likec4 codegen react --outfile ./src/likec4.generated.tsx
```

[📖 Read documentation](https://likec4.dev/tooling/code-generation/react/)

### Export to PNG

```sh
likec4 export png -o ./assets
```

This command starts the local web server and uses Playwright to take screenshots.\
If you plan to use it on CI, refer to [Playwright documentation](https://playwright.dev/docs/ci) for details.

### Export to Mermaid, Dot, D2, PlantUml

Export to various formats via codegen:

```sh
likec4 codegen mmd
likec4 codegen mermaid
likec4 codegen dot
likec4 codegen d2
likec4 codegen plantuml
```

[📖 Read documentation](https://likec4.dev/tooling/cli/) for other CLI usage

### MCP Server

Start MCP server with `stdio` transpor:

```sh
likec4 mcp
# or
likec4 mcp --stdio
```

Start MCP server with `http` transport on port 33335:

```sh
likec4 mcp --http
```

Start MCP server with `http` transport on port 1234:

```sh
likec4 mcp -p 1234
```

[📖 Read documentation](https://likec4.dev/tooling/mcp/) for MCP usage

## Vite Plugin

LikeC4 Vite Plugin allows you to embed views from your LikeC4 model into your Vite-based application.\
The plugin will automatically generate the necessary code to render the views.

Add LikeC4 plugin to the Vite config:

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { LikeC4VitePlugin } from 'likec4/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    LikeC4VitePlugin(),
  ],
})
```

Use the `LikeC4View` component in your application:

```tsx
import { LikeC4View } from 'likec4:react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LikeC4View viewId="index" />
  </StrictMode>,
)
```

[📖 Read documentation](https://likec4.dev/tooling/vite-plugin/) for Vite piugin usage

## API Usage

You can access and traverse your architecture model programmatically using the LikeC4 API.

### From workspace

Recursively searches and parses source files from the given workspace directory:

```ts
import { LikeC4 } from 'likec4'

const likec4 = await LikeC4.fromWorkspace('path to workspace', opts)
```

### From source

Parses the model from the string:

```ts
import { LikeC4 } from 'likec4'

const likec4 = await LikeC4.fromSource(
  `
  specification {
    element system
    element user
  }
  model {
    customer = user 'Customer'
    cloud = system 'System'
  }
  views {
    view index {
      include *
    }
  }`,
  opts,
)
```

### Example

When the model is initialized, you can use the following methods to query and traverse it.

```ts
import { LikeC4 } from 'likec4'

const likec4 = await LikeC4.fromSource(`....`)

// Validation errors
console.log(likec4.getErrors())

// Traverse the model
const model = likec4.model()
model
  .element('cloud.backend.api')
  .incoming() // relationships incoming to the element
  .filter(r => r.tags.includes('http')) // filter by tags
  .map(r => r.source) // get source elements

// Layouted views
const diagrams = await likec4.diagrams()
```

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
