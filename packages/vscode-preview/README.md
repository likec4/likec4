# `@likec4/vscode-preview`

Private module used by vscode extension.\
Presents architecture diagrams in VSCode preview tab.

## Development

`pnpm dev` runs `pandacss codegen --clean` once before starting the parallel preview and Markdown watchers. If `panda.config.mjs` is modified while watchers are running, restart `pnpm dev` to regenerate `styled-system/`.
