#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatter, validateMetadata } from 'skills-ref'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const trackedEntries = execFileSync('git', ['ls-files', '-s'], {
  cwd: root,
  encoding: 'utf8',
}).split('\n').filter(Boolean).map(line => {
  const match = line.match(/^(\d{6}) [0-9a-f]+ \d\t(.+)$/)
  if (!match) {
    throw new Error(`Unexpected git ls-files output: ${line}`)
  }
  return {
    mode: match[1],
    file: match[2],
  }
})

const tracked = new Map(trackedEntries.map(entry => [entry.file, entry]))
const failures = []

const expectedClaudeSkillLinks = new Map([
  ['.claude/skills/add-new-element-shape', '../../.agents/skills/add-new-element-shape'],
  ['.claude/skills/changeset-generator', '../../.agents/skills/changeset-generator'],
  ['.claude/skills/dispatching-parallel-agents', '../../.agents/skills/dispatching-parallel-agents'],
  ['.claude/skills/likec4-cli-codegen-regression', '../../.agents/skills/likec4-cli-codegen-regression'],
  ['.claude/skills/likec4-dsl', '../../skills/likec4-dsl'],
  ['.claude/skills/likec4-gh-pr-triage', '../../.agents/skills/likec4-gh-pr-triage'],
  ['.claude/skills/likec4-issue-repro', '../../.agents/skills/likec4-issue-repro'],
  ['.claude/skills/likec4-project-config-workflow', '../../.agents/skills/likec4-project-config-workflow'],
  ['.claude/skills/refactor', '../../.agents/skills/refactor'],
  ['.claude/skills/vscode-extension-screenshot-evidence', '../../.agents/skills/vscode-extension-screenshot-evidence'],
])

const fail = message => failures.push(message)
const absolute = relativePath => path.join(root, relativePath)
const read = relativePath => readFileSync(absolute(relativePath), 'utf8').replace(/\r/g, '')
const gitPathJoin = (...segments) => path.posix.normalize(path.posix.join(...segments))
const legacyLikeC4SkillMetadataFields = new Set([
  'disable-model-invocation',
])

const validateSkillFile = relativePath => {
  if (!existsSync(absolute(relativePath))) {
    fail(`${relativePath} must exist`)
    return
  }

  let metadata
  let body
  try {
    const parsed = parseFrontmatter(read(relativePath))
    metadata = parsed[0]
    body = parsed[1]
  } catch (error) {
    fail(`${relativePath}: ${error.message}`)
    return
  }

  const skillDir = path.posix.dirname(relativePath)
  const metadataForReferenceValidation = { ...metadata }
  for (const field of legacyLikeC4SkillMetadataFields) {
    delete metadataForReferenceValidation[field]
  }

  for (const error of validateMetadata(metadataForReferenceValidation, absolute(skillDir))) {
    fail(`${relativePath}: ${error}`)
  }

  if ('name' in metadata && (typeof metadata.name !== 'string' || !metadata.name.trim())) {
    fail(`${relativePath}: Field 'name' must be a non-empty string`)
  }

  if (
    'description' in metadata
    && (typeof metadata.description !== 'string' || !metadata.description.trim())
  ) {
    fail(`${relativePath}: Field 'description' must be a non-empty string`)
  }

  if (!body.trim()) {
    fail(`${relativePath} must contain a non-empty skill body after frontmatter`)
  }
}

const trackedClaudeSkillEntries = [...tracked.keys()].filter(file => file.startsWith('.claude/skills/'))
const unexpectedClaudeSkillEntries = trackedClaudeSkillEntries.filter(file => !expectedClaudeSkillLinks.has(file))

if (unexpectedClaudeSkillEntries.length > 0) {
  for (const file of unexpectedClaudeSkillEntries) {
    const adapterPath = file.split('/').slice(0, 3).join('/')
    if (expectedClaudeSkillLinks.has(adapterPath)) {
      fail(`${adapterPath} must be tracked as a symlink; do not track nested files under it: ${file}`)
    } else {
      fail(`Unexpected tracked Claude skill adapter: ${file}`)
    }
  }
}

for (const [linkPath, expectedTarget] of expectedClaudeSkillLinks) {
  const entry = tracked.get(linkPath)
  if (!entry) {
    fail(`${linkPath} must be tracked as a Claude skill symlink adapter`)
    continue
  }

  if (entry.mode !== '120000') {
    fail(`${linkPath} must be tracked as a symlink, but git mode is ${entry.mode}`)
    continue
  }

  const absoluteLinkPath = absolute(linkPath)
  if (!existsSync(absoluteLinkPath)) {
    fail(`${linkPath} must exist`)
    continue
  }

  if (!lstatSync(absoluteLinkPath).isSymbolicLink()) {
    fail(`${linkPath} must be a filesystem symlink`)
    continue
  }

  const actualTarget = readlinkSync(absoluteLinkPath)
  if (actualTarget !== expectedTarget) {
    fail(`${linkPath} must point to ${expectedTarget}, but points to ${actualTarget}`)
    continue
  }

  const targetDir = gitPathJoin(path.posix.dirname(linkPath), actualTarget)
  const targetSkillFile = gitPathJoin(targetDir, 'SKILL.md')
  if (!tracked.has(targetSkillFile)) {
    fail(`${linkPath} target must contain tracked ${targetSkillFile}`)
  }
  if (!existsSync(absolute(targetSkillFile))) {
    fail(`${linkPath} target must contain existing ${targetSkillFile}`)
  }
}

const trackedAgentSkillDirs = new Set(
  [...tracked.keys()]
    .filter(file => file.startsWith('.agents/skills/') && file.endsWith('/SKILL.md'))
    .map(file => file.split('/').slice(0, 3).join('/')),
)

const trackedSkillFiles = [...tracked.keys()].filter(file =>
  (file.startsWith('.agents/skills/') || file.startsWith('skills/')) && file.endsWith('/SKILL.md')
)

const expectedClaudeSkillTargets = new Set(
  [...expectedClaudeSkillLinks.entries()].map(([linkPath, expectedTarget]) =>
    gitPathJoin(path.posix.dirname(linkPath), expectedTarget)
  ),
)

for (const skillDir of trackedAgentSkillDirs) {
  const alias = `.claude/skills/${path.posix.basename(skillDir)}`
  if (!expectedClaudeSkillLinks.has(alias)) {
    fail(`${skillDir} is tracked but missing an explicit Claude skill symlink adapter`)
  }
}

for (const skillFile of trackedSkillFiles) {
  validateSkillFile(skillFile)

  const skillDir = path.posix.dirname(skillFile)
  if (!expectedClaudeSkillTargets.has(skillDir)) {
    fail(`${skillDir} is tracked but missing an explicit Claude skill symlink adapter`)
  }
}

if (failures.length > 0) {
  console.error('Agent skill validation failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Agent skill validation passed')
