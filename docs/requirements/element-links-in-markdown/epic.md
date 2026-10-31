---
type: Epic
title: 'Element links in Markdown'
description: Reference model elements and views from Markdown descriptions with `[[fqn]]`, with completion and validation in the editor and clickable links in the diagram.
status: draft
tags: [epic, markdown, lsp, vscode, diagram]
---

# Epic: Element links in Markdown

## Why

Descriptions, summaries and notes are where architects explain _why_ — and the explanation
almost always mentions other parts of the model: "calls `cloud.backend.api`", "see the
deployment view". Today these mentions are plain text: nothing checks they still exist,
nothing helps typing them, and a reader can't jump to the mentioned element.

## Outcome

An author types `[[` inside a Markdown value, picks an element from completion, and the editor
warns if the reference later breaks. A reader clicks the link in the diagram and lands on that
element's details (or on the referenced view).

## Syntax

| Form                 | Meaning                                          |
| -------------------- | ------------------------------------------------ |
| `[[cloud.api]]`      | link to element, rendered with the element title |
| `[[cloud.api\|API]]` | link to element with a custom label              |
| `[[view:index]]`     | link to view, rendered with the view title       |
| `\[[`                | literal `[[`, standard Markdown escaping         |

- A ref is on one line. The target has no whitespace, `[`, `]`, `|` or `\`; labels may use `\|`
  as the separator (`[[a.b\|Label]]`), which is required inside GFM tables, where a bare `|`
  splits the cell before inline parsing.
- FQN is **absolute**, resolved within the **current project** only. No relative resolution,
  no `this`, no imported elements (yet).
- Any `prefix:` inside the brackets is a **reserved namespace**. Known: `view:`. Unknown prefixes
  produce a validation warning. FQNs cannot contain `:`, so there is no ambiguity. This leaves
  room for `deployment:` or cross-project links later without breaking existing text.
- `@fqn` was rejected: no explicit end (trailing sentence period), clashes with emails and with
  `@alias/path` (`URI_ALIAS`) already used in the DSL.

## Scope

Links work in **Markdown values only** (`'''…'''` / `"""…"""`, parsed as `{ md }`), in every
field that accepts them: element / deployment / relation / view `description`, `summary`,
`title`, `technology`, `notes`, `notation`, metadata values, specification kinds.

- Plain strings (`'…'`, parsed as `{ txt }`) and inline positional values are **not** processed.
- Links inside inline code and fenced code blocks are **not** processed (render and validation).
- External files via `descriptionFile` are rendered with links (they become `{ md }`), but get
  **no LSP support** in v1.

## Design

### Core: one parser for everyone (`packages/core/src/utils/markdown/`)

- `extractRefs(md): MarkdownRef[]` (exported from `@likec4/core/utils`) — implemented as a
  micromark syntax extension + mdast extension (`refs.ts`, node `likec4Ref`) shared by
  `extractRefs`, `to-html` and `to-text`. A tokenizer, not a text-node scan: text nodes merge
  escapes and decode entities, which breaks `\[[` and offsets. Code, inline HTML and autolinks are
  never scanned; refs inside link text render as plain text (anchors cannot nest). It is the single
  source of truth for the renderer, the validator, completion and future backlinks — LSP and
  render must never disagree on syntax. The contract is frozen before parallel work starts:

  ```ts
  type MarkdownRef = {
    kind: 'element' | 'view' | 'unknown'
    namespace: string | null // 'view', an unknown prefix, or null
    target: string
    label: string | null
    range: { start: number; end: number } // the whole [[…]], offsets in `md`
    targetRange: { start: number; end: number } // target only: diagnostics, definition
  }
  ```
- `to-html.ts` — remark plugin turns a ref into `<a data-likec4-ref="…" data-likec4-ref-kind="…">`
  with fallback text (`label` or target). `rehype-sanitize` schema is extended to allow these
  attributes. The model is **not** passed into `markdownToHtml`, so its LRU cache and purity are
  kept.
- `to-text.ts` — a ref becomes `label` if present, otherwise the target. No raw `[[…]]` leaks
  into plain text.
- A helper with a resolver `(ref) => title | null` for consumers that have the model.

### LSP (`packages/language-server`)

Positions: the parser dedents and trims Markdown (`model/parser/Base.ts`), so offsets in `{ md }`
do not match the source. All LSP features work on the **raw CST token text** of the
`MarkdownString` and map `extractRefs` offsets back through the dedent (one shared mapper).

Resolving targets reuses existing indexes; both return `AstNodeDescription`, so completion items
and `LocationLink`s are built by the same code (the key is `desc.id` for elements, `desc.name`
for views):

- **Elements** — `FqnIndex` (`model/fqn-index.ts`). `byFqn(projectId, fqn)` (cached) for
  validation and definition. Completion needs a new `FqnIndex.elements(projectId)`: all
  `AstNodeDescriptionWithFqn` of the project (`_byfqn` across documents, same `workspaceCache`).
  `IndexManager.projectElements(projectId, ast.Element.$type)` is **not** enough: the global
  index exports only top-level elements, by short name (`references/scope-computation.ts`).
- **Views** — `IndexManager.projectElements(projectId, ast.LikeC4View.$type)`, matched by
  `desc.name` (as in `validation/view.ts`). Nothing new to add.
- Future `deployment:` namespace — `deployments-index.ts` returns the same
  `AstNodeDescriptionWithFqn`.

- **Completion** (`lsp/CompletionProvider.ts`). Langium offers nothing inside string tokens, so
  completion is handled explicitly: find the leaf under the cursor (`findLeafNodeAtOffset`, as in
  `CodeActionProvider.ts`), detect an unclosed `[[` before the cursor.
  - After `[[` — elements of the current project, filtered by **substring over the whole FQN**
    (`[[api` finds `cloud.backend.api`); label = FQN, detail = title and kind; plus a `view:` item.
  - After `[[view:` — views of the project.
  - Closing `]]` is inserted when missing.
  - Add `[` to trigger characters (currently `.` and `#`).
- **Validation** — warning (not error) for unresolved targets and unknown namespaces. A broken
  link must never break the model.
- **Go to definition** — override of the Langium `DefinitionProvider`: a ref under the cursor
  becomes `LocationLink`s from `desc.documentUri` + `desc.nameSegment` (several, if `byFqn`
  returns several). Gives Ctrl+click, F12 and Peek Definition. `DocumentLinkProvider` is not
  used: it only opens a URI and would need `#L…` fragments.

### VSCode (`packages/vscode`)

- `configurationDefaults` for `[likec4]` enabling `editor.quickSuggestions.strings`, otherwise
  suggestions do not appear while typing inside strings.
- TextMate injection highlighting `[[…]]` inside `meta.embedded.block.markdown`. Kept in sync in
  all three copies: `packages/vscode`, `apps/playground`, `apps/docs` `likec4.tmLanguage.json`.

### Diagram (`packages/diagram`)

Refs are resolved at render time, where the model is available via `LikeC4ModelProvider`.

- Existing target: substitute title (unless a label is given), style as an inline link, tooltip
  with title and kind.
- Missing target: dimmed text, no click, tooltip "not found".
- Click on an element ref opens the element details card; inside an open card it **replaces**
  the card content (no stack, no "back"). Click on a view ref navigates to the view.
  Implemented as a delegated click handler on the `Markdown` primitive.
- Clickable only in overlays (details card, relationship popover, notes, view details,
  walkthrough). Inside diagram nodes on the canvas a ref is styled text without click, so it
  does not fight with select / drag / double-click.
- When element details or navigation are disabled by the consumer (e.g. `@likec4/react`),
  refs render as plain text.

### Exports

Non-interactive outputs show the resolved title (or label) as plain text: PlantUML, MCP,
Draw.io, Markdown export use the resolver helper. The LikeC4 DSL generator keeps raw `[[…]]`
(round-trip).

## Delivery

1. **PR 1 — Markdown + LSP**: `extractRefs`, `to-html` / `to-text` plugins, sanitize schema,
   completion, validation, go to definition, `quickSuggestions` default, TextMate highlighting,
   changeset. Until PR 2 lands, the diagram shows refs as plain fallback text (label or target),
   without click.
2. **PR 2 — UI and exports**: resolving in diagram, click handling, tooltips, broken-link style,
   resolver in generators and MCP, docs page in `apps/docs`, `skills/likec4-dsl` update,
   changeset.

## Work breakdown (PR 1)

Each stream works in its own worktree branched from `main` (run `pnpm generate` first) and
merges into `feat/markdown-element-links`, which becomes PR 1.

**Wave 1** — starts immediately, no shared files:

| Stream             | Scope                                                                                                      | Files                                                                 | Depends on                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| **A — core**       | `extractRefs` + tests, `to-html` / `to-text` plugins, sanitize schema                                      | `packages/core/src/utils/markdown/`                                   | `MarkdownRef` only                                    |
| **C — completion** | unclosed `[[` under the cursor, elements + `view:` + views, closing `]]`, trigger `[`, `FqnIndex.elements` | `lsp/CompletionProvider.ts`, `model/fqn-index.ts`                     | nothing (no `extractRefs`: the ref is not closed yet) |
| **F — vscode**     | TextMate injection, `quickSuggestions.strings` default                                                     | `packages/vscode/package.json`, three `likec4.tmLanguage.json` copies | nothing                                               |

**Wave 2** — one stream after A is merged (stream A can continue with it):

| Stream                       | Scope                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| **B+D+E — positions & refs** | shared offset mapper (dedent, `'''` / `"""`, CRLF) with tests → validator warnings → `DefinitionProvider` |

The mapper is shared by validation and definition, so these are not split between agents.

Merge order: A → C, F (any order) → B+D+E → changeset.

## Out of scope (later)

- Rename and find references across Markdown refs (our `RenameProvider` is empty and disabled).
- Backlinks: "Mentioned in" section in the details card (enabled by `extractRefs`).
- Refs to deployment nodes, relations, and elements of imported projects (via namespaces).
- Card stack with "back" navigation.
- LSP inside external `.md` files referenced by `descriptionFile`.
