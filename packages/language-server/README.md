# `@likec4/language-server`

[docs](https://likec4.dev/) | [playground](https://playground.likec4.dev/) | [demo](https://template.likec4.dev/view/index/)

Language Server Protocol (LSP) based on [languim](https://github.com/languim/languim) library.

## Usage

```bash
npm install -g @likec4/language-server
likec4-language-server --stdio
```

Valid arguments:
- `--node-ipc`
- `--stdio`
- `--socket={number}`

### Usage in code

```js
import { startLanguageServer } from '@likec4/language-server/bundled';
startLanguageServer().catch((e) => {
  console.error(e)
  process.exit(1)
})
```
