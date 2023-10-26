# LikeC4

`likec4` is a CLI tool for various operations and automation over LikeC4 projects, such as:

1. LikeC4
   1. Install
      1. Local installation
      2. Global installation
   2. Usage
      1. Preview diagrams
      2. Build static website
      3. Export to PNG
      4. Export to Mermaid, Dot, D2
      5. Generate React components
      6. Generate structured data
   3. Support

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

### Preview diagrams

In a folder with LikeC4 sources:

```sh
likec4 serve
```

This will recursively search for `*.c4`, `*.likec4` files and serve them in a local web server.

Any changes to the sources will trigger a live-update of diagrams.

Refer to the help for more options:

```sh
likec4 serve --help
```

### Build static website

```sh
likec4 build -o ./dist
```

The output folder will contain a static website (single-page application).

### Export to PNG

...

### Export to Mermaid, Dot, D2

...

### Generate React components

...

### Generate structured data

...

## Support

If there's a problem you're encountering or something you need help with, don't hesitate to take advantage of my [_Priority Support_ service](https://github.com/sponsors/davydkov) where you can ask me questions in an exclusive forum. I'm well equppied to assist you with this project and would be happy to help you out! 🙂
