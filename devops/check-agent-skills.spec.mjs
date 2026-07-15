import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const checker = path.join(repoRoot, 'devops/check-agent-skills.mjs')

const tempRoots = []

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
])

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

function createSymlink(root, relativePath, target) {
  const link = path.join(root, relativePath)
  mkdirSync(path.dirname(link), { recursive: true })
  symlinkSync(target, link, 'dir')
}

function removeFixturePath(root, relativePath) {
  rmSync(path.join(root, relativePath), { recursive: true, force: true })
}

function targetSkillPath(linkPath, target) {
  return path.posix.join(path.posix.dirname(linkPath), target, 'SKILL.md')
}

function createFixture(customize) {
  const root = mkdtempSync(path.join(tmpdir(), 'likec4-agent-skills-check-'))
  tempRoots.push(root)

  execFileSync('git', ['init', '--initial-branch=main'], { cwd: root, stdio: 'ignore' })

  for (const [linkPath, target] of expectedClaudeSkillLinks) {
    writeFixtureFile(root, targetSkillPath(linkPath, target), `---\nname: ${path.posix.basename(linkPath)}\n---\n`)
    createSymlink(root, linkPath, target)
  }

  customize?.(root)

  execFileSync('git', ['add', '-A'], { cwd: root, stdio: 'ignore' })
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
  assert.match(result.stdout, /Agent skill validation passed/)
}

function expectFail(root, message) {
  const result = runChecker(root)
  assert.notEqual(result.status, 0, result.stdout)
  assert.match(result.stderr, message)
}

describe('check-agent-skills', () => {
  it('accepts canonical Claude skill symlink adapters', () => {
    expectPass(createFixture())
  })

  it('rejects missing Claude skill adapters', () => {
    expectFail(
      createFixture(root => {
        removeFixturePath(root, '.claude/skills/likec4-gh-pr-triage')
      }),
      /likec4-gh-pr-triage must be tracked as a Claude skill symlink adapter/,
    )
  })

  it('rejects non-symlink Claude skill adapters', () => {
    expectFail(
      createFixture(root => {
        removeFixturePath(root, '.claude/skills/likec4-issue-repro')
        writeFixtureFile(root, '.claude/skills/likec4-issue-repro/SKILL.md', 'duplicated skill body\n')
      }),
      /likec4-issue-repro must be tracked as a symlink/,
    )
  })

  it('rejects Claude skill adapters pointing to the wrong target', () => {
    expectFail(
      createFixture(root => {
        removeFixturePath(root, '.claude/skills/likec4-project-config-workflow')
        createSymlink(
          root,
          '.claude/skills/likec4-project-config-workflow',
          '../../.agents/skills/refactor',
        )
      }),
      /likec4-project-config-workflow must point to \.\.\/\.\.\/\.agents\/skills\/likec4-project-config-workflow/,
    )
  })

  it('rejects repo-local skills without explicit Claude adapters', () => {
    expectFail(
      createFixture(root => {
        writeFixtureFile(root, '.agents/skills/local-only/SKILL.md', '---\nname: local-only\n---\n')
      }),
      /\.agents\/skills\/local-only is tracked but missing an explicit Claude skill symlink adapter/,
    )
  })
})
