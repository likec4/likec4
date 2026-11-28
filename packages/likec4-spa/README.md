# `@likec4/spa`

> [!WARNING]
> This package is intended for internal usage and not published to npm

This package contains the single-page application, that is provided/built by the `likec4` CLI.\
Kept separately to simplify the build process and maintain clear boundaries.

This package is the main entry point for local development:

```bash
# Install dependencies
pnpm install
pnpm turbo run generate

# Start the development server with hot-reload
pnpm dev
```

`pnpm dev` takes the same app config as `likec4 start` (`likec4.app.config.*` in the workspace):

```bash
pnpm dev [dir]                     # workspace, ../../examples by default
pnpm dev [dir] --project a,b       # limit to these projects
pnpm dev [dir] --app-config <file> # app config from another place
pnpm dev [dir] --customization <file>
```

Shortcuts:

- `pnpm dev:single-project` – `examples/cloud-system`, a single project
- `pnpm dev:customization` – all examples with the app config and the UI customization (`createCustomization`) of [`examples/customization-roughjs`](../../examples/customization-roughjs), hot-reloaded
- `pnpm dev:e2e` – the workspace of e2e tests

The build artifacts are copied to the [`likec4`](https://www.npmjs.com/package/likec4).

Additional routes:

- [http://localhost:5173/codegen/react.html](http://localhost:5173/codegen/react.html)
  - To test react component (that one is generated from `likec4 gen`)
- [http://localhost:5173/codegen/webcomponent.html](http://localhost:5173/codegen/webcomponent.html)
  - To test web component (that one is generated from `likec4 gen`)
