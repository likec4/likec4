# [1.0.0-next.11](https://github.com/likec4/likec4/compare/v1.0.0-next.10...v1.0.0-next.11) (2024-04-11)

PRE-RELEASE

### Features

* webcomponents ([df430f0](https://github.com/likec4/likec4/commit/df430f0971b4d3c59e00cd560275d1b8601e0bb9))



# [1.0.0-next.10](https://github.com/likec4/likec4/compare/v1.0.0-next.2...v1.0.0-next.10) (2024-04-02)

Working on pre-release

# [1.0.0-next.2](https://github.com/likec4/likec4/compare/v1.0.0-next.1...v1.0.0-next.2) (2024-03-31)

Working on pre-release

# [1.0.0-next.1](https://github.com/likec4/likec4/compare/v1.0.0-next.0...v1.0.0-next.1) (2024-03-29)

Working on pre-release

# [1.0.0-next.0](https://github.com/likec4/likec4/compare/v0.60.3...v1.0.0-next.0) (2024-03-29)

Working on pre-release

## [0.60.3](https://github.com/likec4/likec4/compare/v0.60.2...v0.60.3) (2024-03-28)

### Bug Fixes

- **layout:** "fake" a node icon with a blue square to preserve space for real icons, see [#577](https://github.com/likec4/likec4/issues/577) ([23b0881](https://github.com/likec4/likec4/commit/23b088140d374ab4eec9eb38edbf76c392897e7e))

## [0.60.2](https://github.com/likec4/likec4/compare/v0.60.1...v0.60.2) (2024-03-26)

[@mcpride](https://github.com/mcpride) reported that `likec4 export png ...` timed out _sometimes_ (see [#634](https://github.com/likec4/likec4/issues/634))

As a temporary workaround, now cli has the option to configure max attempts (retries) and set timeout. Or even ignore failures,

```
Options:
  -i, --ignore        continue if some views failed to export                            [boolean] [default: false]
  -t, --timeout       (ms) timeout for playwright operations                              [number] [default: 15000]
      --max-attempts  (number) if export failed, retry N times                                [number] [default: 4]
```

Example:

```sh
$ likec4 export png -o ./assets -i --max-attempts 3 -t 5000
```

LikeC4 sets default playwright timeout to 5sec, retries exporting failed views 3 times, and ignores these failures anyway (if there are any successful exports).

## [0.60.1](https://github.com/likec4/likec4/compare/v0.60.0...v0.60.1) (2024-03-22)

### Bug Fixes

- **cli:** `-v` returns undefined [#615](https://github.com/likec4/likec4/issues/615)
- **cli:** reuse playwright page for screenshots ([#635](https://github.com/likec4/likec4/issues/635)) ([f07c61b](https://github.com/likec4/likec4/commit/f07c61bf7fa693f931f4ff88725f73e17aa553f4)), closes [#634](https://github.com/likec4/likec4/issues/634),
- **deps:** update dependency playwright-core to v1.42.1 ([#636](https://github.com/likec4/likec4/issues/636)) ([48d7ef4](https://github.com/likec4/likec4/commit/48d7ef4874254cfb7929517f73bf4d2d256677df))

# [0.60.0](https://github.com/likec4/likec4/compare/v0.58.0...v0.60.0) (2024-03-10)

### 🚀 Features

- **Relations with container elements** [#530](https://github.com/likec4/likec4/issues/530)\
  Relations with container elements were always used to layout diagrams but were not shown as they sometimes looked quite weird.
  While solving [#614](https://github.com/likec4/likec4/issues/614) it was figured out:
  - Sometimes, Graphviz fails to ["group"](https://graphviz.org/docs/attrs/group/) more than 5 nodes (or some extra heuristics required)
  - Relations with containers look much better without hard [minlen](https://graphviz.org/docs/attrs/minlen/)
  - Results from Graphviz WASM and its binary version can be significantly different

> Compare results by starting two CLIs (with and without `--use-dot-bin`)

### Bug Fixes

- decrease the number of nodes to group 7 -> 5, closes [#614](https://github.com/likec4/likec4/issues/614)

# [0.58.0](https://github.com/likec4/likec4/compare/v0.57.1...v0.58.0) (2024-03-08)

### 🚀 Features

- **lsp:** add links to relationships ([#616](https://github.com/likec4/likec4/issues/616)) ([5f94ac3](https://github.com/likec4/likec4/commit/5f94ac3057c426e5d255bcc76cf10763702b669f)), closes [#612](https://github.com/likec4/likec4/issues/612)
- **lsp:** langium 3 ([#606](https://github.com/likec4/likec4/issues/606)) ([b12605d](https://github.com/likec4/likec4/commit/b12605dbd2c4037b939f0aba86ff5c57ca4d4777))

## [0.57.1](https://github.com/likec4/likec4/compare/v0.57.0...v0.57.1) (2024-02-23)

### Bug Fixes

- **cli:** fix build ([d750521](https://github.com/likec4/likec4/commit/d75052171fa81bb87fa920e4f2f4c7fc274d6f1a))

# [0.57.0](https://github.com/likec4/likec4/compare/v0.56.0...v0.57.0) (2024-02-23)

### 🚀 Features

- **cli:** add option to use graphviz binary (instead of bundled WASM) [#534](https://github.com/likec4/likec4/issues/534) ([205e334](https://github.com/likec4/likec4/commit/205e334d090595eac3f248660eeb1a56a1d1d307))

### Bug Fixes

- **cli:** tsx default tsconfig ([2f5b3f0](https://github.com/likec4/likec4/commit/2f5b3f00873bfa395651c1dba4fdc47d81a096a6))
- **lsp:** returns references to the same views if no changes are made ([56333e1](https://github.com/likec4/likec4/commit/56333e1e357bd37e77aaf25519ff3d86288c2a0d))
- **vscode:** use browser and node `startServer` from `@likec4/language-server` ([67e3bab](https://github.com/likec4/likec4/commit/67e3bab0431e9011e198cfd81af7c110a821b47c))

# [0.56.0](https://github.com/likec4/likec4/compare/v0.54.0...v0.56.0) (2024-02-17)

### Features

- **vscode:** setting to use local graphviz binaries (see [#534](https://github.com/likec4/likec4/issues/534) [7e93e86](https://github.com/likec4/likec4/commit/7e93e86b3406f86da48d8d302805a69a16c1a31e))

### Bug Fixes

- **core:** improve error stack trace ([06ebf81](https://github.com/likec4/likec4/commit/06ebf81806d9386ba88fde8b829b162b81ca4d9d))
- **deps:** update dependency @hpcc-js/wasm to ^2.15.3 ([#537](https://github.com/likec4/likec4/issues/537)) ([b2fc368](https://github.com/likec4/likec4/commit/b2fc368ab08c51bf1d8493a31b8f6db3957d5687))
- **deps:** update dependency @radix-ui/themes to ^2.0.3 ([#544](https://github.com/likec4/likec4/issues/544)) ([c0929a1](https://github.com/likec4/likec4/commit/c0929a1b9a6e46546ff9e9bc69bddbf2124e23bb))
- **deps:** update dependency autoprefixer to ^10.4.17 ([#561](https://github.com/likec4/likec4/issues/561)) ([56f462f](https://github.com/likec4/likec4/commit/56f462f52f986771341c27a05b63fe10676c2970))
- **deps:** update dependency jotai to ^2.6.4 ([#545](https://github.com/likec4/likec4/issues/545)) ([1f97776](https://github.com/likec4/likec4/commit/1f977764269bc4c87ca49795a92cc387260abfb5))
- **deps:** update dependency konva to ^9.3.2 ([#546](https://github.com/likec4/likec4/issues/546)) ([469c3bc](https://github.com/likec4/likec4/commit/469c3bc9f87faef0b4649f9f710677efce97367c))
- **deps:** update dependency konva to ^9.3.3 ([58db259](https://github.com/likec4/likec4/commit/58db25940db0183d125e47623a76cf4b32b0e7b3))
- **deps:** update dependency react-accessible-treeview to ^2.8.3 ([#556](https://github.com/likec4/likec4/issues/556)) ([919aede](https://github.com/likec4/likec4/commit/919aeded60b9b2382793c1adfe9b61cb04bdb1d3))
- **deps:** update dependency remeda to ^1.40.0 ([#555](https://github.com/likec4/likec4/issues/555)) ([a5797f6](https://github.com/likec4/likec4/commit/a5797f6259c46521d359460a929467694738956b))
- **deps:** update dependency remeda to ^1.40.1 ([#559](https://github.com/likec4/likec4/issues/559)) ([8815004](https://github.com/likec4/likec4/commit/8815004190e73073addf942365a770222050d9a9))
- **deps:** update dependency ts-graphviz to ^1.8.2 ([ea80d34](https://github.com/likec4/likec4/commit/ea80d34db2ad209188170243b0909f4b6d4ed177))
- **deps:** update playwright to 1.41.2 ([18416f1](https://github.com/likec4/likec4/commit/18416f1369643b827e01295e3583bdbc82ba1d3b))

# [0.55.0]

Skipped due manual (and erroneous) publishing to marketplace.

# [0.54.0](https://github.com/likec4/likec4/compare/v0.53.0...v0.54.0) (2024-01-12)

### 🚀 Features

- **lsp:** add tags to relationships ([a7e6e06](https://github.com/likec4/likec4/commit/a7e6e065759ede641dd40b9cb3d49630666bcd79))

### Bug Fixes

- **vscode:** document selector on windows ([2540f88](https://github.com/likec4/likec4/commit/2540f88094eb3b7ee620712611e7deffb545af78))

# [0.53.0](https://github.com/likec4/likec4/compare/v0.52.0...v0.53.0) (2024-01-10)

### Features

- **diagrams:** element links [#525](https://github.com/likec4/likec4/issues/525) ([bed13b5](https://github.com/likec4/likec4/commit/bed13b54463cc4e2b66a3a644a05709e0b8ff38c))
- **lsp:** DocumentHighlightProvider ([62d31b3](https://github.com/likec4/likec4/commit/62d31b3b97fc3490e7ada7dc6702d93575eca8ee))

### Fixes

- **cli:** add fs watcher inside plugin on server configuration ([73f4263](https://github.com/likec4/likec4/commit/73f4263bb185167c0ebf73609794904a77a1b1f2))
- **cli:** d2 view fails to load ([5f7690f](https://github.com/likec4/likec4/commit/5f7690fef6393df4752e3e91c21eb43bee23edd5))
- **diagrams:** minor ui improvements ([2f38eb4](https://github.com/likec4/likec4/commit/2f38eb448a5e9c6269b06b499a0d6bb3f13febde))
- **layout:** add `headArrowPoint` and `tailArrowPoint` to edges ([89a9171](https://github.com/likec4/likec4/commit/89a91711bab7c57ffb183cd5e784efdda72543b9))
- **layouts:** ts compile error and remove dead code ([667bc00](https://github.com/likec4/likec4/commit/667bc000447640b5254d9be43f3ea5bca9a8d4fb))
- **layout:** use `constraint=false` instead of `minlen=0` ([1fdc6ba](https://github.com/likec4/likec4/commit/1fdc6ba4b91766a96827beee6f92422612371f10))
- **types:** `NonEmptyArray` has defined either head or tail ([dccc52a](https://github.com/likec4/likec4/commit/dccc52a131ad4ddf29b0d09cd35661edf03c129c))

# [0.52.0](https://github.com/likec4/likec4/compare/v0.51.0...v0.52.0) (2023-12-12)

- **likec4:** preview mermaid and d2 ([02f0be2](https://github.com/likec4/likec4/commit/02f0be2cfbe79331e9db0d41352b522d1bb78e24))
- **likec4:** improve graphviz output ([954e7d0](https://github.com/likec4/likec4/commit/954e7d0ed7f0714b08f98f0a56d073f39edf1dbb))

### Bug Fixes

- **deps:** bump `@hpcc-js/wasm` to 2.15.1 ([8e51156](https://github.com/likec4/likec4/commit/8e5115685beb889dbfdf91e754ae9282f837111a))
- **graph:** remove implicit edges if there is any nested already included ([94f935f](https://github.com/likec4/likec4/commit/94f935fc38a473315eb9d8891ea9ceee26ef45f7))
- **graph:** sort graph nodes ([3c8adf7](https://github.com/likec4/likec4/commit/3c8adf779c6dc5229bca51ce1ff27b6377085890))
- **layout:** edges with reverse direction ([09edfb8](https://github.com/likec4/likec4/commit/09edfb8be5842ef28414a47b0cea9ad748b96e2d))
- **layouts:** don't use `weight` edges in graphviz layout ([60917eb](https://github.com/likec4/likec4/commit/60917eb301fc65c86c4cabee50e9689d91edf4f6))

# [0.51.0](https://github.com/likec4/likec4/compare/v0.50.0...v0.51.0) (2023-12-05)

### 🚀 Features

- **language-server:** tolerant parser, exclude only erroneous elements (previously ignored whole document) ([2c9c456](https://github.com/likec4/likec4/commit/2c9c456fff57a54a811b0e86d3e5f11aa148685b))

### Bug Fixes

- **graph:** improve compound layouts ([feec3b3](https://github.com/likec4/likec4/commit/feec3b38d4714ddfe89a5be50a445f9859a99af9))
- **graph:** correct relationship predicate ([eba2be6](https://github.com/likec4/likec4/commit/eba2be6523fee49931000548fba679453df05931))
- **generators:** indent in mermaid ([6d27249](https://github.com/likec4/likec4/commit/6d272498ba0ac8cf19e16e3facf069266fac1ce8))
- **deps:** bump `vitest` to 1.0.1 ([0666acd](https://github.com/likec4/likec4/commit/0666acd7d386a25326cba17940d7299058fa5457))
- **deps:** update dependency jotai to ^2.6.0 ([62e46f2](https://github.com/likec4/likec4/commit/62e46f2d3d602591354d1be19b022b20eb4c1fec))

# [0.50.0](https://github.com/likec4/likec4/compare/v0.49.0...v0.50.0) (2023-12-01)

### 🚀 Features

- **diagrams:** navigate button ([44d2182](https://github.com/likec4/likec4/commit/44d218257916a449ce0e3ce2a039a0e460196d6a))
- **likec4:** display other formats ([c2f5823](https://github.com/likec4/likec4/commit/c2f5823e378cca00e16e548e10db53b133a768a0))
- **likec4:** copy-to-clipboard button ([ee444ac](https://github.com/likec4/likec4/commit/ee444ac1fd6f7f6ad937bf58182a12862aecb0f9))
- **likec4:** display diagram links ([c4932e7](https://github.com/likec4/likec4/commit/c4932e763a446dd9a426a08c62be28dfee07308e))
- **likec4:** show overlay on validation error ([6f1c36f](https://github.com/likec4/likec4/commit/6f1c36f57d3097726cbe1fdc06d59eb98b9d12ad))

### Bug Fixes

- **layouts:** background color for compounds in dot ([773c1ae](https://github.com/likec4/likec4/commit/773c1ae7dc83d8341c84f0fe1cb26682e6e5a3e7))
- **deps:** update dependency type-fest to ^4.8.2 ([75c54fa](https://github.com/likec4/likec4/commit/75c54faf37e8c4e33808336420f3cd0cea5c8b7a))
- **docs:** show correct dot in playground ([9e20da9](https://github.com/likec4/likec4/commit/9e20da9e2d1e1f37f14325f79e198dc3ba2ded76))
- **graph:** sort graph nodes considering implicit edges ([a1e33a4](https://github.com/likec4/likec4/commit/a1e33a4b9a7a52ccf2e8e97bb0c01a8bf06f4b6f))
- **layouts:** improve graph layout ([e71abfe](https://github.com/likec4/likec4/commit/e71abfe923febad88e190a66e8aced13a559bba6))
- **graph:** removeRedundantImplicitEdges ([a6420dc](https://github.com/likec4/likec4/commit/a6420dca92dc3ceea079b12ee4cab1711b841757))

# [0.49.0](https://github.com/likec4/likec4/compare/v0.48.0...v0.49.0) (2023-11-23)

### 🚀 Features

- **cli:** export to JSON ([f7a5db7](https://github.com/likec4/likec4/commit/f7a5db74ad0641b051ee4a058cd11b747436a88a))

### Bug Fixes

- **codegen:** incorrect dot is generated ([fddade6](https://github.com/likec4/likec4/commit/fddade65f494f6e7ebcd45720c886de261e258ed))
- **vscode:** extension lifecycle (correct "dispose") ([ecedcd6](https://github.com/likec4/likec4/commit/ecedcd6cb608347309f6a045b55f6c13db35106e))

# [0.48.0](https://github.com/likec4/likec4/compare/v0.47.0...v0.48.0) (2023-11-21)

### Bug Fixes

- **deps:** update dependency playwright-core to ^1.40.0 ([#466](https://github.com/likec4/likec4/issues/466)) ([ac979d4](https://github.com/likec4/likec4/commit/ac979d4492bfbfc16ce86623fd5acee2626a3a26))
- **likec4:** import statements and error handling in code ([efb0797](https://github.com/likec4/likec4/commit/efb07970c6e254e0f66a32245ba95d73ce5e0039))
- **lsp:** semantic tokens overlap ([f4b9c00](https://github.com/likec4/likec4/commit/f4b9c0018975d79264c7171bfaff7bd5a8769b9c))
- **vscode:** init workspace for web ([88b043d](https://github.com/likec4/likec4/commit/88b043d10738bbcae11f21d443dc880d079355d2))

# [0.47.0](https://github.com/likec4/likec4/compare/v0.46.1...v0.47.0) (2023-11-18)

Custom navigation and links between views:

```
view view2 {
  include *
  include cloud.backend with {
    // navigate to 'view3' on click
    navigateTo view3
  }
}

view view3 {
  include *
  include cloud.backend with {
    // the same element, but navigate back to 'view2'
    navigateTo view2
  }
}
```

### 🚀 Features

- **lsp:** custom navigation ([dc428ee](https://github.com/likec4/likec4/commit/dc428eefda8959aea99f2725900e9d922a0ea7a8))
- **vscode:** add WorkspaceSymbolProvider ([f333a24](https://github.com/likec4/likec4/commit/f333a24418c931c43fb7dfe75a97dbac7248acf7))

### Bug Fixes

- **cli:** output version ([4e06953](https://github.com/likec4/likec4/commit/4e06953ee10734850d9e73965294162e4240dd36))
- **deps:** update dependency @radix-ui/themes to ^2.0.1 ([8c6802f](https://github.com/likec4/likec4/commit/8c6802f62465774a174ba2e4bad1701513b0a835))
- **deps:** update dependency jotai to ^2.5.1 ([4bb2362](https://github.com/likec4/likec4/commit/4bb2362e320f545ece5e8d20072f2d0e0e383a31))
- **deps:** update dependency nanostores to ^0.9.5 ([748554c](https://github.com/likec4/likec4/commit/748554caa4dc3b290ce6d9fb1d032dd01a276a13))
- **deps:** update dependency type-fest to ^4.7.1 ([cadebe0](https://github.com/likec4/likec4/commit/cadebe0ebd46589671f0ba23cb9d7ba97877a625))
- **layouts:** improve edge weights ([21f55cb](https://github.com/likec4/likec4/commit/21f55cb2b3ac8afbce5acca1c83c8e485ba60e63))
- **layouts:** set `minlen=0`instead of `constraint=false` for better layout ([ccad492](https://github.com/likec4/likec4/commit/ccad492688b6d41342b0f4de46202086adfb850a))
- **lsp:** allow reserved words as ID ([12636d5](https://github.com/likec4/likec4/commit/12636d5d14cc65edfb2ba70de0aa5caa96477435))
- **lsp:** make extended element resolvable inside its body ([6c3b009](https://github.com/likec4/likec4/commit/6c3b009d762bcd04f253f138f030089b8850be2a))

## [0.46.1](https://github.com/likec4/likec4/compare/v0.46.0...v0.46.1) (2023-11-14)

### Bug Fixes

- **cli:** return optimizeDeps in serve ([d8e065f](https://github.com/likec4/likec4/commit/d8e065fc05cafaa703061a7e3224ed6b1ef19ed7))

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

- **diagrams:** relationship kinds by @MoBoo ([#342](https://github.com/likec4/likec4/issues/342))\
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

- **language:** extends from another view ([e2a4d59](https://github.com/likec4/likec4/commit/e2a4d590921adefba1e6a951d3eaf5fda74fbd9b))\
  [Documentation](https://likec4.dev/docs/dsl/views/#extend-views)
- **cli:** export views to Mermaid ([#314](https://github.com/likec4/likec4/pull/314)), thanks to [@kcaswick](https://github.com/kcaswick)

# [0.36.0](https://github.com/likec4/likec4/compare/v0.35.0...v0.36.0) (2023-09-12)

### Features

- **cli:** option to use custom HTML template for exported png ([4e7ef2c](https://github.com/likec4/likec4/commit/4e7ef2c50ba1d00b32e061ff4ce6704b8011005b))\
  This allows use custom CSS styling and render additional elements, like View title, description or watermarks.\
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

- **diagrams:** DiagramsBrowser\
  You've already seen this component working on the project website, but it was not back-ported to the npm-module
- **diagrams:** LikeC4 factory\
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
