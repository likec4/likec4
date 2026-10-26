import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const checker = path.join(repoRoot, 'devops/check-agent-instructions.mjs')
const canonicalAgents = readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8')
const sequenceLayouterClaude =
  '@../../../../../AGENTS.md\n\nClaude Code local memory: follow the sequence and webapp rules routed by the imported root `AGENTS.md`.\n'

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

function addIndexOnlyFile(root, relativePath, content, mode = '100644') {
  const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
    cwd: root,
    input: content,
    encoding: 'utf8',
  }).trim()

  execFileSync('git', ['update-index', '--add', '--cacheinfo', `${mode},${blob},${relativePath}`], {
    cwd: root,
    stdio: 'ignore',
  })
}

function createFixture(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'likec4-agent-check-'))
  tempRoots.push(root)

  execFileSync('git', ['init', '--initial-branch=main'], { cwd: root, stdio: 'ignore' })

  const referenceFiles = Object.fromEntries(
    ['project-map.md', 'model-api.md', 'webapp.md', 'sequence.md'].map(name => {
      const relativePath = `devops/agent-instructions/${name}`
      return [relativePath, readFileSync(path.join(repoRoot, relativePath), 'utf8')]
    }),
  )
  const baseFiles = {
    ...referenceFiles,
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

void describe('check-agent-instructions', () => {
  void it('accepts the canonical root files', () => {
    expectPass(createFixture())
  })

  void it('rejects symlink instruction adapters even on Windows checkouts', () => {
    for (const file of ['AGENTS.md', 'CLAUDE.md', 'devops/agent-instructions/webapp.md']) {
      const root = createFixture()
      addIndexOnlyFile(root, file, 'other.md', '120000')
      expectFail(root, /must be a regular file, not a symlink adapter/)
    }
  })

  void it('rejects a missing task reference', () => {
    const root = createFixture()
    rmSync(path.join(root, 'devops/agent-instructions/model-api.md'))
    expectFail(root, /model-api\.md must exist/)
  })

  void it('rejects an unreachable task reference', () => {
    expectFail(
      createFixture({
        'AGENTS.md': canonicalAgents.replace('](devops/agent-instructions/webapp.md)', '](missing.md)'),
      }),
      /task reference link/,
    )
  })

  void it('rejects an eager import of task guidance', () => {
    expectFail(
      createFixture({
        'AGENTS.md': `${canonicalAgents}\n@devops/agent-instructions/webapp.md\n`,
      }),
      /must be read on demand/,
    )
  })

  void it('rejects lost reference sections and rules', () => {
    for (const name of ['project-map.md', 'model-api.md', 'webapp.md', 'sequence.md']) {
      expectFail(
        createFixture({
          [`devops/agent-instructions/${name}`]: '# Empty reference\n',
        }),
        /required section|preserved rule/,
      )
    }
  })

  void it('keeps shared policy in the root', () => {
    const phrase = 'Always use `patch` changesets; versioning is handled manually by maintainers.'
    const file = 'devops/agent-instructions/webapp.md'
    expectFail(
      createFixture({
        'AGENTS.md': canonicalAgents.replace(phrase, ''),
        [file]: `${readFileSync(path.join(repoRoot, file), 'utf8')}\n${phrase}\n`,
      }),
      /AGENTS\.md must contain required preserved rule/,
    )
  })

  void it('keeps moved rules in their owning reference', () => {
    const phrase = 'Always diff the two directories before syncing; do not assume they are currently identical.'
    const source = 'devops/agent-instructions/sequence.md'
    const other = 'devops/agent-instructions/model-api.md'
    expectFail(
      createFixture({
        [source]: readFileSync(path.join(repoRoot, source), 'utf8').replace(phrase, ''),
        [other]: `${readFileSync(path.join(repoRoot, other), 'utf8')}\n${phrase}\n`,
      }),
      /sequence\.md must contain required preserved rule/,
    )
  })

  void it('rejects lost routing triggers even when their links survive', () => {
    for (
      const trigger of [
        '`packages/core`',
        '`packages/likec4` static-site builds',
        '`./internal` consumers',
        'Also read webapp rules when',
        '`packages/layouts/src/graphviz/GraphvizLayoter.ts`',
      ]
    ) {
      expectFail(
        createFixture({
          'AGENTS.md': canonicalAgents.replace(trigger, ''),
        }),
        /routing trigger for/,
      )
    }
  })

  void it('rejects removal of critical boundary warnings', () => {
    for (
      const [file, phrase] of [
        ['AGENTS.md', 'DSL writeback loses comments, source positions, and formatting'],
        ['AGENTS.md', 'RPC is dev-only;'],
        [
          'devops/agent-instructions/model-api.md',
          'does not preserve comments, source positions, or original formatting',
        ],
        ['devops/agent-instructions/webapp.md', 'RPC is dev-only.'],
        [
          'devops/agent-instructions/webapp.md',
          'Do not import `@likec4/language-server` directly from `packages/likec4-spa`',
        ],
      ]
    ) {
      expectFail(
        createFixture({
          [file]: readFileSync(path.join(repoRoot, file), 'utf8').replace(phrase, ''),
        }),
        /must contain required preserved rule/,
      )
    }
  })

  void it('rejects stale guidance in a reference', () => {
    const file = 'devops/agent-instructions/webapp.md'
    expectFail(
      createFixture({
        [file]: `${readFileSync(path.join(repoRoot, file), 'utf8')}\n## Source preservation map\n`,
      }),
      /must not contain stale/,
    )
  })

  void it('rejects detailed sections copied back into root', () => {
    expectFail(
      createFixture({
        'AGENTS.md': `${canonicalAgents}\n## Public API entry files\n`,
      }),
      /not the always-loaded root/,
    )
  })

  void it('accepts CRLF in the Claude adapter', () => {
    expectPass(createFixture({
      'CLAUDE.md': '@AGENTS.md\r\n',
    }))
  })

  void it('rejects nested AGENTS.md files', () => {
    expectFail(
      createFixture({
        'packages/core/AGENTS.md': '# Nested instructions\n',
      }),
      /Only root AGENTS\.md is allowed/,
    )
  })

  void it('rejects case variants of canonical instruction files', () => {
    // Case-insensitive filesystems (macOS, Windows) cannot hold AGENTS.md and agents.md
    // side by side, so the variant is staged straight into the index the checker reads.
    const root = createFixture()
    addIndexOnlyFile(root, 'agents.md', '# Duplicate canonical instructions\n')

    expectFail(root, /Do not track AGENTS\.md case variants/)
  })

  void it('rejects singular AGENT.md files', () => {
    expectFail(
      createFixture({
        'AGENT.md': '# Singular instructions\n',
      }),
      /Do not track AGENT\.md files/,
    )
  })

  void it('accepts the localized sequence layouter Claude memory', () => {
    expectPass(createFixture({
      'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md': sequenceLayouterClaude,
    }))
  })

  void it('rejects duplicated localized Claude memory content', () => {
    expectFail(
      createFixture({
        'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md':
          '# Sequence Layouter\n\nThis directory is a development copy of the sequence layouter from `@likec4/layouts`.\n',
      }),
      /must import AGENTS\.md and contain only the approved local pointer/,
    )
  })

  void it('rejects missing AGENTS import in localized Claude memory', () => {
    expectFail(
      createFixture({
        'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md':
          'Claude Code local memory: use the sequence layouter section in AGENTS.md.\n',
      }),
      /must import AGENTS\.md and contain only the approved local pointer/,
    )
  })

  void it('rejects unexpected nested Claude adapters', () => {
    expectFail(
      createFixture({
        'packages/core/CLAUDE.md': '@../../AGENTS.md\n',
      }),
      /Only root CLAUDE\.md and explicitly allowed localized Claude memories are allowed/,
    )
  })

  void it('rejects Copilot instruction files as broad duplicate sources', () => {
    expectFail(
      createFixture({
        '.github/copilot-instructions.md': '# Duplicate shared instructions\n',
      }),
      /Remove \.github\/copilot-instructions\.md/,
    )
  })

  void it('rejects duplicated changeset policy in task wrappers', () => {
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

  void it('rejects duplicated changeset policy in repo-local skills', () => {
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
