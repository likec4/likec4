---
'likec4': minor
'@likec4/generators': minor
---

Add a Markdown generator and `export markdown` CLI command. `generateMarkdown` renders a
project's views as a single GitHub-flavored Markdown document (optionally with a project
overview from `options.description`), reusing `generateMermaid` for each embedded diagram.
`likec4 export markdown [path]` writes one `README.md` per project into that project's own
folder — following the `export png`/`json` precedent of iterating all projects by default,
with `--project` to restrict to one — so the rendered architecture is browsable directly on
GitHub, with no server and no manual diagram assembly.
