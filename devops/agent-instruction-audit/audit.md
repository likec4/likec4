# Instruction loading audit

Evidence for this change, not an additional instruction source. Date: 2026-10-26.
Base: `origin/main` at `c2c98af43bdfb333f0ab2504fe3414a011cb9661`.

## Decision and Ponytail review

Use one root router and four plain Markdown references. Keep shared build, generated-file,
style, testing, changeset, and adapter policy in AGENTS.md. Keep short warnings for lossy
DSL writeback, production RPC absence, forbidden imports, and core view drift in the root.
Move detailed task rules verbatim. Read matching references before planning, editing, or review.
This is instruction-based routing, not a new automatic loader.

Applied the original `/home/ckeller/src/ponytail/skills/ponytail/SKILL.md` as a design review.
Specific recommendation: use explicit Markdown pointers already understood by each tool;
skip new skills, nested instruction trees, generated adapters, dependencies, and a custom loader.
Never cut trust-boundary validation, data-loss safeguards, error handling, security,
accessibility, or requested constraints. The lossy-writeback warning and layer boundaries remain.
Ponytail was a skill used by the implementing agent, not an independent reviewer process.

The [preservation map](preservation-map.md) inventories all 244 nonblank baseline lines.
242 lines are preserved exactly; two adapter-policy lines now allow root-routed task references.
Package container headings remain in the scoped references. No substantive rule was deleted.
The map is historical evidence and contains locations, not copied rule bodies.

## Primary documentation checked

- [AGENTS.md standard](https://agents.md/): hierarchical guidance and nearest-file precedence.
  It does not establish identical discovery behavior for every implementation.
- [Codex instruction discovery](https://developers.openai.com/codex/guides/agents-md/):
  the startup chain runs from project root to current working directory, with a size cap.
  A nested file elsewhere in the repo is not a universal startup guarantee.
- [Codex review rules](https://developers.openai.com/blog/custom-code-review-rules-for-codex):
  scope consequential review invariants; keep repository-wide rules at root.
- [Astra prompt and skill guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra):
  narrow skill triggers and progressive disclosure reduce irrelevant loaded context.
- [Claude memory](https://code.claude.com/docs/en/memory): ancestor CLAUDE.md files and their imports load
  initially; subtree memory loads on demand. Current Claude also supports configurable AGENTS.md discovery.
  The existing `@AGENTS.md` adapter remains supported and avoids Windows symlink requirements.
- [Claude skills](https://code.claude.com/docs/en/skills): skill bodies load when used;
  `.claude/skills/` remains a supported discovery path.
- [Cursor rules](https://cursor.com/docs/rules): current docs support nested AGENTS.md by file scope.
  Older legacy docs still describe it as planned; use the current documentation.
- [Cursor skills](https://cursor.com/docs/skills): `.agents/skills/` and compatibility directories are supported.
- [Pi usage](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/usage.md)
  and [Pi skills](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md):
  startup context and skill discovery depend on the working directory; full skill text loads when needed.

Nested AGENTS.md could save context in Codex/Cursor, but Claude compatibility and Pi's ancestor loading
would require additional routing or adapters. Eager root imports would erase the savings.
New skills would add metadata and adapter maintenance without making mandatory guidance more reliable.
Plain references need only the explicit root instruction and existing read tools.
The root remains the canonical entry and shared policy; each reference owns its task details once.
No nested AGENTS.md, new skill, instruction symlink, or second tool-specific rule body was added.

## Installed-tool evidence

- Codex CLI `0.164.0`: called app-server `initialize` and `skills/list` with this worktree in `cwds`.
  It returned all seven repo-local `.agents/skills/*/SKILL.md` entries. No new skill is required.
- Claude Code `2.1.310`: version and requested `claude-opus-4-8` smoke test passed (`claude-ok`).
  The root adapter remains exactly `@AGENTS.md`; the localized sequence adapter now points through root
  routing to the sequence reference without eagerly importing it.
- Pi `0.87.1`: requested DeepSeek V4 Pro was listed and smoke test passed (`pi-ok`).
  Called installed `loadProjectContextFiles`: it returned the home instruction file and this worktree's
  AGENTS.md, with none of the four references. `AGENTS.md` takes priority over same-directory CLAUDE.md.
  Inspected installed `collectAncestorAgentsSkillDirs` and invoked installed `loadSkills` with its project
  `.agents/skills` path: all seven skills loaded. A direct default-only `loadSkills` call omits the package
  manager's added Agent Skills paths; that helper alone is not full startup discovery.
- Cursor Agent `2026.10.22-27dcf5f`: availability check and `cursor-grok-4.6-high` smoke test passed
  (`cursor-ok`). Full review uses ask mode and a unique review ID.

These are real installed-tool checks, not proof of every remote/UI version or model's compliance.
The reviews also exercise explicit reads of the local root, references, and preservation map.
Audit evidence lives separately in `devops/agent-instruction-audit/`; it is not routed task guidance.

## Size measurement

Measured with Python `tiktoken` 0.14.0 and `o200k_base`, without chat framing or tool metadata.
Counts describe repository instruction text only. They are not provider billing measurements.
The original Tokensmith numbers (about 5,886/6,083) use a different audit context;
do not mix those denominators with this local count. Other worktrees are alternative sessions,
not additional simultaneous savings, and were not edited.

- Baseline root: 323 lines, 25,251 bytes, 6,094 tokens.
- Final root: 113 lines, 8,431 bytes, 1,896 tokens.
- Root reduction: 210 lines (65.0%) and 4,198 tokens (68.9%).
- Project map: 34 lines, 565 tokens.
- Model/API reference: 72 lines, 1,325 tokens.
- Webapp reference: 105 lines, 2,381 tokens.
- Sequence reference: 41 lines, 516 tokens.
- Routine task without a matching reference: 113 lines, 1,896 tokens.
- Model/API task: 185 lines, 3,221 tokens (47.1% below baseline).
- Webapp task: 218 lines, 4,277 tokens (29.8% below baseline).
- Layouts-only sequence task: 154 lines, 2,412 tokens (60.4% below baseline).
- Diagram sequence task, including webapp rules: 259 lines, 4,793 tokens (21.3% below baseline).
- Root plus all references: 365 lines, 6,683 tokens (9.7% above baseline).

Effective totals below are sums of measured file counts, assuming each matching reference is read once.
The actual reduction in a live session is inferred; agents can reread files or load unrelated material.
A task requiring every reference spends more total text than the original root due to routing overhead.
The benefit is lower routine startup context and lower context for focused tasks.
The project map adds its measured size only when package navigation is needed.
No fresh-session billing or Tokensmith audit was run. This already-running session received the old
instructions in the user prompt; it cannot demonstrate the future startup saving.

## Validation and independent reviews

Run `pnpm check:agent-instructions`, `git diff --check`, and focused dprint checks.
New negative cases cover missing references, unreachable links, eager imports, removed sections/rules,
and symlink instruction adapters even when Git checks them out as plain files on Windows.
Existing adapter and skill tests remain in the required command. Additional negative cases pin
shared policy to root, package rules to the owning reference, package routing triggers to their links,
and detailed sections outside the root. The checker remains a curated drift check, not a semantic proof
of all future edits; the line inventory documents this migration.

The initial check failed because the isolated worktree had no `skills-ref` dependency.
The PATH pnpm was 9.15.9; it could not parse the pnpm 12 lockfile's multiple documents.
Used repository-pinned pnpm 12.14.0 with `--frozen-lockfile --ignore-scripts`.
The offline attempt missed `nanoid@6.0.2`; the online install completed without lockfile changes.
No dependency skill approvals, user-scope links, or other worktrees were changed.

Initial final-diff review completed independently with all three requested reviewers, all exit 0:

- Claude, `claude-opus-4-8`: approved with no blockers. Found one duplicate-heading map destination
  and suggested conditional sequence routing and package-routing coverage.
- Pi, `nvidia-inference/nvidia/deepseek-ai/deepseek-v4-pro`: no critical/major findings and no lost rules.
  Suggested conditional sequence routing, stronger boundary checks, accurate diagnostic filenames,
  and separation of evidence from live guidance. Output used a JSON array rather than JSONL;
  findings were read directly without inventing normalized fields.
- Cursor, `cursor-grok-4.6-high`: approved with no blockers. Found the same map row, root-policy
  placement checking, a static-site routing gap, evidence placement, and an ambiguous localized pointer.

Resolved these findings: corrected baseline line 246 to the SPA `State management:` label;
made sequence routing conditional on diagram work; added static-site routing; pinned shared and package
rules to their owner; strengthened high-risk RPC/runtime/sync checks; added routing and root-bloat tests;
made diagnostics name the owning file; moved historical evidence out of the live reference directory;
and simplified the localized pointer to name both sequence and webapp rules through root routing.
All 244 nonblank baseline lines were checked again after these fixes.
Reviewer file hashes and Git status matched before/after the first round; no reviewer edits occurred.
The revised full diff was approved independently by Claude, Pi, and Cursor, all exit 0, with no blockers.
No reviewer changed task files; hash and Git-status comparisons passed again.
Their remaining suggestions led to a small closing change: add package container headings so sections
have correct Markdown parents; pin root critical warnings, lossy-writeback body, production RPC and SPA
import restrictions; pin `./internal`, conditional sequence routing, and the production sequence call site;
restore the stale-map-heading guard; add negative cases for these checks. The final delta was checked
by all three reviewers with the full diff, baseline, and updated preservation map available locally.

Closing review results (all exit 0):

- Claude, `claude-opus-4-8`, review `642ff2cabe064b6c9e81d54cf898d4c3`: approved, no blockers.
  Confirmed the final heading/routing/guard/test changes. Noted future first-occurrence test brittleness;
  it is not a current failure and remains part of ordinary test maintenance.
- Pi, `nvidia-inference/nvidia/deepseek-ai/deepseek-v4-pro`, review `e08e114a18b544f79ac6fce1633cea0b`: approved, no findings.
  Independently verified the closing delta against all three preceding reviews.
- Cursor, `cursor-grok-4.6-high`, review `3720c737d29f4cf49fb77c4f2308fc53`: approved, no findings.
  Noted sampled negative-test coverage; the checker still requires the un-sampled condition phrases.

Implementing-agent judgment: all concrete migration findings are resolved. Keep the checker curated;
do not add exhaustive snapshots of every rule. The preservation map was verified row by row against
all 244 nonblank baseline lines: 242 exact destinations and two documented policy updates.
Task-file hashes and Git status matched before/after every review round. No reviewer mutation occurred.
Final validation passed: `pnpm check:agent-instructions` (34 tests and both validators),
`git diff --check`, staged diff whitespace checks, focused dprint, and focused oxlint.

No package runtime behavior changed. Package builds, full runtime suites, and deployment were not run.
No PR was created or merged; this task has no deployment step.
