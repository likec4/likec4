# `@likec4/styles

Shared preset and generated styles for [PandaCSS](https://panda-css.com/)

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
    // Include likec4 diagram source code to get the styles
    'node_modules/@likec4/diagram/panda.buildinfo.json',
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
