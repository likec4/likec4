#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const entries = execFileSync('git', ['ls-files', '-s'], {
  cwd: root,
  encoding: 'utf8',
}).split('\n').filter(Boolean).map(line => {
  const [metadata, file] = line.split('\t')
  return { mode: metadata.split(' ')[0], file }
})
const tracked = entries.map(entry => entry.file)

const failures = []

const absolute = relativePath => path.join(root, relativePath)
const isTracked = relativePath => tracked.includes(relativePath)
const read = relativePath => readFileSync(absolute(relativePath), 'utf8')
const fail = message => failures.push(message)
const stripCarriageReturns = content => content.replace(/\r/g, '')

const requireTrackedFile = relativePath => {
  if (!isTracked(relativePath)) {
    fail(`${relativePath} must be tracked`)
    return false
  }
  if (
    entries.some(entry => entry.file === relativePath && entry.mode === '120000')
    || (existsSync(absolute(relativePath)) && lstatSync(absolute(relativePath)).isSymbolicLink())
  ) {
    fail(`${relativePath} must be a regular file, not a symlink adapter`)
    return false
  }
  if (!existsSync(absolute(relativePath))) {
    fail(`${relativePath} must exist`)
    return false
  }
  return true
}

const requireIncludes = (content, needle, label, source = 'AGENTS.md') => {
  if (!content.includes(needle)) {
    fail(`${source} must contain ${label}: ${needle}`)
  }
}

const requireNotIncludes = (content, needle, label) => {
  if (content.includes(needle)) {
    fail(`Repository guidance must not contain stale ${label}: ${needle}`)
  }
}

requireTrackedFile('AGENTS.md')

if (requireTrackedFile('CLAUDE.md')) {
  const claude = stripCarriageReturns(read('CLAUDE.md'))
  if (claude !== '@AGENTS.md\n') {
    fail('CLAUDE.md must contain exactly "@AGENTS.md" plus a trailing newline')
  }
}

const trackedAgentsFiles = tracked.filter(file => path.basename(file).toLowerCase() === 'agents.md')
const nestedAgentsFiles = trackedAgentsFiles.filter(file => file !== 'AGENTS.md' && path.basename(file) === 'AGENTS.md')
if (nestedAgentsFiles.length > 0) {
  fail(`Only root AGENTS.md is allowed; remove nested files: ${nestedAgentsFiles.join(', ')}`)
}

const caseVariantAgentsFiles = trackedAgentsFiles.filter(file => path.basename(file) !== 'AGENTS.md')
if (caseVariantAgentsFiles.length > 0) {
  fail(`Do not track AGENTS.md case variants: ${caseVariantAgentsFiles.join(', ')}`)
}

const trackedAgentSingularFiles = tracked.filter(file => path.basename(file).toLowerCase() === 'agent.md')
if (trackedAgentSingularFiles.length > 0) {
  fail(`Do not track AGENT.md files: ${trackedAgentSingularFiles.join(', ')}`)
}

if (existsSync(absolute('AGENT.md'))) {
  fail('Do not create root AGENT.md; use AGENTS.md')
}

const allowedNestedClaudeFiles = new Map([
  [
    'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md',
    '@../../../../../AGENTS.md\n\nClaude Code local memory: follow the sequence and webapp rules routed by the imported root `AGENTS.md`.\n',
  ],
])
const trackedClaudeFiles = tracked.filter(file => path.basename(file) === 'CLAUDE.md')
const unexpectedClaudeFiles = trackedClaudeFiles.filter(file =>
  file !== 'CLAUDE.md' && !allowedNestedClaudeFiles.has(file)
)
if (unexpectedClaudeFiles.length > 0) {
  fail(
    `Only root CLAUDE.md and explicitly allowed localized Claude memories are allowed; remove package adapters: ${
      unexpectedClaudeFiles.join(', ')
    }`,
  )
}

for (const [relativePath, expectedContent] of allowedNestedClaudeFiles) {
  if (!isTracked(relativePath)) {
    continue
  }

  const content = stripCarriageReturns(read(relativePath))
  if (content !== expectedContent) {
    fail(`${relativePath} must import AGENTS.md and contain only the approved local pointer`)
  }
}

if (isTracked('.github/copilot-instructions.md')) {
  fail('Remove .github/copilot-instructions.md; keep AGENTS.md as the only broad shared instruction source')
}

if (existsSync(absolute('.github/copilot-instructions.md'))) {
  fail('Do not keep local .github/copilot-instructions.md without a generated-adapter drift check')
}

if (existsSync(absolute('AGENTS.md'))) {
  const agents = read('AGENTS.md')
  const referenceSections = new Map([
    ['project-map.md', ['## Project Structure & Module Organization']],
    ['model-api.md', [
      '## Public API entry files',
      '## Model stages',
      '## Composite TypeScript project gotcha',
      '## Builder type-loss when loading from runtime data',
      '## DSL writeback is lossy',
      '## Package-specific instructions',
      '### packages/core',
      '### packages/language-server',
      '### packages/language-services',
    ]],
    ['webapp.md', [
      '## App ↔ Language Server Architecture',
      '## Package-specific instructions',
      '### packages/diagram',
      '### packages/likec4-spa',
      '### packages/vite-plugin',
    ]],
    ['sequence.md', ['## Package-specific instructions', '### packages/diagram/src/likec4diagram/xyflow-sequence']],
  ])
  const guidanceFiles = new Map([['AGENTS.md', agents]])
  const routeTriggers = new Map([
    ['project-map.md', ['locate packages', 'bridge documentation']],
    ['model-api.md', [
      '`packages/core`',
      '`packages/language-server`',
      '`packages/language-services`',
      '`packages/generators`',
      '`packages/likec4`',
    ]],
    ['webapp.md', [
      '`packages/diagram`',
      '`packages/likec4-spa`',
      '`packages/vite-plugin`',
      '`packages/likec4` static-site builds',
      '`./internal` consumers',
    ]],
    ['sequence.md', [
      '`packages/diagram/src/likec4diagram/xyflow-sequence/`',
      '`packages/layouts/src/sequence/`',
      '`packages/layouts/src/graphviz/GraphvizLayoter.ts`',
      'Also read webapp rules when',
      'working in the diagram dev copy',
    ]],
  ])
  const routingBullets = agents.match(/^- .*(?:\n[ \t]+.*)*/gm) ?? []
  for (const [name, sections] of referenceSections) {
    const relativePath = `devops/agent-instructions/${name}`
    requireIncludes(agents, `](${relativePath})`, 'task reference link')
    const route = routingBullets.find(bullet => bullet.includes(`](${relativePath})`)) ?? ''
    for (const trigger of routeTriggers.get(name)) {
      requireIncludes(route, trigger, `routing trigger for ${relativePath}`)
    }
    if (agents.includes(`@${relativePath}`)) {
      fail(`${relativePath} must be read on demand, not eagerly imported`)
    }
    if (requireTrackedFile(relativePath)) {
      const content = read(relativePath)
      guidanceFiles.set(relativePath, content)
      for (const section of sections) {
        if (agents.split('\n').includes(section)) {
          fail(`${section} belongs in ${relativePath}, not the always-loaded root`)
        }
        if (!content.split('\n').includes(section)) {
          fail(`${relativePath} must contain required section: ${section}`)
        }
      }
    }
  }
  const guidance = [...guidanceFiles.values()].join('\n')

  const requiredSections = [
    '# Repository Guidelines',
    '## Read task guidance before work',
    '## Build, Test, and Development Commands',
    '## Generated Files',
    '## Coding Style & Naming Conventions',
    '## Testing Guidelines',
    '## Commit, Pull Request, and Changeset Guidelines',
    '## Tooling and Adapter Policy',
  ]

  for (const section of requiredSections) {
    requireIncludes(agents, section, 'required section')
  }

  const requiredPhrases = new Map([
    ['AGENTS.md', [
      'AGENTS.md is the canonical shared repository instruction file.',
      'Before planning, editing, or reviewing, read each reference that matches the task, including cross-package work.',
      'Read these files explicitly; do not depend on automatic nested instruction or skill discovery.',
      'The root `CLAUDE.md` file is the Claude Code adapter and must contain exactly `@AGENTS.md`.',
      'Nested `CLAUDE.md` files are not shared adapters. Keep one only when Claude Code\'s lazy-loaded subtree memory should point agents at materially local guidance routed by AGENTS.md; it must import AGENTS.md and contain only a short pointer, not copied rules.',
      'Do not create `AGENT.md`.',
      'Do not use symlink adapters for shared repository instructions; this repository has Windows CI and Windows contributors.',
      'Always use `patch` changesets; versioning is handled manually by maintainers.',
      '`packages/config/schema.json` is generated from `packages/config/src/schema.ts`',
      'VS Code and GitHub Copilot coding-agent/code-review surfaces can consume `AGENTS.md`.',
      'DSL writeback loses comments, source positions, and formatting',
      'Keep data access out of `packages/diagram`',
      'RPC is dev-only;',
      'production diagrams are read-only.',
      'Do not import `@likec4/language-server` into SPA',
      '`@likec4/layouts` into diagram.',
      'For core view changes, update drift detection and auto-applying logic;',
      'ask if drift behavior is unclear.',
    ]],
    ['devops/agent-instructions/project-map.md', [
      '`packages/tsconfig/` contains shared TypeScript configuration.',
    ]],
    ['devops/agent-instructions/model-api.md', [
      'does not preserve comments, source positions, or original formatting',
      '`Builder` in `packages/core/src/builder/` uses a phantom-type ledger',
      'computed and layouted data may also carry saved `manualLayouts`.',
      'Do not edit files in `packages/language-server/src/generated` or `packages/language-server/src/generated-lib`.',
      'Node-only helpers that import `node:fs`, `node:path`, or similar modules go in `packages/language-services/src/node/index.ts`.',
    ]],
    ['devops/agent-instructions/webapp.md', [
      '`src/rpc/functions/` contains handlers such as `updateView.ts` and `calcAdhocView.ts`.',
      '`@xstate/store` is available as a dependency, but current source does not import it.',
      'Do not treat package shims or build output such as `packages/diagram/adhoc-editor/package.json`, `lib/`, or `dist/` as active source layers.',
      'Do not import Vite virtual modules (`likec4:*`) or call the language server from `packages/diagram`.',
      'No XState in `packages/likec4-spa`.',
      'Do not import `@likec4/language-server` directly from `packages/likec4-spa`',
      'RPC is dev-only.',
      'Do not assume RPC is available in production builds',
      'Imports from `@likec4/language-server` in `packages/vite-plugin` must be type-only.',
      'Talk to the Language Server only through `likec4:rpc` from `@likec4/vite-plugin`.',
      'The runtime language service instance comes from `@likec4/language-services/node` (`fromWorkspace`) or through the `languageServices` plugin option.',
    ]],
    ['devops/agent-instructions/sequence.md', [
      'Never import `@likec4/layouts` from `packages/diagram`.',
      'Always diff the two directories before syncing; do not assume they are currently identical.',
      'After porting, run tests in both packages because `utils.spec.ts` exists in each.',
    ]],
  ])

  for (const [relativePath, phrases] of requiredPhrases) {
    const content = guidanceFiles.get(relativePath) ?? ''
    for (const phrase of phrases) {
      requireIncludes(content, phrase, 'required preserved rule', relativePath)
    }
  }

  const stalePhrases = [
    '## Source preservation map',
    '`schemas/likec4-config.schema.json`',
    '`adhoc-editor/` is a separate code path',
    '`adhoc-editor/` is intentionally internal',
    '`adhoc-editor/state/panel.tsx`',
    'implement the handler in `src/rpc/`',
    'GitHub Copilot and VS Code support `AGENTS.md` natively',
    'production usage is in `packages/language-server/src/model-change/viewChange.ts`',
    'only `views` differs',
    'or `pnpm generate` before typechecking downstream',
    '`routeTree.gen.ts` is generated by `tsr generate` through `pnpm generate`',
    'internal packages that are never published such as `@likec4/icons`',
    'and `handleHotUpdate`, and registers the virtual-module list',
    'All cross-process data comes from `likec4:*` virtual modules',
    'Add re-exports only; do not put original logic here',
  ]

  for (const phrase of stalePhrases) {
    requireNotIncludes(guidance, phrase, 'repository instruction')
  }
}

const duplicatedChangesetPolicyPhrases = [
  'Always use `patch` changesets',
  'Write changeset summaries from the user',
  'Do not mention test changes, internal refactors, config changes, cleanup, or dependency bumps',
  'Internal packages that are never published',
]

const requireTaskWrapperDefersToAgents = relativePath => {
  if (!isTracked(relativePath)) {
    return
  }

  const content = read(relativePath)
  if (!content.includes('AGENTS.md is the canonical source for shared LikeC4 repository instructions')) {
    fail(
      `${relativePath} must declare AGENTS.md as the canonical shared instruction source`,
    )
  }

  const duplicatedPolicy = duplicatedChangesetPolicyPhrases.filter(phrase => content.includes(phrase))
  if (duplicatedPolicy.length > 0) {
    fail(`${relativePath} must defer shared changeset policy to AGENTS.md instead of duplicating it`)
  }
}

requireTaskWrapperDefersToAgents('.github/agents/changeset-generator.agent.md')
requireTaskWrapperDefersToAgents('.agents/skills/changeset-generator/SKILL.md')

if (failures.length > 0) {
  console.error('Agent instruction validation failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Agent instruction validation passed')
