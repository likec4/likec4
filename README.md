<div align="center">
  <h1>
    Architecture as a code
  </h1>
  <h4>
    Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code
  </h4>
  
  [docs](https://likec4.dev/docs/) | [playground](https://likec4.dev/playground/) | [example](https://likec4.dev/examples/bigbank/likec4/)

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

<div align="center">
  <img width="700px" src="https://github.com/likec4/.github/assets/824903/7408651f-e7ee-4d12-881e-49a4284337cb"/>
  
</div>
