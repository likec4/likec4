# LikeC4 CLI

[docs](https://likec4.dev/docs/) | [example](https://likec4.dev/examples/bigbank/likec4/)

The `likec4` CLI is a tool for various operations and automation over LikeC4 projects, such as:

- Validate LikeC4 sources
- Export to PNG
- Generate Typescript with:
  - React components
  - Structured data

## Install

```bash
# globally
npm install -g @likec4/cli

# or as dev dependency
npm install --save-dev @likec4/cli
```

To use with `npx`:

```bash
npx @likec4/cli [command]
```

## Commands

```
likec4 help
```

```
Usage: likec4 [options] [command]

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  codegen                       code-generator
  export [options] [workspace]  export likec4 views to png
  help [command]                display help for command
```

### Codegen

Code-generator is the most essential part of the project. It allows to "materialize" you model to some other form, such as react components.

```
likec4 codegen react --out ./generated ./likec4
```

```
Usage: likec4 codegen [options] [command]

Generate various artifacts from LikeC4 sources

Options:
  -h, --help                        display help for command

Commands:
  react [options] [workspace]       generates react components
  views-data [options] [workspace]  dumps views data
  dot [options] [workspace]         generates graphviz dot files
  d2 [options] [workspace]          generates d2 files
  help [command]                    display help for command

Examples:
  likec4 codegen react -o ./src/likec4.generated.tsx ./src/likec4
  likec4 codegen views-data -o ./src/likec4-data.ts
  likec4 codegen dot
```

### Export

Basically, this command first generates react components, and then renders them in headless chrome with puppeteer.

```ansi
Usage: likec4 export [options] [workspace]

Export LikeC4 views to PNG, rendering in Headless Chrome with Puppeteer

Arguments:
  workspace                 directory with likec4 sources (default: ".")

Options:
  -t, --template <file>     custom HTML template file to render diagram
                            (default: built-in template)
  -o, --output <directory>  directory for generated png
                            (default: next to sources)
  -S, --script-cwd [path]   path to run export scripts
                            if not defined, creates temporary folder
  --keep-scripts            do not delete generated scripts
  --dry-run                 generate, but do not run export script
  -h, --help                display help for command

Examples:
  likec4 export -o ./output ./src/likec4
```

#### Custom template

You can use own custom HTML template to render diagram.  
You are free to design it as you wish, add watermarks, diagram title, any additional text or images.

Template must have two functions

- `calcRequiredViewport(diagram)` - will be called with diagram data, and should return object with width and height properties. This is used to set the viewport size for headless chrome
- `renderLikeC4View(diagram)` - will be called with diagram data to render it.

The built-in template:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
      html,
      body {
        width: 100%;
        height: 100%;
      }

      *,
      :before,
      :after {
        box-sizing: border-box;
        outline: none;
        border-width: 0;
        border-style: solid;
        border-color: transparent;
        padding: 0;
        margin: 0;
      }

      body {
        padding: 40px 50px 60px 50px;
      }

      #root {
        padding: 40px;
        background-color: #1c1c1c;
        border-radius: 8px;
        box-shadow: rgba(0, 0, 0, 0.4) 0px 16px 40px;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@18.2.0",
          "react-dom": "https://esm.sh/react-dom@18.2.0/client",
          "@likec4/diagrams": "https://esm.sh/@likec4/diagrams?bundle&pin=latest"
        }
      }
    </script>
    <script type="module">
      import React from 'react'
      import { createRoot } from 'react-dom'
      import { Diagram } from '@likec4/diagrams'

      /**
       * Should return the required viewport size for given diagram, in pixels.
       * taking into account the padding of the body and root elements.
       */
      window.calcRequiredViewport = diagram => {
        return {
          width: diagram.width + 180, // body padding 50+50 and root padding 40+40
          height: diagram.height + 180 // body padding 40+60 and root padding 40+40
        }
      }

      /**
       * Should render the diagram.
       * Maybe called multiple times with different diagrams,
       * make sure to unmount the previous diagram if any.
       */
      let root = null
      window.renderLikeC4View = diagram => {
        if (root) {
          root.unmount()
          root = null
        }
        root = createRoot(document.getElementById('root'))
        root.render(
          React.createElement(Diagram, {
            animate: false,
            zoomable: false,
            pannable: false,
            diagram: diagram,
            width: diagram.width,
            height: diagram.height,
            initialPosition: {
              x: 0,
              y: 0,
              scale: 1
            },
            padding: 0
          })
        )
      }
    </script>
  </body>
</html>
```

For debugging purposes, you can use `--keep-scripts` option to keep the generated script.
