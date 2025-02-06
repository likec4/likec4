<div align="center">
  <h3>
    Architecture as a code
  </h3>
  <p>
    Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code
  </p>
  <p>
    <a href="https://likec4.dev/">docs</a> |
    <a href="https://playground.likec4.dev/">playground</a> |
    <a href="https://template.likec4.dev/view/index/">demo</a>
  </p>

![vscode extension](https://github.com/likec4/likec4/assets/824903/d6994540-55d1-4167-b66b-45056754cc29)

</div>

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
