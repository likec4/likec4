# Contributing to LikeC4

First of all, thank you for showing interest in contributing to LikeC4! All your contributions are extremely valuable!

## Ways to contribute

- **Improve documentation:** Fix incomplete or missing docs, bad wording, examples or explanations.
- **Give feedback:** We are constantly working on making LikeC4 better. Please share how you use LikeC4, what features are missing and what is done well via [GitHub Discussions](https://github.com/likec4/likec4/discussions/new) or [Discord](https://discord.gg/86ZSpjKAdA).
- **Share LikeC4:** Share links to the LikeC4 docs with everyone who might be interested!
- **Contribute to the codebase:** Propose new features via [GitHub Issues](https://github.com/likec4/likec4/issues/new), or find an [existing issue](https://github.com/likec4/likec4/issues/) that you are interested in and work on it!
- **Give us a code review:** Help us identify problems with the [source code](https://github.com/likec4/likec4/tree/main/packages) or make LikeC4 better.

## Contributing workflow

- Decide on what you want to contribute.
- If you would like to implement a new feature, discuss it with the maintainers ([GitHub Discussions](https://github.com/likec4/likec4/discussions/new) or [Discord](https://discord.gg/86ZSpjKAdA)) before jumping into coding.
- After finalizing issue details, you can begin working on the code.
- Run tests with `pnpm test` and submit a PR once all tests have passed.
- Get a code review and fix all issues noticed by the maintainer.
- If you cannot finish your task or if you change your mind – that's totally fine! Just let us know in the GitHub issue that you created during the first step of this process. Our community is friendly – we won't judge or ask any questions if you decide to cancel your submission.
- Your PR is merged. You are awesome ❤️!

## Get started with LikeC4 locally

1. Fork the [repository](https://github.com/likec4/likec4), then clone or download your fork.

2. Project requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/)\
   See required versions in [.tool-versions](./.tool-versions)

   - [Optional] If you use [asdf](https://asdf-vm.com/):
     ```sh
     asdf install
     ```

3. Install dependencies with pnpm:
   ```sh
   pnpm install
   ```

4. Pre-generate sources by running `build` (or `generate`) in root:
   ```sh
   pnpm build
   ```
   > [!TIP]
   > It is always a good idea to run `pnpm generate` after checkout or merge.

5. Mostly used dev tasks:
   - `pnpm dev` in `apps/playground`\
     This command starts the playground app in development mode, picking up changes from any package with hot reloading.
   - `pnpm dev` (or any `pnpm dev:*`) in `package/likec4`\
     This command also picks up changes from any package.
   - `pnpm vitest:ui` in root to run all tests.
   - `pnpm typecheck` in root to run the typecheck.

6. To work on VSCode extension:
   - Launch [`Run Extension`](https://github.com/likec4/likec4/blob/c88cfdb3856aff4b28c5f72da7ded8caf8c47c62/.vscode/launch.json#L18) to start a new VSCode instance with the extension loaded.

> [!TIP]
> Project uses Typescript project references to optimize compile time, but sometimes it may cause issues on delete/rename.\
> Try `pnpm clean` in root to clean up caches, and `pnpm typecheck` after.
>
> If it doesn't help, `pnpm store prune`, removing `node_modules` and clean install are always a good idea.

### E2E

`/e2e` contains isolated workspace.\
Run from root:

```sh
pnpm test:e2e
```

What it does:

- pack `likec4` to tarball
- install this tarball in isolated wokspace
- generate spec files from model (using LikeC4Model)
- run playwright

## About this repository

### Top-level layout

This repository's contents are:

- `/apps/docs` Astro-app, contains the content for our docs site at [likec4.dev](https://likec4.dev)
- `/apps/playground` - Vite SPA, site [playground.likec4.dev](https://playground.likec4.dev)
- `/packages` contains the source for packages

### Packages

#### `/packages/likec4`

- **Purpose**: Provides CLI, Vite plugin, generates static website (sources in `/packages/likec4/app/`). Main entry point for the tool.
- **Technology**: Uses [yargs](https://yargs.js.org/), [Vite](https://vite.dev/)

#### Core `/packages/core`

- **Purpose**: Core type definitions, api, model builder and utilities. `compute-view` contains logic for computing diagram views.
  Read [core's README](./packages/core/README.md).
- **Technology**: Pure TypeScript, no frameworks. Heavy use of [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) and [remeda](https://remedajs.com/)

- **Suggestions**: A great way to start contributing is by adding more tests for compute-view. This will help you understand how it works while also benefiting the project. There are also open questions from @pavelpykhtin, who has made significant contributions.

#### Diagrams `/packages/diagram`

- **Purpose**: Renders the actual diagrams
- **Technology**: Uses [React](https://react.dev/), [ReactFlow](https://reactflow.dev/), [XState](https://xstate.js.org/)

#### Generators `/packages/generators`

- **Purpose**: Converts LikeC4 Model to other formats, like Mermaid, PlantUML, SVG, etc.\
  Also generates typings for Model API and React.

#### Language Server `/packages/language-server`

- **Purpose**: Parses DSL, builds models, and computes views
- **Technology**: Built with [Langium](https://langium.org/)

#### Layouts `/packages/layouts`

- **Purpose**: Transforms computed views into visual graph layouts
- **Technology**: Uses [Graphviz](https://graphviz.org/) for layout algorithms

#### VSCode Extension `/packages/vscode`

- **Purpose**: Integrates LikeC4 into Visual Studio Code.
- **Technology**: Uses [reactive-vscode](https://github.com/KermanX/reactive-vscode) and follows [VS Code extension patterns](https://vscode-docs.readthedocs.io/en/stable/extensions/patterns-and-principles/).

#### Additional Packages

- `create-likec4`: Scaffolding tool for new projects
- `icons`: Pre-bundled icon sets
- `log`: Common logger implementation
- `tsconfig`: TypeScript configuration
- `vscode-preview`: Preview panel component for VS Code extension
