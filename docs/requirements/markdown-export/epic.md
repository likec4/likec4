# Epic: Markdown documentation export

## Why

LikeC4's interactive app/server is great for the architect actively shaping the model — live
editing, exploring relationships, deciding. An **observer** — someone reading the architecture,
not deciding it — doesn't want to stand up a server just to understand a design; they want it
where they already are: the repository, a pull request, a wiki. GitHub (and most forges) render
Markdown natively, including fenced ` ```mermaid ` diagrams.

Teams already generate loose `.mmd` files from the model, then hand-assemble them into a
readable page. That assembly is manual, drifts from the model, and isn't reproducible.

## Outcome

Each project is rendered as a `README.md` in its own folder, so browsing that folder on GitHub
shows the architecture — an overview of the project, then a section per view with diagrams
rendered inline — always in sync with the model, with no LikeC4 server and no hand-assembly.

## Scope

- One Markdown page per **project**, written as `README.md` into the project folder so GitHub
  auto-renders it on folder navigation.
- Rendering covers **every project by default**; a reader/CI can restrict to a single project.
- Projects that render to no views (e.g. an empty default project) are skipped.
- Out of scope (later features):
  - splitting a single large project across multiple pages plus an index;
  - grouping a page by tag or by `viewOf`.
