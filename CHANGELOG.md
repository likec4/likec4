# [0.46.0](https://github.com/likec4/likec4/compare/v0.45.0...v0.46.0) (2023-11-11)

With the Langium update to version 2.1.2, the code completions in VSCode have significantly improved.

### 🚀 Features

- **core:** add depth field to compound nodes ([fe3083a](https://github.com/likec4/likec4/commit/fe3083acadd0da82d947a61f3ff6cc1997eaa1aa))
- **diagrams:** backgroung pattern ([c2bc83b](https://github.com/likec4/likec4/commit/c2bc83b0ead78e16812f2174c7ea9cbf0f5888eb))
- **graph:** sorting of relationships ([bd8d694](https://github.com/likec4/likec4/commit/bd8d694bbb7f5100efe90d432133898815ce93a4))
- **lsp:** any order of top-level statements ([#445](https://github.com/likec4/likec4/issues/445)) ([154844c](https://github.com/likec4/likec4/commit/154844c8ceb1317cba3950b2030cab3abea008c5))
- **vscode:** display error message on failed parse ([789958f](https://github.com/likec4/likec4/commit/789958f72585f4e3e3fa6e2339fef67be4c0df5e))

### Bug Fixes

- **core:** hierarchical sorting of relationships ([6325e0e](https://github.com/likec4/likec4/commit/6325e0ee7b79adff69bef9739aaf3c22128d85d1))
- **deps:** update dependency remeda to ^1.29.0 ([1ec9348](https://github.com/likec4/likec4/commit/1ec9348271e53a847c03079f7f6234a947db2b25))
- **deps:** update langium to 2.1.2 ([#423](https://github.com/likec4/likec4/issues/423)) ([ba17f44](https://github.com/likec4/likec4/commit/ba17f44bfcfa19fb46909193b7e31de2dda62025))
- **graph:** do not add element if it exists implicitly ([27b5d7d](https://github.com/likec4/likec4/commit/27b5d7d5e24aeb38fd7c75f5f9e4663979fa204c))
- **graph:** left-align for edge labels ([7e7dea8](https://github.com/likec4/likec4/commit/7e7dea82cdcad779315a4caf89e4b4393fb9c95f))
- **likec4:** improve transparent background for emded ([174f296](https://github.com/likec4/likec4/commit/174f296f11055aa1f50d0099b54dec75daeca7e2))
- **lsp:** onBuildPhase should be in async context ([2a7f0cb](https://github.com/likec4/likec4/commit/2a7f0cb98c48324429fe9d2e21198d2cfb566412))

# [0.45.0](https://github.com/likec4/likec4/compare/v0.44.1...v0.45.0) (2023-11-04)

### 🚀 Features

- **likec4:** dedicated page for export with transparent background ([e992144](https://github.com/likec4/likec4/commit/e9921449e5b1c9011b32e438244325c97c3edb78))

### Bug Fixes

- **likec4:** don't emptyOutDir on second run ([9d58f39](https://github.com/likec4/likec4/commit/9d58f39e9a07ec1ab005a78fb9d9c4445f004bc9))
- **diagrams:** absolute position for FullscreenDiagram ([29741f1](https://github.com/likec4/likec4/commit/29741f1139d44cdaaf77e78adbce736a5eaa1504))
- **diagrams:** adjust label positions ([afdad65](https://github.com/likec4/likec4/commit/afdad654ce506fda9fffa3d2f16edf15964ce067))
- **diagrams:** correct node label positions ([500f53d](https://github.com/likec4/likec4/commit/500f53d8c237540400a0dc1ea2ba32fd526a38a5))
- **diagrams:** smooth animation ([ad054ce](https://github.com/likec4/likec4/commit/ad054cee07b18f9ff6d905a74a44218fec8130e6))
- **docs:** css classes for embedded diagram ([9a0418a](https://github.com/likec4/likec4/commit/9a0418a756f3fd52900deb526e28ca4f68f8cbfe))
- **layouts:** strict align for node and edge labels ([813fd10](https://github.com/likec4/likec4/commit/813fd10bccd46ebc2d9d39686396349ca7897619))
- **vscode:** git changes were parsed too, that led to duplicate entries ([04d1a7f](https://github.com/likec4/likec4/commit/04d1a7fe4ca9dff2be2fb27f3b214495b5bdb1cc))

## [0.44.1](https://github.com/likec4/likec4/compare/v0.44.0...v0.44.1) (2023-11-02)

### Bug Fixes

- **cli:** vite ports and export output ([36e0f68](https://github.com/likec4/likec4/commit/36e0f68648c0b6f02c6de4e2450d023181305f67))
- **deps:** update dependency konva to ^9.2.3 ([b02301b](https://github.com/likec4/likec4/commit/b02301b106432148aba558e2d4a8396d278968d8))

# [0.44.0](https://github.com/likec4/likec4/compare/v0.43.1...v0.44.0) (2023-10-30)

### Features

- **diagrams:** add icon to elements to indicate they include a sub-view [#361](https://github.com/likec4/likec4/issues/361) ([8fd1a2e](https://github.com/likec4/likec4/commit/8fd1a2eb708bd5597954237f2979c056df831ee6))

## [0.43.1](https://github.com/likec4/likec4/compare/v0.43.0...v0.43.1) (2023-10-29)

### Bug Fixes

- **diagrams:** better timing for edge onhover ([2dec801](https://github.com/likec4/likec4/commit/2dec8013a256293fbc565365eaebe94908fcf2d0))
- **vscode:** do not fail if source file was removed ([96e15ff](https://github.com/likec4/likec4/commit/96e15ffcd85a320c316e527bd9a3b6b37b9d7e0c))

# [0.43.0](https://github.com/likec4/likec4/compare/v0.42.2...v0.43.0) (2023-10-29)

### 🚀 Features

- **diagrams:** highlight elements of the hovered edge ([7e65b0e](https://github.com/likec4/likec4/commit/7e65b0e3ab60ad96e55584b2326fed7a1f51b3e6))

### Bug Fixes

- **language:** add validation for incoming and outgoing expressions ([b31c1f1](https://github.com/likec4/likec4/commit/b31c1f1a520937048929a0fa5c8163240dc2be6f))

## [0.42.2](https://github.com/likec4/likec4/compare/v0.42.1...v0.42.2) (2023-10-28)

### Bug Fixes

- **graph:** handle `-> .. ->` expressions ([c7fb33e](https://github.com/likec4/likec4/commit/c7fb33ed3daefcbea95b3c4db21e0b46cd4fe81a))
- **layouts:** `haveNoOtherEdges` condition should be only for root ([095c4ac](https://github.com/likec4/likec4/commit/095c4ac3e0f97ad6debf3cb2426d0ceda3792b28))

## [0.42.1](https://github.com/likec4/likec4/compare/v0.42.0...v0.42.1) (2023-10-26)

### Bug Fixes

- **cli:** wrong vite entrypoint when embeded ([4f43536](https://github.com/likec4/likec4/commit/4f435361f2ce45e44262cadc5f4b577f92081362))

# [0.42.0](https://github.com/likec4/likec4/compare/v0.41.0...v0.42.0) (2023-10-26)

### 🚀 Features

- **cli:** export to PNG from preview ([6996184](https://github.com/likec4/likec4/commit/6996184859003fb0c67f02d22ba0e3b86029738a))

# [0.41.0](https://github.com/likec4/likec4/compare/v0.40.0...v0.41.0) (2023-10-25)

### 🚀 Features

- **diagrams:** relationship kinds by @MoBoo ([#342](https://github.com/likec4/likec4/issues/342))  
  [Docs](https://likec4.dev/docs/dsl/specification/#relationships)

  Relationship kinds allow you to express different types of relations in a model and customize styling.

  Example:

  ```
  specification {
    relationship async {
      color amber
      line dotted
      head diamond
    }
  }
  model {
    service1 -[async]-> service2
  }
  ```

- **cli:** new CLI and preview mode

  Try this in folder with your `*.c4` files

  ```bash
  npx likec4 serve
  ```

  Documentation is updating... 👷

- **cli:** export to static website

  ```bash
  npx likec4 build -o dist
  ```

- **cli:** Scaffold projects with `npm create likec4` ([ef7cf93](https://github.com/likec4/likec4/commit/ef7cf93bbb7a397a2685b7952b4a8c601656ab81))
- **diagrams:** dashed relationships by default ([3593d71](https://github.com/likec4/likec4/commit/3593d71a143720615f8783a587978dea250be24f))

### Bug Fixes

- **diagrams:** don't animate element if animation is disabled ([b039602](https://github.com/likec4/likec4/commit/b03960204963a04ba4badbacc6ea780709b81801))
- **likec4:** responsive embeds ([c8b187d](https://github.com/likec4/likec4/commit/c8b187d4207fb84312c14360e9839f3c626da3c1))
- **likec4:** use deviceScaleFactor = 2 ([ad8099a](https://github.com/likec4/likec4/commit/ad8099af1a31b3fd59c8fe3ec3833ba1b259daba))
- **likec4:** use window size for export/embed ([a0b3d6b](https://github.com/likec4/likec4/commit/a0b3d6bea49b18878aa684f1a833849e84a472e5))
- remove redundant implicit edges ([4a8daaf](https://github.com/likec4/likec4/commit/4a8daaf00444275506659a86922a32037d7ff9a6))
- use [...] for merged edges ([81282e6](https://github.com/likec4/likec4/commit/81282e698c36b964c80e9439138f2db54b8e3c05))
- vscode launch task loads source maps ([c867401](https://github.com/likec4/likec4/commit/c867401f8535654e7701664d669d0d18f9d2bd9f))

### New Contributors

@MoBoo made their first contribution in #374

# [0.40.0](https://github.com/likec4/likec4/compare/v0.37.1...v0.40.0) (2023-10-09)

### Features

- `diagrams-dev` workspace ([fc5560f](https://github.com/likec4/likec4/commit/fc5560faf56e9c53e4f08378a2e29712aac90fff))
- new cli `likec4` ([9413cec](https://github.com/likec4/likec4/commit/9413cecbc94087f7dfd136ea4d80704af965c3e5))

### Bug Fixes

- **diagrams:** fix zoom ([02ba48d](https://github.com/likec4/likec4/commit/02ba48d2a4e51f39ef0956abc9379cd48436791c))
- **language:** resolve view links ([9d1a0ca](https://github.com/likec4/likec4/commit/9d1a0ca9dcb1ce6b1749f4964a64383ed6a3a923))

## [0.37.1](https://github.com/likec4/likec4/compare/v0.37.0...v0.37.1) (2023-09-16)

### Features

- **vscode:** "Open source" from element context menu in preview panel ([8b19661](https://github.com/likec4/likec4/commit/8b196615af7180435cd894a2ec39bc6083280994))
- **vscode:** Back button in preview panel

### Bug Fixes

- **diagrams:** improve contextmenu ([487972a](https://github.com/likec4/likec4/commit/487972a52e720e7891dfab0fdd9ceab5346165ff))
- **diagrams:** use value from hash as initialViewId, if available ([2145de6](https://github.com/likec4/likec4/commit/2145de66726e9ef68b326998aedb3dc4e2c994a7))
- **language:** add index view if not present ([836a05e](https://github.com/likec4/likec4/commit/836a05e5e7a55a14e8e7bc3a372e363fe470118e))

# [0.37.0](https://github.com/likec4/likec4/compare/v0.36.0...v0.37.0) (2023-09-14)

### Features

- **language:** extends from another view ([e2a4d59](https://github.com/likec4/likec4/commit/e2a4d590921adefba1e6a951d3eaf5fda74fbd9b))  
  [Documentation](https://likec4.dev/docs/dsl/views/#extend-views)
- **cli:** export views to Mermaid ([#314](https://github.com/likec4/likec4/pull/314)), thanks to [@kcaswick](https://github.com/kcaswick)

# [0.36.0](https://github.com/likec4/likec4/compare/v0.35.0...v0.36.0) (2023-09-12)

### Features

- **cli:** option to use custom HTML template for exported png ([4e7ef2c](https://github.com/likec4/likec4/commit/4e7ef2c50ba1d00b32e061ff4ce6704b8011005b))  
  This allows use custom CSS styling and render additional elements, like View title, description or watermarks.  
  [Documentation](https://likec4.dev/docs/tools/cli/#export)

### Bug Fixes

- **language-server:** separate elements and tags in specification ([#305](https://github.com/likec4/likec4/issues/305)) ([796068f](https://github.com/likec4/likec4/commit/796068fea2e05138fbfcbfadbafabf51730eda72))
- **vscode:** improve logging and telemetry ([#310](https://github.com/likec4/likec4/issues/310)) ([cd175e2](https://github.com/likec4/likec4/commit/cd175e2633747a94ec55c53691a52875f8e73e17))

# [0.35.0](https://github.com/likec4/likec4/compare/v0.34.0...v0.35.0) (2023-09-09)

### Features

- **diagrams:** add `resetHashOnUnmount` and `onReturnToInitial` props to `useViewId` hook ([#301](https://github.com/likec4/likec4/issues/301)) ([563b35b](https://github.com/likec4/likec4/commit/563b35bb6afcbc33dcad7228c697b595d6166b88))
- update typescript to ^5.2.2 ([#298](https://github.com/likec4/likec4/issues/298)) ([956c180](https://github.com/likec4/likec4/commit/956c1804173f884355975e01438fde174cf4898c))
- use Node 20 ([faf7949](https://github.com/likec4/likec4/commit/faf79493c5e353745e1f48d0405311bfcd7f18f6))

### Bug Fixes

- babel compatiblity with Node 20.6 ([b35846c](https://github.com/likec4/likec4/commit/b35846c2fe5f0cab5491bb80fb5caf09778efcc5))
- **deps:** update vitest ^0.34.3 ([#297](https://github.com/likec4/likec4/issues/297)) ([c4a2dbf](https://github.com/likec4/likec4/commit/c4a2dbf6f6678eab95859788edc8ee10059e9d8d))
- **language-server:** memory leak on keeping reference to element ([c7e37f4](https://github.com/likec4/likec4/commit/c7e37f4cb24586ed9f8bd3fe406d31acdb079070))

# [0.34.0](https://github.com/likec4/likec4/compare/v0.33.1...v0.34.0) (2023-09-01)

### Features

- More customization in React components ([1bdf747](https://github.com/likec4/likec4/commit/1bdf747984641285af87c1f2901e4b539166a6d0))
- Updated to Langium 2.0.0 ([fc158f1](https://github.com/likec4/likec4/commit/fc158f125905d05c98543f0bb9f03bcd76ad8a81))

### Bug Fixes

- CLI fails to export image on Windows ([#281](https://github.com/likec4/likec4/issues/281)) ([cc7e054](https://github.com/likec4/likec4/commit/cc7e0545974019c667c3cf7a22f84a0f07ac0760)), closes [#280](https://github.com/likec4/likec4/issues/280)
- improve errors handling ([98735ac](https://github.com/likec4/likec4/commit/98735acd2a7b3c1e58daf3645fcfaa2dcdf16c36))
- workaround for a bug in the `chevrotain-allstar@0.3.0` ([2e20b96](https://github.com/likec4/likec4/commit/2e20b9669eea16417683162d45b9ba3b7c78cee4))

# [0.33.1](https://github.com/likec4/likec4/compare/v0.33.0...v0.33.1) (2023-08-12)

No changes, just trigger release.

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

export const IndexView = () => <Embedded viewId={'indexLR'} />
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
