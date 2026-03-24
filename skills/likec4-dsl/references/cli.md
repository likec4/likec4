# CLI Reference

The `likec4` CLI (`npx likec4`) provides commands beyond validation:

## `serve` (aliases: `start`, `dev`)

Start local dev server with live reload to preview diagrams.

```bash
npx likec4 serve [path]
npx likec4 serve --port 3000 ./src/likec4
npx likec4 serve --use-hash-history --base /docs/
```

Key options: `--port` (default 5173), `--listen` (default 127.0.0.1), `--base` (base URL), `--title`, `--use-hash-history`, `--webcomponent-prefix` (default "likec4")

## `build` (alias: `bundle`)

Build a static website for deployment.

```bash
npx likec4 build -o ./dist [path]
npx likec4 build --output-single-file -o ./dist   # single self-contained HTML
```

Key options: `--output` (`-o`), `--base`, `--title`, `--use-hash-history`, `--webcomponent-prefix`, `--output-single-file`

## `export`

Export diagrams to various formats.

```bash
# PNG (requires Playwright)
npx likec4 export png -o ./images [path]
npx likec4 export png --theme dark --flat -f "overview*" -o ./images

# JSON model
npx likec4 export json -o model.json --pretty --skip-layout

# DrawIO
npx likec4 export drawio --all-in-one -o ./diagrams
```

**export png** options: `--outdir` (`-o`), `--theme` [light|dark], `--flat`, `--filter` (`-f`, glob patterns), `--seq` (sequence layout for dynamic views), `--timeout` (default 15s)
**export json** options: `--outfile` (`-o`, default "likec4.json"), `--pretty`, `--skip-layout`
**export drawio** options: `--outdir` (`-o`), `--all-in-one`, `--roundtrip`, `--uncompressed`, `--profile` [default|leanix]

## `codegen` (aliases: `gen`, `generate`)

Generate code artifacts from the model.

```bash
# TypeScript model (typed, with all views and elements)
npx likec4 gen model -o likec4-model.ts [path]

# React component
npx likec4 gen react -o dist/likec4-views.mjs [path]

# Web component JS bundle
npx likec4 gen webcomponent -o likec4.js -w c4 [path]

# Diagram formats
npx likec4 gen mermaid -o ./out      # .mmd files
npx likec4 gen plantuml -o ./out     # .puml files
npx likec4 gen d2 -o ./out           # .d2 files
npx likec4 gen dot -o ./out          # .dot files (Graphviz)
```

Shared options: `--outfile`/`--outdir` (`-o`), `--project` (`-p`), `--use-dot`

## `mcp`

Start MCP (Model Context Protocol) server for AI tool integration.

```bash
npx likec4 mcp [path]                # stdio transport (default)
npx likec4 mcp --http [path]         # HTTP transport on port 33335
npx likec4 mcp -p 1234 [path]        # HTTP transport on custom port
```

Options: `--stdio` (default), `--http`, `--port` (`-p`, default 33335), `--use-dot`

## `format`

Format LikeC4 source files in-place.

```bash
npx likec4 format [path]
```

## Global options (all commands)

`--log-level` [trace|debug|info|warning|error], `--verbose`, `--color`/`--no-color`, `--project` (`-p`)
