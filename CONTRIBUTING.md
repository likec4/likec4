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
- Run tests with `yarn test` and submit a PR once all tests have passed.
- Get a code review and fix all issues noticed by the maintainer.
- If you cannot finish your task or if you change your mind – that's totally fine! Just let us know in the GitHub issue that you created during the first step of this process. Our community is friendly – we won't judge or ask any questions if you decide to cancel your submission.
- Your PR is merged. You are awesome ❤️!

## Get started with LikeC4 locally

1. Fork the [repository](https://github.com/likec4/likec4), then clone or download your fork.

2. Ensure you have all required [tools](./.tool-versions)  
   Install manually or use [asdf](https://asdf-vm.com/):
   ```sh
   asdf install
   ```

3. Install dependencies with pnpm – `pnpm install`

4. Generate sources by running build in root:
   ```sh
   pnpm build
   ```

5. Mostly used dev tasks:
   1. `pnpm dev` in `apps/playground`
   2. `pnpm dev` (or any `pnpm dev:*`) in `package/likec4`
   3. `pnpm vitest:ui` in root
   4. `pnpm typecheck` in root

6. To work on VSCode extension:
   - Launch [`Run Extension`](https://github.com/likec4/likec4/blob/c88cfdb3856aff4b28c5f72da7ded8caf8c47c62/.vscode/launch.json#L18) to start a new VSCode instance with the extension loaded.

### E2E

`/e2e` contains isolated workspace. Test steps are:
- pack `likec4` to tarball
- install this tarball in isolated wokspace
- generate spec files from model (using LikeC4Model)
- run playwright

To run from root workspace:

```sh
pnpm test:e2e
```

## About this repository

### Top-level layout

This repository's contents are:

- `/apps/docs` Astro-app, contains the content for our docs site at [likec4.dev](https://likec4.dev)
- `/apps/playground` - Vite SPA, site [playground.likec4.dev](https://playground.likec4.dev)
- `/packages` contains the source for packages

### Packages

- `core`: model and type definitions
- `create-likec4`: scaffolding tool
- `diagram`: react components rendering diagrams
- `generators`: _LikeC4 -> Other formats_
- `icons`: prebundled icons
- `language-server`: parser and language server
- `layouts`: layout algorithms for views
- `likec4`: CLI, published to npm as `likec4`
- `log`: Common loqgger
- `tsconfig`: typescript configuration
- `vscode`: vscode extension
- `vscode-preview`: preview panel in vscode extension
