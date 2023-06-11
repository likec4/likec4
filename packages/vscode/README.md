<div align="center">
  <h3>
    Architecture as a code
  </h3>
  <p>
    Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code
  </p>
  <p>
    <a href="https://likec4.dev/docs/">docs</a> |
    <a href="https://likec4.dev/playground/">playground</a> |
    <a href="https://likec4.dev/examples/bigbank/likec4/">example</a>
  </p>

  ![vscode extension](https://github.com/likec4/likec4/assets/824903/d6994540-55d1-4167-b66b-45056754cc29)

</div>

## What is LikeC4? Why "like"?

LikeC4 is a modeling language for describing software architecture, and tools to generate diagrams from the model.  

LikeC4 is inspired by [C4 Model](https://c4model.com/) and [Structurizr DSL](https://github.com/structurizr/dsl), but provides some flexibility.
You customize or define your own notation, element types, and any number of nested levels in architecture model.  
Perfectly tailored to your needs.

## What does LikeC4 look like?

LikeC4 source ([full source on github](https://github.com/likec4/likec4/blob/develop/docs/likec4/index-page/index-page.c4)):

<div align="center">
  <img src="https://github.com/likec4/.github/assets/824903/feb8a707-4556-4628-a083-29e2559f75d7" width="705px">
</div>

CLI to generate react components (or export to other format):

```sh
likec4 codegen react -o likec4-generated.tsx
```

Website:

```tsx
import { LikeC4View } from "$/likec4-generated"

// ...

<LikeC4View viewId="index"/>
```

And this is rendered:

<div align="center">
  <img src="https://github.com/likec4/.github/assets/824903/954093f2-c164-4aa9-9ba6-3627206eeb4e" width="1048px">
</div>

Check the [Tutorial](https://likec4.dev/docs/#tutorial) - a bit better overview of LikeC4.

---

The extension provides (via [language server protocol](https://microsoft.github.io/language-server-protocol)):

- Validation and error reporting
- Semantic syntax highlighting
- Live Previews
- Code completion and navigation
- Resolve references (like `find all references`, `go to definition` .. )
- "Safe" renames
- Hover information

Extension is universal and can run as web-version.  
Open [example-cloud-system](https://github.dev/likec4/example-cloud-system) in the browser using any of:

- [github.dev](https://github.dev/likec4/example-cloud-system/blob/main/model.c4)
- [vscode.dev](https://vscode.dev/github/likec4/example-cloud-system/blob/main/model.c4)
