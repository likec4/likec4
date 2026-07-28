# Epic: Markdown documentation export

## Why

A LikeC4 project is browsable in the LikeC4 app/server, but architecture docs are most
useful **where the code lives** — in the repository, on a pull request, in a wiki. GitHub (and
most forges) renders Markdown natively, including fenced ` ```mermaid ` diagrams.

Teams already generate loose `.mmd` files from the model, then hand-assemble them into a
readable page. That assembly is manual, drifts from the model, and isn't reproducible.

## Outcome

A reader opens the repository on GitHub and reads the architecture as one self-contained
Markdown page — sections per view, diagrams rendered inline — always in sync with the model,
with no LikeC4 server and no hand-assembly.

## Scope

- One Markdown document per **project**.
- Rendering covers **every project by default**; a reader/CI can restrict to a single project.
- Out of scope (later features):
  - multi-page output — one file per source view file plus an index — for models too large
    for a single page;
  - grouping views by something other than their source file (e.g. by tag or by `viewOf`).
