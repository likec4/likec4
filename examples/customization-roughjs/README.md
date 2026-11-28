# Customization: Rough.js shapes

LikeC4 application where element shapes are replaced with hand-drawn ones, sketched by [Rough.js](https://roughjs.com/).

> [!NOTE]
> The app config and the customization file are experimental.

## How it works

- [`likec4.app.config.ts`](./likec4.app.config.ts) is picked up by `likec4 start` and `likec4 build`. It points to the customization file.
- [`likec4.customization.tsx`](./likec4.customization.tsx) overrides three slots with `createCustomization` and `customizeComponents`:
  - `ElementShape` is wrapped: persons keep the built-in shape, other elements are drawn by Rough.js. Nodes stay the default ones, only the shape is drawn differently, everywhere it is shown.
  - `Logo` is replaced with a text logo.
  - `LikeC4Diagram` is wrapped to change its defaults: the cross background, the sequence variant of dynamic views, and no "open source" action.
- [`RoughShape.tsx`](./RoughShape.tsx) draws the shapes: a silhouette for every LikeC4 shape, filled, hatched and outlined by Rough.js. Colors are taken from the CSS variables of the node, so themes and element colors keep working. The slot is rendered for every node, so the sketch is memoized.

Packages imported by the customization file (`roughjs` here) are resolved from `node_modules` next to it. `react` and `likec4/react` are always provided by LikeC4.

## Run

From the repository root:

```sh
pnpm install
pnpm build --filter likec4
```

Then in this folder:

```sh
pnpm start       # dev server, the customization file is hot-reloaded
pnpm build:site  # static website in ./dist
```

## Run from sources

To work on LikeC4 itself with this example, start the app from sources, without building `likec4`.
In `packages/likec4-spa`:

```sh
pnpm dev:customization
```

It runs `pnpm dev` on all examples with this app config, so the customization applies to every project. The app, the diagram and the customization file are all hot-reloaded.
