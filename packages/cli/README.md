# LikeC4 CLI


This package provides a command line interface for [LikeC4](https://likec4.dev/).

Usage: `likec4 [options] [command]`

Options:
 * `-h`, `--help` &mdash; display help for command

Commands:
 * `codegen` &mdash; generates various artifacts from likec4 sources
 * `export` &mdash; export views to png
 * `help [command]` &mdash; display help for command

## Install

```bash
npm install --save-dev @likec4/cli
```

## Export

Usage: `likec4 export [sourcedir]`

```bash
$ likec4 export -o ./views-png ./likec4-sources

export likec4 views to png

Arguments:
  sourcedir                 directory with likec4 sources (default: ".")

Options:
  -o, --output <directory>  output directory
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
