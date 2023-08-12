# [0.33.0](https://github.com/likec4/likec4/compare/v0.32.0...v0.33.0) (2023-08-12)

### Breaking changes

> We do not change major version yet, as the project is in active development.

This release includes breaking changes in `@likec4/diagrams`: 

- **diagrams:** DiagramsBrowser  
  You've already seen this component working on the project website, but it was not back-ported to the npm-module
- **diagrams:** LikeC4 factory  
  Creates components, "bound" to your model, with type checks. It ensures that only existing views can be rendered.

With [`codegen`](https://www.likec4.dev/docs/tools/cli/#codegen) command, CLI generates structured data, like:

```ts
export const LikeC4Views = {
  indexLR: { 
    title: 'Landscape View'
    nodes: [/* ... */],
    edges: [/* ... */],
  },
  cloud: { 
    title: 'Overview of Cloud'
    nodes: [/* ... */],
    edges: [/* ... */],
  },
}
```

This data is used to draw views with `@likec4/diagrams` react component.

```tsx
import { LikeC4 } from '@likec4/diagrams'
import { LikeC4Views } from './generated-code'

// Creates components, bound to the data (with type checks).
// It ensures that only existing views can be rendered.
const { Diagram, Responsive, Embedded, Browser } = LikeC4.create(LikeC4Views)

export const IndexView = () => (
  <Embedded viewId={"indexLR"}/>
)
```

[Documentaion](https://www.likec4.dev/docs/tools/react/) (in progress)

### Features

- **core:** add color to DiagramLabel ([47b7579](https://github.com/likec4/likec4/commit/47b7579b2c65dd6ba12ce444ae3a05f36acdc83a))
- **core:** add in/out edges to ComputedNode ([0ddb07c](https://github.com/likec4/likec4/commit/0ddb07c6f173ab1affb46e7e53308e37dff1c6c7))
- **core:** available in ESM/CJS
- **diagrams:** available in ESM/CJS

### Bug Fixes

- **generators:** can't infer result type from export `./compute-view` ([#267](https://github.com/likec4/likec4/issues/267)) ([1945a97](https://github.com/likec4/likec4/commit/1945a97c5ecacf9a80d26966bd68ab8a20e4f832))
- **layouts:** disable graphviz.unflatten, requires research ([5379926](https://github.com/likec4/likec4/commit/537992601c2da925cb55f783ea7621970a431290))
- **deps:** pin esbuild to 0.17 ([3d6125d](https://github.com/likec4/likec4/commit/3d6125d2311737074be64ec2c5303390e77d4c66))
- **deps:** update dependency @hpcc-js/wasm to ^2.13.1 ([#254](https://github.com/likec4/likec4/issues/254)) ([3069dab](https://github.com/likec4/likec4/commit/3069dab249b11cfc79d8a22603202ca22d99f864))
- **deps:** update dependency jotai to ^2.2.3 ([#255](https://github.com/likec4/likec4/issues/255)) ([3179777](https://github.com/likec4/likec4/commit/3179777f20dcf564bf3f2d7e17877ae41089c3b9))
- **deps:** update linters to ^6.3.0 ([717770f](https://github.com/likec4/likec4/commit/717770f947ccd102e7e57ce0ff7b0a01f5f7a869))

# [0.32.0](https://github.com/likec4/likec4/compare/v0.31.0...v0.32.0) (2023-08-04)

### Features

- Element icons ([17413f4](https://github.com/likec4/likec4/commit/17413f416ff766800f4caaa2bdc27cc1a4e7ec8e)), closes [#65](https://github.com/likec4/likec4/issues/65)

### Bug Fixes

- **core:** more accurate computeElementView ([e57c7c4](https://github.com/likec4/likec4/commit/e57c7c4cd5df627f839887aafedca4fa98a0fda2))
- **deps:** update dependency class-variance-authority to ^0.7.0 ([dd2bf46](https://github.com/likec4/likec4/commit/dd2bf465c19999b396da7253a28e502364f640a3))
- **deps:** update dependency lucide-react to ^0.263.1 ([d232c26](https://github.com/likec4/likec4/commit/d232c26851787e6b393bbda20e73f7875eb77b97))
- **deps:** update dependency turbo to ^1.10.11 ([#227](https://github.com/likec4/likec4/issues/227)) ([599c230](https://github.com/likec4/likec4/commit/599c230b0ef0af4aa91fe9a5af377886e38edf84))
- **deps:** update linters ([a347385](https://github.com/likec4/likec4/commit/a347385819a4e4f05f49af6f9e200066eca49710))

# [0.31.0](https://github.com/likec4/likec4/compare/v0.30.0...v0.31.0) (2023-07-25)

### Features

- **core:** Add tags, description, links properties to View ([13edf4c](https://github.com/likec4/likec4/commit/13edf4c4da20328dfbc1ec449989040e16596ac7)), closes [#240](https://github.com/likec4/likec4/issues/240)
- **language-server:** Export element and view properties [#240](https://github.com/likec4/likec4/issues/240)

### Known issues

- Relative links are not resolved, follow-up [#244](https://github.com/likec4/likec4/issues/244)

### Bug Fixes

- **deps:** update commitlint monorepo to ^17.6.7 ([dd29487](https://github.com/likec4/likec4/commit/dd2948741c70e0abdfafcece37189cdea57523cf))
- **deps:** update dependency body-scroll-lock-upgrade to ^1.0.4 ([b2da23d](https://github.com/likec4/likec4/commit/b2da23d05ad1915d075dfdd9115711cbdd722557))
- **deps:** update dependency eslint to ^8.45.0 ([82efda1](https://github.com/likec4/likec4/commit/82efda1e7f22b83bc520f0e2dbfb1d91bc5fe1b1))
- **deps:** update dependency jotai to ^2.2.2 ([437a50f](https://github.com/likec4/likec4/commit/437a50fcb0cfca0df716105119a2e3412913f4fa))
- **deps:** update dependency lucide-react to ^0.262.0 ([97541cb](https://github.com/likec4/likec4/commit/97541cbcebbc87bed4996e8fb2addd7a824ff523))
- **deps:** update dependency remeda to ^1.24.0 ([f7ec074](https://github.com/likec4/likec4/commit/f7ec0744303b6b104510371109311bb643925f61))
- **deps:** update dependency tailwind-merge to ^1.14.0 ([4c71882](https://github.com/likec4/likec4/commit/4c718821d516ab7c81b798aee5d394e1309fbbd4))
- **deps:** update dependency word-wrap to ^1.2.5 ([2c0569c](https://github.com/likec4/likec4/commit/2c0569cb98c803d3569381797ae9839414c74aa3))
- **deps:** update nextra monorepo to ^2.10.0 ([010447c](https://github.com/likec4/likec4/commit/010447ceab11642a99833e0507877c3879b42954))
- **deps:** update typescript-eslint monorepo to ^6.1.0 ([c0da381](https://github.com/likec4/likec4/commit/c0da3819d064b73957056bef652222964362a5ab))
- **diagrams:** unique edge key, scoped to diagram, to avoid any issues with diagram transitions ([bc270da](https://github.com/likec4/likec4/commit/bc270da381bb5b6d11c9ff6dd3e4a4322977310c))

# [0.30.0](https://github.com/likec4/likec4/compare/v0.29.0...v0.30.0) (2023-07-21)

### Features

- **diagrams:** Display technology on card, [#208](https://github.com/likec4/likec4/issues/208) ([68d6300](https://github.com/likec4/likec4/commit/68d6300d3cfd44f636f7a96a0b6447c5f5377996))

### Fixes

- **deps:** update dependency word-wrap from 1.2.3 to 1.2.4 (🔒fix: CVE 2023 26115) ([2e5f99](https://github.com/likec4/likec4/commit/2e5f99d5bd8918cf27e00598d92bd1e687f86153))

# [0.29.0](https://github.com/likec4/likec4/compare/v0.28.3...v0.29.0) (2023-07-12)

### Features

- **core:** introduce `modern-errors` and replace `tiny-invariant` ([4caeb61](https://github.com/likec4/likec4/commit/4caeb61237cb39f11736c1f1cee2ef2da345cab5))

### Performance Improvements

- simple caching for model ([f79b53c](https://github.com/likec4/likec4/commit/f79b53c9862c491065391be358c001f9c2807d65))

### Bug Fixes

- **cli:** use node:path module [#212](https://github.com/likec4/likec4/issues/212) ([5f6e1d1](https://github.com/likec4/likec4/commit/5f6e1d1ea268904492c23c222b503baea40dccc8))
- **deps:** update dependency lucide-react to ^0.259.0 ([9636a47](https://github.com/likec4/likec4/commit/9636a4782c445214a820aa6d71d732f3e1c91007))
- **deps:** update typescript-eslint monorepo to ^5.62.0 ([#209](https://github.com/likec4/likec4/issues/209)) ([2c62486](https://github.com/likec4/likec4/commit/2c624865b6f86aa35ae9210f743e9a59b971fa9c))
- **deps:** update typescript-eslint monorepo to v6 (major) ([#210](https://github.com/likec4/likec4/issues/210)) ([aff4cac](https://github.com/likec4/likec4/commit/aff4cac69ff63b7aca1c3406bd90325549d863c1))

# [0.28.3](https://github.com/likec4/likec4/compare/v0.28.1...v0.28.3) (2023-07-07)

trigger release

# [0.28.2](https://github.com/likec4/likec4/compare/v0.28.1...v0.28.2) (2023-07-07)

trigger release

