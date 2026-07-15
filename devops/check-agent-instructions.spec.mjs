import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const checker = path.join(repoRoot, 'devops/check-agent-instructions.mjs')
const canonicalAgents = readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8')

const tempRoots = []

afterEach(() => {
  while (tempRoots.length > 0) {
    rmSync(tempRoots.pop(), { recursive: true, force: true })
  }
})

function writeFixtureFile(root, relativePath, content) {
  const file = path.join(root, relativePath)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function createFixture(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'likec4-agent-check-'))
  tempRoots.push(root)

  execFileSync('git', ['init', '--initial-branch=main'], { cwd: root, stdio: 'ignore' })

  const baseFiles = {
    'AGENTS.md': canonicalAgents,
    'CLAUDE.md': '@AGENTS.md\n',
    '.github/agents/changeset-generator.agent.md':
      '> AGENTS.md is the canonical source for shared LikeC4 repository instructions, including changeset policy. This file is a task-specific wrapper for generating changeset files.\n',
    '.agents/skills/changeset-generator/SKILL.md':
      '> AGENTS.md is the canonical source for shared LikeC4 repository instructions, including changeset policy. This file is a task-specific wrapper for generating changeset files.\n',
    ...files,
  }

  for (const [relativePath, content] of Object.entries(baseFiles)) {
    writeFixtureFile(root, relativePath, content)
  }

  execFileSync('git', ['add', '.'], { cwd: root, stdio: 'ignore' })
  return root
}

function runChecker(root) {
  return spawnSync(process.execPath, [checker], {
    cwd: root,
    encoding: 'utf8',
  })
}

function expectPass(root) {
  const result = runChecker(root)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Agent instruction validation passed/)
}

function expectFail(root, message) {
  const result = runChecker(root)
  assert.notEqual(result.status, 0, result.stdout)
  assert.match(result.stderr, message)
}

describe('check-agent-instructions', () => {
  it('accepts the canonical root files', () => {
    expectPass(createFixture())
  })

  it('accepts CRLF in the Claude adapter', () => {
    expectPass(createFixture({
      'CLAUDE.md': '@AGENTS.md\r\n',
    }))
  })

  it('rejects nested AGENTS.md files', () => {
    expectFail(
      createFixture({
        'packages/core/AGENTS.md': '# Nested instructions\n',
      }),
      /Only root AGENTS\.md is allowed/,
    )
  })

  it('rejects case variants of canonical instruction files', () => {
    expectFail(
      createFixture({
        'agents.md': '# Duplicate canonical instructions\n',
      }),
      /Do not track AGENTS\.md case variants/,
    )
  })

  it('rejects singular AGENT.md files', () => {
    expectFail(
      createFixture({
        'AGENT.md': '# Singular instructions\n',
      }),
      /Do not track AGENT\.md files/,
    )
  })

  it('accepts the localized sequence layouter Claude memory', () => {
    expectPass(createFixture({
      'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md': '# Sequence Layouter\n',
    }))
  })

  it('rejects unexpected nested Claude adapters', () => {
    expectFail(
      createFixture({
        'packages/core/CLAUDE.md': '@../../AGENTS.md\n',
      }),
      /Only root CLAUDE\.md and explicitly allowed localized Claude memories are allowed/,
    )
  })

  it('rejects Copilot instruction files as broad duplicate sources', () => {
    expectFail(
      createFixture({
        '.github/copilot-instructions.md': '# Duplicate shared instructions\n',
      }),
      /Remove \.github\/copilot-instructions\.md/,
    )
  })

  it('rejects duplicated changeset policy in task wrappers', () => {
    const duplicatedPolicy = [
      '> AGENTS.md is the canonical source for shared LikeC4 repository instructions, including changeset policy. This file is a task-specific wrapper for generating changeset files.',
      '',
      'Always use `patch` changesets; versioning is handled manually by maintainers.',
      'Write changeset summaries from the user\'s perspective and focus on public impact.',
      'Do not mention test changes, internal refactors, config changes, cleanup, or dependency bumps in changeset summaries.',
    ].join('\n')

    expectFail(
      createFixture({
        '.github/agents/changeset-generator.agent.md': duplicatedPolicy,
      }),
      /must defer shared changeset policy to AGENTS\.md/,
    )
  })

  it('rejects duplicated changeset policy in repo-local skills', () => {
    const duplicatedPolicy = [
      '> AGENTS.md is the canonical source for shared LikeC4 repository instructions, including changeset policy. This file is a task-specific wrapper for generating changeset files.',
      '',
      'Always use `patch` changesets; versioning is handled manually by maintainers.',
      'Write changeset summaries from the user\'s perspective and focus on public impact.',
      'Do not mention test changes, internal refactors, config changes, cleanup, or dependency bumps in changeset summaries.',
    ].join('\n')

    expectFail(
      createFixture({
        '.agents/skills/changeset-generator/SKILL.md': duplicatedPolicy,
      }),
      /must defer shared changeset policy to AGENTS\.md/,
    )
  })
})
