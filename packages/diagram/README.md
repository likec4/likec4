# `@likec4/diagram`

A React component library for rendering software architecture diagrams.\
Although you can use them directly, it is recommended to use [likec4](../likec4/) CLI to generate components from LikeC4 sources.

Install:

```bash
pnpm add @likec4/diagram
```

See:

- Docs - https://likec4.dev/tooling/react/
- Demo - https://template.likec4.dev/

Contents:

- [Model Provider](#model-provider)
- [Bundled Version](#bundled-version)
  - [LikeC4View](#likec4view)
  - [ReactLikeC4](#reactlikec4)
- [Library Version](#library-version)
  - [With Bundled Styles](#with-bundled-styles)
  - [With PandaCSS](#with-pandacss)
  - [Usage](#usage)
- [Customization](#customization)
  - [Node renderer](#custom-node-renderer)
  - [Styles](#custom-styles)

## Model Provider

Diagram requires instance of `LikeC4Model.Layouted` to render.\
You need to prepare it and wrap your diagram with`LikeC4ModelProvider` component.

See [📖 Documentation](https://likec4.dev/tooling/react/#likec4modelprovider) for examples.

## Bundled version

The easiest way to use this package is the bundled version.\
Diagram renders inside shadow DOM and has its own styles.

### LikeC4View

```tsx
import { LikeC4ModelProvider, LikeC4View } from '@likec4/diagram/bundle'
/**
 * See https://likec4.dev/tooling/react/#likec4modelprovider
 */
import { likec4model } from './likec4-model.ts'

function App() {
  return (
    <LikeC4ModelProvider model={likec4model}>
      <LikeC4View
        viewId="index1"
        onNodeClick={(nodeId) => console.log(nodeId)}
      />

      <LikeC4View viewId="index2" />
    </LikeC4ModelProvider>
  )
}
```

See [LikeC4ViewProps](../src/bundle/LikeC4View.props.ts) for available props.

You may need to import icons, if you use built-in node renderers.

```tsx
import { type ElementIconRenderer, LikeC4, LikeC4ModelProvider, LikeC4View } from '@likec4/diagram/bundle'
import { lazy, Suspense } from 'react'

// Better to lazy load icons, bundle is quite large at the moment
const Icon = lazy(() => import('@likec4/icons/all').then((m) => ({ default: m.IconRenderer })))

const IconRenderer: ElementIconRenderer = (props) => {
  return (
    <Suspense>
      <Icon {...props} />
    </Suspense>
  )
}

function App() {
  return (
    <LikeC4ModelProvider model={likec4model}>
      <LikeC4View
        viewId="index1"
        renderIcon={IconRenderer}
      />
    </LikeC4ModelProvider>
  )
}
```

### ReactLikeC4

`LikeC4View` renders views from your model, and allows exploring in the popup browser.
Component works in most usecases, but if you need more - use `ReactLikeC4`:

```tsx
import { ReactLikeC4, LikeC4ModelProvider } from '@likec4/diagram/bundle'

function App() {
  const [viewId, setViewId] = useState('index')
  return (
    <LikeC4ModelProvider model={likec4model}>
      <ReactLikeC4
        viewId={viewId}
        pannable
        zoomable={false}
        keepAspectRatio
        showNavigationButtons
        enableDynamicViewWalkthrough={false}
        enableElementDetails
        enableRelationshipDetails
        showDiagramTitle={false}
        onNavigateTo={setViewId}
        onNodeClick={...}
      />
    </LikeC4ModelProvider>
  )
}
```

### `likec4/react`

Package `likec4/react` re-exports everything from Bundled version.\
It also re-exports `likec4/icons/all`.

## Library version

If you want to use package as a library, you have to install dependencies and prepare CSS.

Library uses [Mantine](https://mantine.dev). If you already use it and have `MantineProvider` on the scope - LikeC4Diagram will use it. Otherwise, it will wrap itself with `MantineProvider`.

Even if you are not planning to use Mantine in your app, its styles are required for the diagrams to work (don't worry, Mantine is tree-shakable).

Here are the options:

### With bundled styles

1. Complete styles

   ```css
   @import '@likec4/diagram/styles.css'
   ```

   This includes all styles, including [Mantine](https://mantine.dev) styles.

2. If you are using Mantine

   ```css
   @layer reset, base, mantine, xyflow, tokens, recipes, utilities;
   @import "@mantine/core/styles.layer.css";
   @import "@likec4/diagram/styles-min.css";
   ```

   > [!IMPORTANT]
   > Layers order is important.

3. Font.\
   LikeC4Diagram uses [`IBM Plex Sans`](https://fontsource.org/fonts/ibm-plex-sans) by default.\
   You can import it from [fontsource](https://fontsource.org/fonts/ibm-plex-sans) or any other CDN, bundle, or import:

   ```css
   @import '@likec4/diagram/styles-font.css'
   ```

   > [!NOTE]
   > This stylesheet loads font from FontSource

### With PandaCSS

```bash
pnpm add @likec4/styles
```

Configure your `panda.config.ts`:

```ts
import likec4preset from '@likec4/styles/preset'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: [
    'src/**/*.{ts,tsx}',
    // Include likec4 diagram source code to get the styles
    './node_modules/@likec4/diagram/panda.buildinfo.json',
  ],
  importMap: [
    '@likec4/styles',
  ],
  presets: [
    likec4preset,
  ],
  theme: {
    extend: {
      // Here you can override/extend the theme
    },
  },
})
```

You global CSS should look like this:

```css
@layer reset, base, mantine, xyflow, tokens, recipes, utilities;
@import "@mantine/core/styles.layer.css";
@import "@likec4/diagram/styles-xyflow.css";
@import "@likec4/diagram/styles-font.css";
```

Check [PandaCSS](https://panda-css.com) docs for full setup instructions.

### Usage

Same as [ReactLikeC4](#reactlikec4), but import from `@likec4/diagram`:

```tsx
import { LikeC4Diagram } from '@likec4/diagram'

function App() {
  const [viewId, setViewId] = useState('index')
  // Get instance of view
  const view = likec4model.view(viewId).$view
  return (
    <LikeC4Diagram
      view={view} 
      pannable
      zoomable={false}
      keepAspectRatio
      showNavigationButtons
      enableDynamicViewWalkthrough={false}
      enableElementDetails
      enableRelationshipDetails
      showDiagramTitle={false}
      onNavigateTo={setViewId}
      onNodeClick={...}
    />
  )
}
```

You can render any component inside `LikeC4Diagram`:

```tsx
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { Panel, ViewportPortal } from '@xyflow/react'

function App() {
  return (
    <LikeC4Diagram>
      <YourComponent />

      {/* You can use components from xyflow  */}
      <Panel position="top">
        <p>Your component as a panel</p>
        <a href="https://reactflow.dev/examples">Check examples</a>
      </Panel>

      <ViewportPortal>
        <div
          style={{
            transform: 'translate(100px, 100px)',
            position: 'absolute',
          }}>
          This div is positioned at [100, 100] on the diagram canvas
        </div>
      </ViewportPortal>
    </LikeC4Diagram>
  )
}
```

## Customization

### Custom node renderer

LikeC4Diagram can use custom node renderers.\
Compose custom nodes renderers using primitives from `@likec4/diagram/custom` (or `@likec4/diagram/bundle/custom` for the bundled version).\
See [customNodes.tsx](./src/custom/customNodes.tsx) for examples.

```tsx
import { LikeC4Diagram } from '@likec4/diagram'
import {
  ElementActions,
  ElementDetailsButtonWithHandler,
  elementNode,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
  ElementToolbar,
  IfNotReadOnly,
} from '@likec4/diagram/custom'
import { IconPlus } from '@tabler/icons-react'

const renderNodes = {
  element: elementNode(({ nodeProps, nodeModel }) => (
    <ElementNodeContainer nodeProps={nodeProps}>
      <ElementShape {...nodeProps} />
      <ElementTitle {...nodeProps} />
      <ElementActions
        {...nodeProps}
        extraButtons={[
          {
            key: 'plus',
            icon: <IconPlus />,
            onClick: () => console.log('extra'),
          },
        ]}
      />
      <div style={{ position: 'absolute', bottom: 0 }}>
        {nodeModel.element.getMetadata('your-attr')}
      </div>
    </ElementNodeContainer>
  )),
}

function App() {
  return (
    <LikeC4Diagram
      view={view}
      renderNodes={renderNodes}
    />
  )
}
```

> [!IMPORTANT]
> Try to keep node renderers referentially stable.

### Custom styles

LikeC4Diagram uses [PandaCSS](https://panda-css.com) for styling. You can use it to customize the styles.

TODO: add example

## Local Development

Use [packages/likec4](../likec4/) workspace

## Getting help

We are always happy to help you get started:

- [Join Discord community](https://discord.gg/86ZSpjKAdA) – it is the easiest way to get help
- [GitHub Discussions](https://github.com/likec4/likec4/discussions) – ask anything about the project or give feedback

## Contributors

<a href="https://github.com/likec4/likec4/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=likec4/likec4" />
</a>

[Become a contributor](../../CONTRIBUTING.md)

## Support development

LikeC4 is a MIT-licensed open source project with its ongoing development made possible entirely by your support.\
If you like the project, please consider contributing financially to help grow and improve it.\
You can support us via [OpenCollective](https://opencollective.com/likec4) or [GitHub Sponsors](https://github.com/sponsors/likec4).

## License

This project is released under the [MIT License](LICENSE)
