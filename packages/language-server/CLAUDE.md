# Agent Instructions

- Do not edit files in `src/generated` and `src/generated-lib` - these are auto-generated and your changes will be overwritten.
- After making changes in `src/like-c4.langium`:
  - Always run `pnpm generate` to update the generated files
  - Update TextMate grammars accordingly
    - in `<root>/packages/vscode/likec4.tmLanguage.json`
    - in `<root>/apps/playground/likec4.tmLanguage.json`
    - in `<root>/apps/docs/likec4.tmLanguage.json`
