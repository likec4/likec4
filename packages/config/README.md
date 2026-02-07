# `@likec4/config`

<a href="https://www.npmjs.com/package/%40likec4%2Fconfig" target="_blank">![NPM Version](https://img.shields.io/npm/v/%40likec4%2Fconfig)</a>
<a href="https://www.npmjs.com/package/%40likec4%2Fconfig" target="_blank">![NPM Downloads](https://img.shields.io/npm/dm/%40likec4%2Fconfig)</a>

Configuration utilities and schema for LikeC4 projects.

Provides:

- Project config schema (Zod) and JSON Schema for editors
- Helpers to define TypeScript configs and reusable generators
- Runtime parsers/validators for JSON/JSON5 configs
- Node helper to load config files from disk
- Filename predicates to detect config files

Docs – https://likec4.dev/

## Install

```bash
pnpm add -D @likec4/config
```

## Recognized filenames

These are treated as LikeC4 project configuration files:

- `.likec4rc`
- `.likec4.config.json`
- `likec4.config.json`
- `likec4.config.js`
- `likec4.config.mjs`
- `likec4.config.ts`
- `likec4.config.mts`

See `ConfigFilenames` in `@likec4/config` and helpers `isLikeC4Config(...)`, `isLikeC4JsonConfig(...)`, `isLikeC4NonJsonConfig(...)`.

## Quick start

### JSON/JSON5 config (e.g. `.likec4rc`)

```json5
{
  // optional: reference JSON Schema for editor validation
  "$schema": "node_modules/@likec4/config/schema.json",
  "name": "my-project",
  "title": "My Project",
  "exclude": ["**/node_modules/**", "**/.cache/**"]
}
```

### TypeScript/JavaScript Config

You can define a config using TypeScript or JavaScript. The config file can be any of the following:

- `likec4.config.js`
- `likec4.config.mjs`
- `likec4.config.ts`
- `likec4.config.mts`

These config files allow you to define custom generators:

```ts
import { defineConfig } from '@likec4/config'

export default defineConfig({
  name: 'my-project',
  title: 'My Project',
  generators: {
    'hello': async ({ likec4model, ctx }) => {
      for (const view of likec4model.views()) {
        // resolve folder containing the source file of the view
        const { folder } = ctx.locate(view)
        // write view to a JSON file
        await ctx.write({
          path: [folder, 'views', `${view.id}.json`],
          content: JSON.stringify(view.$view),
        })
      }
    },
  },
})
```

You can run your generator via CLI:

```bash
likec4 gen hello
```

In multi-project workspace use:

```bash
likec4 gen hello --project my-project
# Other options
likec4 gen hello --project my-project --use-dot
```

There is also helper function `defineGenerators` to define reusable generators:

```ts
// shared_generators.ts
import { defineGenerators } from '@likec4/config'

export default defineGenerators({
  'hello': async ({ likec4model, ctx }) => {
    await ctx.write({
      path: 'hello.txt', // relative to the project root
      content: `Project: ${likec4model.project.id}`,
    })
  },
})

// likec4.config.ts
import { defineConfig } from '@likec4/config'
import generators from './shared_generators'

export default defineConfig({
  name: 'my-project',
  title: 'My Project',
  generators,
})
```

## Programmatic usage

### Validate/parse JSON config

```ts
import { validateProjectConfig } from '@likec4/config'

const json = `
{
  name: "my-project" // JSON5 is supported
}
`
const cfg = validateProjectConfig(json)
// or
const cfg2 = validateProjectConfig({ name: 'my-project' })
```

### Load config from TypeScript/JavaScript

Available only in Node.js via `@likec4/config/node`:

```ts
import { loadConfig } from '@likec4/config/node'
import { URI } from 'vscode-uri'

const uri = URI.file('/path/to/likec4.config.ts')
const project = await loadConfig(uri)
```

### Detect config filenames

```ts
import { ConfigFilenames, isLikeC4Config, isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '@likec4/config'

for (const name of ConfigFilenames) {
  if (!isLikeC4Config(name)) {
    // handle other files
  }
  if (isLikeC4JsonConfig(name)) {
    // handle JSON config
  }
  if (isLikeC4NonJsonConfig(name)) {
    // handle TS/JS config
  }
}
```

## JSON Schema

The JSON Schema is published at `@likec4/config/schema.json` and mirrors the Zod schema.
For JSON configs you can use `extends` to reuse `styles` from other JSON configs.
Only `styles` are merged (in order), other fields come from the root config.

Fields:

- `name` (required): unique project id within the workspace
- `title` (optional): human-readable project title
- `contactPerson` (optional): maintainer/author
- `extends` (optional): string or array of strings, paths to JSON configs to merge `styles` from (relative to each config file)
- `styles` (optional): theme/defaults/customCss customization
- `exclude` (optional): array of glob patterns (picomatch) to exclude (defaults to `['**/node_modules/**']`)

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
