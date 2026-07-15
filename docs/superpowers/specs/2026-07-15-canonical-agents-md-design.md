# Canonical AGENTS.md design

## Goal

Make `AGENTS.md` the single canonical source of repository instructions for AI coding assistants in LikeC4.
`CLAUDE.md` and any other tool-specific instruction files should be adapters, not independent sources of truth.

The root `CLAUDE.md` must contain exactly:

```md
@AGENTS.md
```

Claude-only rules should be added to `CLAUDE.md` only if they are genuinely Claude-specific. This migration does not
need any Claude-only rules.

## Current state

- The repository has a root `CLAUDE.md` with broad shared instructions.
- There is no root `AGENTS.md`.
- Several package-level `CLAUDE.md` files contain important scoped rules:
  - `packages/core/CLAUDE.md`
  - `packages/diagram/CLAUDE.md`
  - `packages/language-server/CLAUDE.md`
  - `packages/language-services/CLAUDE.md`
  - `packages/likec4-spa/CLAUDE.md`
  - `packages/vite-plugin/CLAUDE.md`
  - `packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md`
- `.github/copilot-instructions.md` exists and currently contains broad shared repository instructions. It is a competing
  source of truth and must be migrated in this pass.
- `.github/agents/*.agent.md` files are task-specific GitHub agent definitions, not general repository instruction files.
  They may remain task wrappers, but any shared repository policy they contain must be moved into `AGENTS.md` or checked
  for drift.

## Recommended architecture

Use one canonical file at the repository root:

```text
AGENTS.md   # canonical shared repository instructions
CLAUDE.md   # root Claude adapter, exactly "@AGENTS.md"
```

Fold all existing shared and package-specific Claude guidance into root `AGENTS.md`. Preserve package specificity by
using scoped sections instead of separate rule bodies:

```md
## Repository guidelines

...

## Package-specific instructions

### packages/core

...

### packages/diagram

...
```

Package-level `CLAUDE.md` files should stop being sources of truth. Default to removing package-level adapters after
their contents are folded into root `AGENTS.md`; keep one only when a verified tool-discovery behavior requires a
directory-local file. For retained package adapters, use a tiny relative import to the root canonical file, for example:

```md
@../../AGENTS.md
```

For deeply nested directories, use the correct relative path to root. These adapters must contain only one import line.
The validation script must resolve every adapter target and prove that it points to the root `AGENTS.md`.

Do not create `AGENT.md`. `AGENTS.md` is the canonical agent-agnostic convention.

## Adapter policy for other tools

Document this policy in `AGENTS.md`:

- Tools with native `AGENTS.md` support should read `AGENTS.md` directly.
- Tool-specific files with import support should import `AGENTS.md`.
- Tools without import support may use generated plain-text adapters derived from `AGENTS.md`.
- Do not use symlink adapters; this repository has Windows CI and Windows contributors, and plain-text adapters are safer.
- Any generated or retained adapter must have a drift check in CI and a local validation script.
- Do not duplicate repository instructions into a second long-lived source of truth.

`.github/copilot-instructions.md` must follow this policy. During implementation, verify whether the current GitHub
Copilot instruction surface supports imports. If it does, reduce the file to an import of root `AGENTS.md` plus any
Copilot-only delta. If it does not, reduce it to a generated plain-text adapter that clearly points to root `AGENTS.md`
and contains no duplicated shared repository guidance; CI must check that the generated adapter has not drifted.

`.github/agents/*.agent.md` files may remain because they define task-specific agent behavior. Shared policies currently
embedded there, such as LikeC4's changeset policy, must be represented canonically in `AGENTS.md`. The GitHub agent files
may keep task workflow details but should not be the only place a shared repository rule is documented.

## Content design for AGENTS.md

`AGENTS.md` should be concise but complete. It should contain:

1. Repository purpose and monorepo structure.
2. App ↔ language-server architecture and the correct layer for common changes.
3. Public API entry files and model-stage guidance.
4. Build, generation, test, and formatting commands.
5. Generated-file rules.
6. Coding style and pull-request expectations.
7. Tooling and adapter policy.
8. Package-specific instructions consolidated from existing package-level `CLAUDE.md` files.
9. GitHub Copilot and GitHub agent adapter/task-wrapper policy.
10. Shared changeset policy currently embedded in `.github/agents/changeset-generator.agent.md`, including the
    maintainer rule that changesets use patch bumps.

The package-specific section should preserve the useful local constraints exactly enough to prevent regressions. The
implementation must keep a traceability table mapping each existing instruction source to its destination section in
`AGENTS.md`.

- `packages/core`: model/view drift guidance and Builder phantom-type rules.
- `packages/diagram`: subdirectory layering, state-management boundaries, public API, and SPA/language-server boundary.
- `packages/language-server`: generated files and grammar-change generation/TextMate updates.
- `packages/language-services`: public API, browser-safe common module, Node-only helper boundaries, and the
  `modelBuilder.parseModel` / `modelBuilder.computeModel` / `languageServices.layoutedModel` access points.
- `packages/likec4-spa`: SPA layering, nanostores usage, virtual-module boundaries, and route generation.
- `packages/vite-plugin`: virtual-module/RPC ownership, generated-code contract, type-only language-server imports,
  no `@likec4/diagram` runtime dependency, and the dev-only nature of RPC.
- `packages/diagram/src/likec4diagram/xyflow-sequence`: mirrored sequence-layouter workflow and sync rules.
- Root `CLAUDE.md`: repository layout, App ↔ Language Server architecture, public API entry files, model stages,
  composite TypeScript project gotchas, Builder type-loss rules, DSL writeback lossy behavior, generated-file rules,
  skills/MCP/LeanIX references, build/test commands, coding style, and PR expectations.
- `.github/copilot-instructions.md`: any still-current shared repository guidance not already present in root
  `CLAUDE.md`, while dropping stale or duplicated content.
- `.github/agents/changeset-generator.agent.md`: shared changeset policy; task-specific workflow can remain in the
  GitHub agent file.

## Preservation checklist

Before replacing or deleting any existing instruction file, create a temporary source-to-destination checklist in the
implementation notes or commit message. It must include at least:

| Source file                                                    | Destination in `AGENTS.md`                                  | Required preservation                                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                    | Repository guidelines and architecture sections             | All shared root instructions, including public API, model stages, composite TS gotcha, Builder type-loss, and DSL writeback limits |
| `packages/core/CLAUDE.md`                                      | `packages/core` section                                     | View-drift guidance and Builder phantom ledger rules                                                                               |
| `packages/diagram/CLAUDE.md`                                   | `packages/diagram` section                                  | Layering, state management, public API, and app/language-server boundary                                                           |
| `packages/language-server/CLAUDE.md`                           | `packages/language-server` section                          | Generated-file and grammar/TextMate update rules                                                                                   |
| `packages/language-services/CLAUDE.md`                         | `packages/language-services` section                        | API boundaries, Node/common split, and model access points                                                                         |
| `packages/likec4-spa/CLAUDE.md`                                | `packages/likec4-spa` section                               | Layering, nanostores, no XState, virtual-module boundaries, route generation                                                       |
| `packages/vite-plugin/CLAUDE.md`                               | `packages/vite-plugin` section                              | Virtual modules, RPC, generated-code contract, and hard boundaries                                                                 |
| `packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md` | nested package section                                      | Sequence layouter mirror/sync rules and both-side test requirement                                                                 |
| `.github/copilot-instructions.md`                              | Repository guidelines, adapter policy, or generated adapter | Remove duplicated shared guidance; preserve only current non-stale rules                                                           |
| `.github/agents/changeset-generator.agent.md`                  | Changeset policy section                                    | Shared LikeC4 changeset rules; leave task workflow in the GitHub agent                                                             |

The final `AGENTS.md` should include stable section anchors matching the destination names so validation and review can
confirm that the migration did not drop a source file silently.

## Validation design

Add a lightweight repository validation script, for example `devops/check-agent-instructions.mjs`, that checks:

- Root `AGENTS.md` exists.
- Root `CLAUDE.md` contains exactly `@AGENTS.md` plus a trailing newline.
- No root `AGENT.md` exists.
- All tracked `**/CLAUDE.md` files are either the root adapter or approved one-line adapters.
- Every retained adapter resolves to the root `AGENTS.md`; superficial one-line checks are not enough.
- No adapter contains copied instruction bodies.
- No tracked `AGENT.md` exists anywhere in the repository.
- `AGENTS.md` contains required section anchors for each source listed in the preservation checklist.
- `.github/copilot-instructions.md` is either an approved import adapter or a generated plain-text adapter with no copied
  shared instruction body.
- `.github/agents/*.agent.md` files are allowed only as task-specific agent definitions; any shared policy in them must
  have a matching canonical section in `AGENTS.md`.

Expose the script through `package.json`, for example:

```json
{
  "scripts": {
    "check:agent-instructions": "node devops/check-agent-instructions.mjs"
  }
}
```

Wire the script into the existing GitHub `checks` workflow so pull requests fail if adapters drift from the canonical
policy. Prefer adding a step to an existing required Ubuntu job rather than adding a new job. If a new job is added, also
add it to the workflow's quality-gate dependency list so branch protection actually blocks on it.

The script can be a standalone `.mjs` file even though the `devops` workspace is TypeScript: it should run before package
builds and without generated outputs. If the implementation chooses a TypeScript devops command instead, it must still be
callable from a fresh checkout without a prior build step.

## Testing and review

Implementation validation should include:

- `pnpm check:agent-instructions`
- `npx -y pnpm@11.5.1 exec dprint check AGENTS.md CLAUDE.md ...` for touched Markdown and JS files, or the repository's
  existing formatting command if it covers Markdown.
- `git diff --check`
- Manual inspection that root `AGENTS.md` includes the previously distributed rules and that adapters contain only import
  lines.
- A negative sanity check for the validation script, if cheap: temporarily add an invalid adapter body or wrong target and
  verify the script fails, then revert the temporary change before committing.

## Non-goals

- Do not redesign repository architecture or package boundaries.
- Do not create `AGENT.md`.
- Do not duplicate the full `AGENTS.md` content into tool-specific files.
- Do not keep `.github/copilot-instructions.md` as a broad shared-instruction file.
- Do not use symlink adapters.
- Do not touch unrelated untracked local files.

## Open decisions resolved

- Canonical source: root `AGENTS.md`.
- Root Claude adapter: root `CLAUDE.md` containing exactly `@AGENTS.md`.
- Package guidance: consolidate into root `AGENTS.md`; remove package-level files unless a verified discovery requirement
  justifies a one-line adapter.
- Copilot guidance: migrate `.github/copilot-instructions.md` into an adapter/generated file, not a duplicated instruction
  body.
- GitHub agent files: keep task-specific files, but move shared repository policy into `AGENTS.md`.
- Initial enforcement: local validation script plus CI wiring in the existing checks workflow, scanning tracked instruction
  files repo-wide.
