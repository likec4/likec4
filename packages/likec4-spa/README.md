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

The build artifacts are copied to the [`likec4`](https://www.npmjs.com/package/likec4).
