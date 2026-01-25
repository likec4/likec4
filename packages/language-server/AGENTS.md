# Agent Instructions

- When you update the Langium grammar in `packages/language-server/src/like-c4.langium`:
  - run `pnpm generate` to update the generated files
  - update TextMate grammars accordingly
    - in `packages/vscode/likec4.tmLanguage.json`
    - in `apps/playground/likec4.tmLanguage.json`
    - in `apps/docs/likec4.tmLanguage.json`
