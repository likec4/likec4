# LikeC4

`likec4` is a CLI tool for various operations and automation over LikeC4 projects.

Features:

- Preview diagrams in a local web server (with lightning-fast updates) ⚡️
- Build a static .website (deploy to github pages, netlify...) 🔗
- Export to PNG, JSON, Mermaid, Dot, D2 (if you need something static) 🖼️
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

## Usage

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
Any changes in the sources trigger a super-fast hot update and you see changes in the browser immediately.

> **Tip:**\
> You can use `likec4 start [path]` in a separate terminal window and keep it running while you're editing diagrams in editor, or even serve multiple projects at once.

### Build static website

Build a single HTML with diagrams, ready to be embedded into your website:

```sh
likec4 build -o ./dist
```

Example [https://template.likec4.dev](https://template.likec4.dev/view/cloud)

When you deploy the website, you can use the "Share" button to get links.

> **Tip:**\
> [likec4/template](https://github.com/likec4/template) repository demonstrates how to deploy to github pages.

There is also a supplementary command to preview the build:

```sh
likec4 preview -o ./dist
```

For example, this command can be used on CI, to compare diagrams with ones from the previous/main build.

> **Tip:**\
> The website root is strictly bound to the given base path (`/` by default).
> If you need a relocatable bundle you may use `--base "./"`.

### Export to PNG

```sh
likec4 export png -o ./assets
```

This command starts the local web server and uses Playwright to take screenshots.\
If you plan to use it on CI, refer to [Playwright documentation](https://playwright.dev/docs/ci) for details.

### Export to JSON

```sh
likec4 export json -o dump.json
```

### Export to Mermaid, Dot, D2

Export to various formats via codegen:

```sh
likec4 codegen mmd
likec4 codegen mermaid
likec4 codegen dot
likec4 codegen d2
```

### Generate React components

```sh
likec4 codegen react --outfile ./src/likec4.generated.tsx
```

Check [documentation](https://likec4.dev/docs/tools/react/)

> Output file should have `.tsx` extension\
> By default, it generates `likec4.generated.tsx` in current directory

### Generate structured data

Generate a TypeScript file with `LikeC4Views` object, which contains all diagrams and their metadata.

```sh
likec4 codegen views-data --outfile ./src/likec4.generated.ts

#Aliases
likec4 codegen views ...
likec4 codegen ts ...
```

> Output file should have `.ts` extension\
> By default, it generates `likec4.generated.ts` in current directory

## API Usage

You can access and traverse your architecture model programmatically using the LikeC4 Model API.

### From workspace

Recursively searches and parses source files from the wokrkspace directory:

```ts
import { LikeC4 } from 'likec4'

const likec4 = await LikeC4.fromWorkspace('path to workspace', opts)
```  

### From source

Parses the model from the string:

```ts
import { LikeC4 } from "likec4"

const likec4 = await LikeC4.fromSource(`
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
  }
`, opts)
```

### Example

When the model is initialized, you can use the following methods to query and traverse it.

```ts
import { LikeC4 } from "likec4"

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

Check Typescript definitions for available methods.

## Development

In root workspace:

```sh
yarn install
yarn build

cd packages/likec4
yarn dev
```

## Support

If there's a problem you're encountering or something you need help with, don't hesitate to take advantage of my [_Priority Support_ service](https://github.com/sponsors/davydkov) where you can ask me questions in an exclusive forum. I'm well-equipped to assist you with this project and would be happy to help you out! 🙂
