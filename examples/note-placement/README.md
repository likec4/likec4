# Note placement examples

The [notes.c4](notes.c4) file contains two regular diagrams:

- `sparse`: Four services with six notes.
- `readableNested`: Three groups with twelve services and nine notes.

Run this command from the repository root:

```sh
pnpm --filter @likec4/spa exec node --import tsx --conditions=sources start-dev.ts ../../examples/note-placement
```

Open either diagram in the local page. The E2E project includes this directory and tests the same `.c4` source.
