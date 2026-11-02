// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')
const checker = path.join(repoRoot, 'devops/check-agent-instructions.mjs')
const canonicalAgents = readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8')
const sequenceClaudePath = 'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md'
const sequenceLayouterClaude = readFileSync(path.join(repoRoot, sequenceClaudePath), 'utf8')

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
      const relativePath = `.agents/instructions/${name}`
      return [relativePath, readFileSync(path.join(repoRoot, relativePath), 'utf8')]
    }),
  )
  const baseFiles = {
    ...referenceFiles,
    'AGENTS.md': canonicalAgents,
    'CLAUDE.md': '@AGENTS.md\n',
    [sequenceClaudePath]: sequenceLayouterClaude,
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
    for (
      const file of [
        'AGENTS.md',
        'CLAUDE.md',
        '.agents/instructions/webapp.md',
        sequenceClaudePath,
      ]
    ) {
      const root = createFixture()
      addIndexOnlyFile(root, file, 'other.md', '120000')
      expectFail(root, /must be a regular file, not a symlink adapter/)
    }
  })

  void it('rejects a missing task reference', () => {
    const root = createFixture()
    rmSync(path.join(root, '.agents/instructions/model-api.md'))
    expectFail(root, /model-api\.md must exist/)
  })

  void it('rejects an unreachable task reference', () => {
    expectFail(
      createFixture({
        'AGENTS.md': canonicalAgents.replace('](.agents/instructions/webapp.md)', '](missing.md)'),
      }),
      /link exactly once to task reference/,
    )
  })

  void it('rejects an eager import of task guidance', () => {
    expectFail(
      createFixture({
        'AGENTS.md': `${canonicalAgents}\n@.agents/instructions/webapp.md\n`,
      }),
      /must be read on demand/,
    )
  })

  void it('rejects empty task references', () => {
    for (const name of ['project-map.md', 'model-api.md', 'webapp.md', 'sequence.md']) {
      expectFail(
        createFixture({
          [`.agents/instructions/${name}`]: '# Empty reference\n',
        }),
        /required section/,
      )
    }
  })

  void it('accepts meaning-preserving reference wording changes', () => {
    const file = '.agents/instructions/webapp.md'
    expectPass(createFixture({
      [file]: readFileSync(path.join(repoRoot, file), 'utf8').replace(
        'RPC is dev-only.',
        'RPC runs only during development.',
      ),
    }))
  })

  void it('rejects duplicate task reference links', () => {
    expectFail(
      createFixture({
        'AGENTS.md': canonicalAgents.replace(
          '](.agents/instructions/webapp.md)',
          '](.agents/instructions/webapp.md) and [duplicate](.agents/instructions/webapp.md)',
        ),
      }),
      /link exactly once to task reference/,
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

  void it('accepts CRLF in the root and task references', () => {
    const files = Object.fromEntries(
      ['project-map.md', 'model-api.md', 'webapp.md', 'sequence.md'].map(name => {
        const relativePath = `.agents/instructions/${name}`
        return [relativePath, readFileSync(path.join(repoRoot, relativePath), 'utf8').replaceAll('\n', '\r\n')]
      }),
    )
    expectPass(createFixture({
      ...files,
      'AGENTS.md': canonicalAgents.replaceAll('\n', '\r\n'),
    }))
  })

  void it('accepts harmless reflow of instruction prose', () => {
    expectPass(createFixture({
      'AGENTS.md': canonicalAgents.replace(
        'Before planning, editing, or reviewing, read each reference that matches the task, including cross-package work.',
        'Before planning, editing, or reviewing, read each reference that matches the task,\nincluding cross-package work.',
      ),
    }))
  })

  void it('accepts direct scoped Claude imports', () => {
    expectPass(createFixture({
      [sequenceClaudePath]:
        '@../../../../../.agents/instructions/sequence.md\n@../../../../../.agents/instructions/webapp.md\n',
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

  void it('rejects copied rules in localized Claude memory', () => {
    expectFail(
      createFixture({
        'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md':
          '# Sequence Layouter\n\nThis directory is a development copy of the sequence layouter from `@likec4/layouts`.\n',
      }),
      /must import only the sequence and webapp references/,
    )
  })

  void it('rejects missing task imports in localized Claude memory', () => {
    expectFail(
      createFixture({
        'packages/diagram/src/likec4diagram/xyflow-sequence/CLAUDE.md':
          'Claude Code local memory: use the sequence layouter section in AGENTS.md.\n',
      }),
      /must import only the sequence and webapp references/,
    )
  })

  void it('requires webapp rules in the diagram sequence adapter', () => {
    expectFail(
      createFixture({
        [sequenceClaudePath]: '@../../../../../.agents/instructions/sequence.md\n',
      }),
      /must import only the sequence and webapp references/,
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
