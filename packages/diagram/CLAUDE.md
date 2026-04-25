# Agent Instructions

## Subdirectory layering

Imports flow upward only — never have a lower layer import from a higher one.

- `base/` — ReactFlow foundation (types, constants, `BaseXYFlow`). No business logic.
- `base-primitives/` — concrete Element / Compound / Edge / Markdown components built on `base/`. New diagram building blocks go here.
- `custom/` — re-export façade for custom renderer projects. Add re-exports only; do not put original logic here.
- `overlays/`, `navigationpanel/`, `search/`, `projects-overview/` — sibling stateful features. Each owns its own XState actor.
- `likec4diagram/` — top-level diagram engine. Hosts the main machine (`state/machine.ts`) and embeds the editor as a child actor when editing is enabled.
- `editor/` — orthogonal feature, injected into `likec4diagram/` via an actor reference. Do not nest it inside `likec4diagram/`, and do not import from `likec4diagram/` here.
- `adhoc-editor/` — separate code path with its own machine. Intentionally not re-exported from `src/index.ts`.
- `bundle/` — passthrough re-export for the `@likec4/react` web-component build. Do not add code here; keep it a thin re-export of `src/index.ts`.
- `context/`, `hooks/`, `components/`, `shadowroot/`, `utils/` — utility layers used by everything above.

When adding a new feature, default to a sibling folder under `src/` with its own actor; promote into `likec4diagram/` only if it must coordinate with the main machine.

## State management

XState is the convention here.

- **XState machines** — default choice for any coordinated or persistent state. File pattern: `actor.ts` / `*Actor.ts` / `state/machine.ts`.
- **`@xstate/store`** — only for ephemeral UI state inside a single feature. Currently used only by `adhoc-editor/state/panel.tsx`; do not introduce it elsewhere without a clear reason.
- **`nanostores`** — reserved for ambient reactive concerns (media queries, container size). Do not use it for feature/model state — that lives in `@likec4/spa`.
- **`useState` / `useReducer`** — transient UI only (hover, focus, form inputs).

## Public API

- `src/index.ts` is the public API. `adhoc-editor/` is intentionally internal.
- `bundle/index.ts` must mirror `src/index.ts` exactly — it's the entry for the `@likec4/react` web-component build.

## Don't break the App ↔ Language Server contract

This package defines the consumer contract via `LikeC4ModelProvider` and `useLikeC4Model`-style hooks. Do not import Vite virtual modules (`likec4:*`) or call the language server from here — that wiring belongs in `packages/likec4-spa` and `packages/vite-plugin`.
