# LikeC4

`likec4` is a CLI tool for various operations and automation over LikeC4 projects.

Features:

- preview diagrams in a local web server (with fast hot-reload on changes)
- build a static website for sharing and embedding diagrams
- export to PNG, Mermaid, Dot, D2
- generate React components

## Install

> **Compatibility Note:**  
> LikeC4 requires [Node.js](https://nodejs.org/en/) version 18+, 20+

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

> **Template:**  
> Check out the template repository [likec4/template](https://github.com/likec4/template)  
> with pre-configured CI for building and deploying to github pages.

To use the binary, you can call it with [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) while in the project directory:

```sh
npx likec4 ...
```

### Global installation

If you want to use it in any arbitrary project without [`npx`](https://docs.npmjs.com/cli/v10/commands/npx), install it globally:

```sh
npm install --global likec4
```

Then, you can call `likec4` directly:

```sh
likec4 ...
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
```

This recursively searchs for `*.c4`, `*.likec4` files in current folder, parses and serves diagrams in a local web server.

Any changes in the sources trigger a super-fast live-update of diagrams and you can see changes in the browser immediately.

> **Tip:**  
> You can use `likec4 serve [path to project]` in a separate terminal window and keep it running while you're editing diagrams in editor, or even serve multiple projects at once.

### Build static website

Build a single-page application with all diagrams:

```sh
likec4 build -o ./dist
```

There is a supplementary command to preview the build:

```sh
likec4 preview -o ./dist
```

> **Tip:**  
> [likec4/template](https://github.com/likec4/template) repository demonstrates how to use `likec4` CLI to build and deploy a static website to github pages.

### Export to PNG

```sh
likec4 export png -o ./assets
```

This command starts temporary local web server and uses [Playwright](https://playwright.dev/) to take screenshots of diagrams.

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

> Output file should have `.tsx` extension  
> By default, it generates `likec4.generated.tsx` in current directory

### Generate structured data

```sh
likec4 codegen views-data --outfile ./src/likec4.generated.ts
```

Aliases: `likec4 codegen ts`, `likec4 codegen views`

> Output file should have `.ts` extension  
> By default, it generates `likec4.generated.ts` in current directory

## Support

If there's a problem you're encountering or something you need help with, don't hesitate to take advantage of my [_Priority Support_ service](https://github.com/sponsors/davydkov) where you can ask me questions in an exclusive forum. I'm well equppied to assist you with this project and would be happy to help you out! 🙂
