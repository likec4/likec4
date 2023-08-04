# LikeC4 CLI

[docs](https://likec4.dev/docs/) | [example](https://likec4.dev/examples/bigbank/likec4/)

This package provides a command line interface for [LikeC4](https://likec4.dev/).

Usage: `likec4 [options] [command]`

Options:

- `-h`, `--help` &mdash; display help for command

Commands:

- `codegen` &mdash; generate various artifacts from likec4 sources
- `export` &mdash; export views to png
- `help [command]` &mdash; display help for command

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

## Export

Usage: `likec4 export [sourcedir]`

```bash
$ likec4 export -o ./generated/png ./likec4-sources

Usage: likec4 export [options] [workspace]

Export LikeC4 views to PNG, rendering in Headless Chrome

Arguments:
  workspace                 directory with likec4 sources (default: ".")

Options:
  -o, --output <directory>  output directory
                            if not defined, outputs to workspace
  -S, --script-cwd [path]   use current folder or path to run export scripts in.
                            Expects npm project with puppeteer installed.
                            If not defined, generates temporary one and installs puppeteer.
  -h, --help                display help for command
```

## Codegen

Usage: `likec4 codegen <target>`

### Codegen target: React

```bash
$ likec4 codegen react [options] [sourcedir]

generates react components to render likec4 views

Arguments:
  sourcedir            directory with likec4 sources (default: ".")

Options:
  -o, --output <file>  output file
  -h, --help           display help for command
```

### Codegen target: Views Data

```bash
$ likec4 codegen views-data [options] [sourcedir]

generates ts file with computed data of likec4 views

Arguments:
  sourcedir            directory with likec4 sources (default: ".")

Options:
  -o, --output <file>  output file
  -h, --help           display help for command
```

### Codegen target: DOT

```bash
$ likec4 codegen dot [options] [sourcedir]

generates graphviz dot files for each likec4 view

Arguments:
  sourcedir                 directory with likec4 sources (default: ".")

Options:
  -o, --output <directory>  output directory
  -h, --help                display help for command

```

### Codegen target: D2

```bash
$ likec4 codegen d2 [options] [sourcedir]

generates d2 files for each likec4 view

Arguments:
  sourcedir                 directory with likec4 sources (default: ".")

Options:
  -o, --output <directory>  output directory
  -h, --help                display help for command
```
