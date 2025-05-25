# `@likec4/styles

Shared utilities for [PandaCSS](https://panda-css.com/)

## Usage

```bash
pnpm add -D @likec4/styles @pandacss/dev
```

Configure your `panda.config.ts`:

```ts
import likec4preset from '@likec4/styles/preset'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  importMap: '@likec4/styles',
  presets: [
    likec4preset,
  ],
  jsxFramework: 'react',
  include: [
    './src/**/*.{js,jsx,ts,tsx}',
    // TODO: will be replaced with ship info
    '../diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
})
```

TODO: configure PostCSS or use cli

Vite config:

```ts
import pandaCss from '@pandacss/dev/postcss'

//...
  css: {
    postcss: {
      plugins: [
        pandaCss(),
      ],
    },
  },
```
