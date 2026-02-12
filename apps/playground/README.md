# `@likec4/playground`

Sources of [playground.likec4.dev](https://playground.likec4.dev/)

This is a Cloudflare Worker. `@cloudflare/vite-plugin` is used to run and build the app.  
For local development, you just use `pnpm dev`.

## Local Development

Playground uses pandacss for styling. You need to pregenerate:  

```sh
pnpx turbo run generate
```

The rest of the packages are not needed to be built upfront, as `sources` condition is used.

- Playground uses [XState](https://xstate.js.org/) for state management, machine is defined in [`src/state/playground-machine.ts`](./src/state/playground-machine.ts). 
- Playground starts [custom monaco-editor](https://github.com/TypeFox/monaco-languageclient)
  - It is very strict what versions can be used - see [compatibility table](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md)
  - Synchronization between LSP and XState is inside [`LanguageClientSync.tsx`](./src/monaco/LanguageClientSync.tsx), state machine knows nothing about LSP, communication is done via events.

## Troubleshooting

### "Client likec4: connection to server is erroring" / "Reader received error. Reason: unknown"

The LikeC4 language server runs in a Web Worker. If the connection fails:

1. **See the worker’s logs**  
   In Chrome/Edge: open DevTools (F12) → **Console** → use the **context** dropdown (default "top") and select the worker (e.g. `.../likec4...worker`). Errors prefixed with `[LikeC4 LSP worker]` or `[LikeC4 LSP]` show the cause.

2. **Regenerate and rebuild**  
   From the repo root:
   ```sh
   pnpm generate
   pnpm build
   ```
   Then restart the playground dev server and reload the page.

3. **If it still fails**  
   Try another browser or a private/incognito window (to rule out extensions). The diagram and editor still work; only LSP features (e.g. validation, go-to-definition) are affected.
