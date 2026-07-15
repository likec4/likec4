#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const tracked = execFileSync('git', ['ls-files'], {
  cwd: root,
  encoding: 'utf8',
}).split('\n').filter(Boolean)

const failures = []

const absolute = relativePath => path.join(root, relativePath)
const isTracked = relativePath => tracked.includes(relativePath)
const read = relativePath => readFileSync(absolute(relativePath), 'utf8')
const fail = message => failures.push(message)
const stripCarriageReturns = content => content.replace(/\r/g, '')
const stripHtmlComments = content => content.replace(/<!--[\s\S]*?-->/g, '')
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const requireTrackedFile = relativePath => {
  if (!isTracked(relativePath)) {
    fail(`${relativePath} must be tracked`)
    return false
  }
  if (!existsSync(absolute(relativePath))) {
    fail(`${relativePath} must exist`)
    return false
  }
  return true
}

const requireIncludes = (content, needle, label) => {
  if (!content.includes(needle)) {
    fail(`AGENTS.md must contain ${label}: ${needle}`)
  }
}

const requireNotIncludes = (content, needle, label) => {
  if (content.includes(needle)) {
    fail(`AGENTS.md must not contain stale ${label}: ${needle}`)
  }
}

const requireSourceMapRow = (content, source) => {
  const escapedSourceCell = escapeRegExp(`\`${source}\``)
  const sourceRowPattern = new RegExp(`^\\|\\s*${escapedSourceCell}\\s*\\|`, 'm')
  if (!sourceRowPattern.test(stripHtmlComments(content))) {
    fail(`AGENTS.md must contain source preservation map row: ${source}`)
  }
}

requireTrackedFile('AGENTS.md')

if (requireTrackedFile('CLAUDE.md')) {
  const claude = stripCarriageReturns(read('CLAUDE.md'))
  if (claude !== '@AGENTS.md\n') {
    fail('CLAUDE.md must contain exactly "@AGENTS.md" plus a trailing newline')
  }
}

if (isTracked('AGENT.md') || existsSync(absolute('AGENT.md'))) {
  fail('Do not create root AGENT.md; use AGENTS.md')
}

const trackedAgentSingularFiles = tracked.filter(file => path.basename(file) === 'AGENT.md')
if (trackedAgentSingularFiles.length > 0) {
  fail(`Do not track AGENT.md files: ${trackedAgentSingularFiles.join(', ')}`)
}

const trackedClaudeFiles = tracked.filter(file => path.basename(file) === 'CLAUDE.md')
const unexpectedClaudeFiles = trackedClaudeFiles.filter(file => file !== 'CLAUDE.md')
if (unexpectedClaudeFiles.length > 0) {
  fail(`Only root CLAUDE.md is allowed; remove package adapters: ${unexpectedClaudeFiles.join(', ')}`)
}

if (isTracked('.github/copilot-instructions.md')) {
  fail('Remove .github/copilot-instructions.md; keep AGENTS.md as the only broad shared instruction source')
}

if (existsSync(absolute('.github/copilot-instructions.md'))) {
  fail('Do not keep local .github/copilot-instructions.md without a generated-adapter drift check')
}

if (existsSync(absolute('AGENTS.md'))) {
  const agents = read('AGENTS.md')

  const requiredSections = [
    '# Repository Guidelines',
    '## Project Structure & Module Organization',
    '## App ↔ Language Server Architecture',
    '## Public API entry files',
    '## Model stages',
    '## Build, Test, and Development Commands',
    '## Generated Files',
    '## Coding Style & Naming Conventions',
    '## Testing Guidelines',
    '## Commit, Pull Request, and Changeset Guidelines',
    '## Tooling and Adapter Policy',
    '## Package-specific instructions',
    '### packages/core',
    '### packages/diagram',
    '### packages/language-server',
    '### packages/language-services',
    '### packages/likec4-spa',
    '### packages/vite-plugin',
    '### packages/diagram/src/likec4diagram/xyflow-sequence',
    '## Source preservation map',
  ]

  for (const section of requiredSections) {
    requireIncludes(agents, section, 'required section')
  }

  const requiredPhrases = [
    'AGENTS.md is the canonical shared repository instruction file.',
    'The root `CLAUDE.md` file is the Claude Code adapter and must contain exactly `@AGENTS.md`.',
    'Do not create `AGENT.md`.',
    'Do not use symlink adapters for shared repository instructions; this repository has Windows CI and Windows contributors.',
    'Always use `patch` changesets; versioning is handled manually by maintainers.',
    '`packages/tsconfig/` contains shared TypeScript configuration.',
    '`packages/config/schema.json` is generated from `packages/config/src/schema.ts`',
    '`src/rpc/functions/` contains handlers such as `updateView.ts` and `calcAdhocView.ts`.',
    'VS Code and GitHub Copilot coding-agent/code-review surfaces can consume `AGENTS.md`.',
    '`Builder` in `packages/core/src/builder/` uses a phantom-type ledger',
    '`@xstate/store` is available as a dependency, but current source does not import it.',
    'Do not treat package shims or build output such as `packages/diagram/adhoc-editor/package.json`, `lib/`, or `dist/` as active source layers.',
    'Do not import Vite virtual modules (`likec4:*`) or call the language server from `packages/diagram`.',
    'Do not edit files in `packages/language-server/src/generated` or `packages/language-server/src/generated-lib`.',
    'Node-only helpers that import `node:fs`, `node:path`, or similar modules go in `packages/language-services/src/node/index.ts`.',
    'No XState in `packages/likec4-spa`.',
    'Imports from `@likec4/language-server` in `packages/vite-plugin` must be type-only.',
    'Never import `@likec4/layouts` from `packages/diagram`.',
  ]

  for (const phrase of requiredPhrases) {
    requireIncludes(agents, phrase, 'required preserved rule')
  }

  const stalePhrases = [
    '`schemas/likec4-config.schema.json`',
    '`adhoc-editor/` is a separate code path',
    '`adhoc-editor/` is intentionally internal',
    '`adhoc-editor/state/panel.tsx`',
    'implement the handler in `src/rpc/`',
    'GitHub Copilot and VS Code support `AGENTS.md` natively',
  ]

  for (const phrase of stalePhrases) {
    requireNotIncludes(agents, phrase, 'repository instruction')
  }

  const requiredSources = [
    'CLAUDE.md',
    'packages/core/CLAUDE.md',
    'packages/diagram/CLAUDE.md',
    'packages/language-server/CLAUDE.md',
    'packages/language-services/CLAUDE.md',
    'packages/likec4-spa/CLAUDE.md',
    'packages/vite-plugin/CLAUDE.md',
    'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md',
    '.github/copilot-instructions.md',
    '.github/agents/changeset-generator.agent.md',
  ]

  for (const source of requiredSources) {
    requireSourceMapRow(agents, source)
  }
}

if (isTracked('.github/agents/changeset-generator.agent.md')) {
  const changesetAgent = read('.github/agents/changeset-generator.agent.md')
  if (!changesetAgent.includes('AGENTS.md is the canonical source for shared LikeC4 repository instructions')) {
    fail(
      '.github/agents/changeset-generator.agent.md must declare AGENTS.md as the canonical shared instruction source',
    )
  }
}

if (failures.length > 0) {
  console.error('Agent instruction validation failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Agent instruction validation passed')
