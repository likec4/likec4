# Epic: Markdown documentation export

## Why

A LikeC4 project is browsable in the LikeC4 app/server, but architecture docs are most
useful **where the code lives** — in the repository, on a pull request, in a wiki. GitHub (and
most forges) renders Markdown natively, including fenced ` ```mermaid ` diagrams.

Teams already generate loose `.mmd` files from the model, then hand-assemble them into a
readable page. That assembly is manual, drifts from the model, and isn't reproducible.

## Outcome

Each project is rendered as a `README.md` in its own folder, so browsing that folder on GitHub
shows the architecture — a section per view, diagrams rendered inline — always in sync with the
model, with no LikeC4 server and no hand-assembly.

## Scope

- One Markdown page per **project**, written as `README.md` into the project folder so GitHub
  auto-renders it on folder navigation.
- Rendering covers **every project by default**; a reader/CI can restrict to a single project.
- Projects that render to no views (e.g. an empty default project) are skipped.
- Out of scope (later features):
  - splitting a single large project across multiple pages plus an index;
  - grouping a page by tag or by `viewOf`.
