#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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
const read = relativePath => readFileSync(absolute(relativePath), 'utf8').replace(/\r\n?/g, '\n')
const fail = message => failures.push(message)

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

requireTrackedFile('AGENTS.md')

if (requireTrackedFile('CLAUDE.md')) {
  const claude = read('CLAUDE.md')
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

const referenceDirectory = '.agents/instructions'
const referenceSections = new Map([
  ['project-map.md', ['## Project Structure & Module Organization']],
  ['model-api.md', ['## Public API entry files', '## Package-specific instructions']],
  ['webapp.md', ['## App ↔ Language Server Architecture', '## Package-specific instructions']],
  ['sequence.md', ['## Package-specific instructions', '### packages/diagram/src/likec4diagram/xyflow-sequence']],
])
const referencePath = name => `${referenceDirectory}/${name}`

const sequenceClaudePath = 'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md'
const sequenceClaudeImports = ['sequence.md', 'webapp.md'].map(name => {
  const target = referencePath(name)
  return `@${path.posix.relative(path.posix.dirname(sequenceClaudePath), target)}`
})

const trackedClaudeFiles = tracked.filter(file => path.basename(file) === 'CLAUDE.md')
const unexpectedClaudeFiles = trackedClaudeFiles.filter(file => file !== 'CLAUDE.md' && file !== sequenceClaudePath)
if (unexpectedClaudeFiles.length > 0) {
  fail(
    `Only root CLAUDE.md and explicitly allowed localized Claude memories are allowed; remove package adapters: ${
      unexpectedClaudeFiles.join(', ')
    }`,
  )
}

if (requireTrackedFile(sequenceClaudePath)) {
  const imports = read(sequenceClaudePath).trim().split('\n').filter(Boolean)
  if (
    imports.length !== sequenceClaudeImports.length ||
    imports.some((line, index) => line !== sequenceClaudeImports[index])
  ) {
    fail(`${sequenceClaudePath} must import only the sequence and webapp references`)
  }
  for (const importLine of imports) {
    if (!importLine.startsWith('@')) {
      continue
    }
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(sequenceClaudePath), importLine.slice(1)))
    if (!tracked.includes(target) || !existsSync(absolute(target))) {
      fail(`${sequenceClaudePath} import must resolve to a tracked file: ${importLine}`)
    }
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
  const rootHeadings = new Set(agents.split('\n').filter(line => /^#{1,3} /.test(line)))
  const routingSection = agents.split(/(?=^## )/m).find(section =>
    section.startsWith('## Read task guidance before work\n')
  ) ?? ''
  const routeTargets = [...routingSection.matchAll(/\]\(\s*([^)]*?)\s*\)/g)].map(match => match[1].trim())

  for (const [name, sections] of referenceSections) {
    const relativePath = referencePath(name)
    if (routeTargets.filter(target => target === relativePath).length !== 1) {
      fail(`AGENTS.md must link exactly once to task reference: ${relativePath}`)
    }
    if (agents.includes(`@${relativePath}`)) {
      fail(`${relativePath} must be read on demand, not eagerly imported`)
    }
    if (!requireTrackedFile(relativePath)) {
      continue
    }
    const referenceHeadings = new Set(read(relativePath).split('\n').filter(line => /^#{1,3} /.test(line)))
    for (const section of sections) {
      if (rootHeadings.has(section)) {
        fail(`${section} belongs in ${relativePath}, not the always-loaded root`)
      }
      if (!referenceHeadings.has(section)) {
        fail(`${relativePath} must contain required section: ${section}`)
      }
    }
  }

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
    if (!rootHeadings.has(section)) {
      fail(`AGENTS.md must contain required section: ${section}`)
    }
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
