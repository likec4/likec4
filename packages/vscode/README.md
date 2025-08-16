# Architecture as a code

Visualize, collaborate on, and evolve your software architecture with always up-to-date, live diagrams generated from your code.

[docs](https://likec4.dev/) - [playground](https://playground.likec4.dev/) - [demo](https://template.likec4.dev/view/index)

<a href="https://www.npmjs.com/package/likec4" target="_blank"> ![NPM Version](https://img.shields.io/npm/v/likec4) </a>
<a href="https://www.npmjs.com/package/likec4" target="_blank">![NPM Downloads](https://img.shields.io/npm/dm/likec4)</a>
<a href="https://marketplace.visualstudio.com/items?itemName=likec4.likec4-vscode" target="_blank">![VSCode Installs](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/likec4.likec4-vscode?label=vscode%20installs)</a>
<a href="https://open-vsx.org/extension/likec4/likec4-vscode" target="_blank">![Open VSX Installs](https://img.shields.io/open-vsx/dt/likec4/likec4-vscode?label=open-vsx&color=%23A60EE5)</a>

![vscode extension](https://github.com/likec4/likec4/assets/824903/d6994540-55d1-4167-b66b-45056754cc29)

## What is LikeC4? Why "like"?

LikeC4 is a modeling language for describing software architecture, and tools to generate diagrams from the model.\
Inspired by [C4 Model](https://c4model.com/) and [Structurizr DSL](https://github.com/structurizr/dsl), but with some flexibility.

You define your own notation, custom element types and any number of nested levels in architecture model.\
Perfectly tailored to your needs.

## What does LikeC4 look like?

LikeC4 source:

<div align="center">
  <img src="https://github.com/likec4/.github/assets/824903/c0f22106-dba6-469e-ab47-85e7b8565513" width="675px">
</div>

Run CLI to preview:

```sh
npx likec4 start
```

And result:

<div align="center">
  <img src="https://github.com/likec4/likec4/assets/824903/27eabe54-7d97-47a8-a7e4-1bb44a8e03e5" width="984px">
</div>

Template repository - [likec4/template](https://github.com/likec4/template)\
Deployed - [https://template.likec4.dev](https://template.likec4.dev/view/index/)

Check the [Tutorial](https://likec4.dev/tutorial/) - a bit better overview of LikeC4.

---

The extension provides (via [language server protocol](https://microsoft.github.io/language-server-protocol)):

- Validation and error reporting
- Semantic syntax highlighting
- Live Previews
- Code completion and navigation
- Resolve references (like `find all references`, `go to definition` .. )
- "Safe" renames
- Hover information

Extension is universal and can run as web-version.\
Open [likec4/template](https://github.com/likec4/template) in the browser using any of:

- [github.dev](https://github.dev/likec4/template/blob/main/src/model.c4)
- [vscode.dev](https://vscode.dev/github/likec4/template/blob/main/src/model.c4)

## Getting help

We are always happy to help you get started:

- [Join Discord community](https://discord.gg/86ZSpjKAdA) – it is the easiest way to get help
- [GitHub Discussions](https://github.com/likec4/likec4/discussions) – ask anything about the project or give feedback
