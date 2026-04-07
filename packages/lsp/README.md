# `@likec4/lsp`

Standalone [LikeC4](https://likec4.dev) Language Server for third-party editor integrations.

Self-contained, fully-bundled CommonJS binary with **zero runtime dependencies**.
Works with Neovim, Zed, JetBrains, Helix, and any editor that supports LSP.

[Documentation](https://likec4.dev/tooling/editors/)

## Installation

```sh
npm install -g @likec4/lsp
```

## Usage

The `likec4-lsp` binary auto-detects transport from command-line arguments:

```sh
likec4-lsp --stdio
likec4-lsp --node-ipc
likec4-lsp --socket=<port>
likec4-lsp --pipe=<name>
```

### Neovim

With [likec4.nvim](https://github.com/likec4/likec4.nvim):

```lua
{
  'likec4/likec4.nvim',
  build = 'npm install -g @likec4/lsp'
}
```

### Emacs

Use with [lsp-mode](https://emacs-lsp.github.io/lsp-mode/) or [eglot](https://github.com/joaotavora/eglot):

```elisp
;; eglot
(add-to-list 'eglot-server-programs
             '((likec4-mode) . ("likec4-lsp" "--stdio")))
```

See [#2268](https://github.com/likec4/likec4/issues/2268) for discussion on Emacs support.

### Zed

See [zed-likec4](https://github.com/Lenivvenil/zed-likec4).

## Programmatic API

```javascript
const { startStandaloneLsp } = require('@likec4/lsp')

startStandaloneLsp({
  loggerOptions: {
    logLevel: 'debug',
  },
})
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
