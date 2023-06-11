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

LikeC4 is inspired by [C4 Model](https://c4model.com/), but provides some flexibility.
You can define your own notation, element types, and any number of nested levels in your architecture model.
This allows you to create a perfectly tailored system design.

## What does LikeC4 look like?

LikeC4 source ([full source on github](https://github.com/likec4/likec4/blob/develop/docs/likec4/index-page/index-page.c4)):

![index-page-code-2](https://github.com/likec4/.github/assets/824903/7f92dde2-aba3-471f-ae75-4ba59012c25e)

CLI to generate react components (or export to other format):

```bash
likec4 codegen react -o likec4-generated.tsx
```

Website:

```jsx
import { LikeC4View } from "$/likec4-generated"

// ...

<LikeC4View viewId="index"/>
```

And this is rendered: 

![index-view](https://github.com/likec4/.github/assets/824903/7408651f-e7ee-4d12-881e-49a4284337cb)

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
