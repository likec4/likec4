# Agent Instructions

This package is the data + RPC bridge between `@likec4/spa` (and other consumers) and `@likec4/language-services`. It owns the `likec4:*` virtual modules and the birpc channel over Vite HMR.

## Subdirectory layering

- `src/index.ts` — public plugin entry. Re-exports `LikeC4VitePlugin` and `LikeC4VitePluginOptions`. Keep the surface minimal.
- `src/plugin.ts` — plugin factory. Wires `resolveId` / `load` / `configureServer` / `handleHotUpdate` and registers the virtual-module list. New virtual modules must be added to its registration arrays.
- `src/internal.ts` — exported via the `./internal` subpath; consumed by **generated** virtual-module code (and by `packages/likec4`'s static-site build). Re-exports nanostores helpers and `createRpc` / `createHooksForModel`. Treat this as a stable contract — generated code in the wild depends on it.
- `src/virtuals/` — one file per virtual module. Each owns a single `likec4:*` id and its loader. Use `_shared.ts` helpers; do not cross-import between virtuals.
- `src/rpc/` — server-side birpc setup. `protocol.ts` is the typed contract, `rpc.ts` wires `enablePluginRPC` over `server.hot`, individual files (`updateView.ts`, `calcAdhocView.ts`) hold handlers.
- `src/modules.d.ts` — ambient TypeScript declarations for every `likec4:*` id. Required for IDE/type-check; published via the `./modules` subpath.

## Adding new functionality

- **New virtual module** → file in `src/virtuals/`, export a `VirtualModule` (or `ProjectVirtualModule`) with a unique `likec4:*` id and a `load()` returning generated code, register it in `src/plugin.ts`, declare its module type in `src/modules.d.ts`.
- **New RPC method** → add the signature to `src/rpc/protocol.ts` (single source of truth for both sides), implement the handler in `src/rpc/`, wire it into `createBirpc` in `src/rpc/rpc.ts`. The client wrapper in `src/virtuals/rpc.ts` picks up the new method automatically through the protocol type.
- **Naming** — all virtual ids use the `likec4:*` prefix; project-scoped ids include the project id (`likec4:model/{projectId}`).

## Boundaries

- Do not import from `@likec4/diagram` — this is a Vite/Node-side package, not a UI package.
- Imports from `@likec4/language-server` must be type-only. The runtime instance comes from `@likec4/language-services/node` (`fromWorkspace`) or via the `languageServices` plugin option.
- RPC is dev-only — generated code in `virtuals/rpc.ts` guards on `import.meta.hot`, and handlers are registered in `configureServer` only. Do not assume RPC is available in production builds; in build mode virtual modules are inlined as static JSON.
