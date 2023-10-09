# @likec4/diagrams development workspace

This is a project for fast development of `@likec4/diagrams`.  
It uses aliases to link the sources of `@likec4/core` and `@likec4/diagrams`, so you can edit the sources and see the changes in this workspace (HMR).

If you change other packages (like `@likec4/language-server` or `@likec4/layouts`), you need to run `yarn build:turbo` to rebuild them and see the changes.

## Tasks

- `yarn generate`: Parse `*.c4` in [src/likec4](./src/likec4/) and generate typed views data for stories
- `yarn build:turbo`: Same as `generate`, but ensure that all dependencies are built first.
- `yarn dev`: Start dev server with HMR

## Scripts

[](./.scripts/generate-theme-likec4.mjs)
