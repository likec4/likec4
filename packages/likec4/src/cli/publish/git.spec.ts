import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GitRunner, SpawnProcess } from './git'
import {
  COMMIT_FORMAT,
  createGitRunner,
  parseCommit,
  parseGitOrigin,
  readGitProvenance,
  resolveBranch,
  resolveTag,
} from './git'

type FakeGit = {
  runner: GitRunner
  calls: string[][]
}

const FAIL = Symbol('git-fails')

/**
 * Builds a {@link GitRunner} from a map of `"<args joined by space>"` to stdout.
 * Anything not listed (or mapped to {@link FAIL}) rejects, as a real git would.
 */
function fakeGit(responses: Record<string, string | typeof FAIL>): FakeGit {
  const calls: string[][] = []
  const runner: GitRunner = async args => {
    calls.push([...args])
    const key = args.join(' ')
    const response = responses[key]
    if (response === undefined || response === FAIL) {
      throw new Error(`Command failed with exit code 128: git ${key}`)
    }
    // the real runner trims stdout
    return response.trim()
  }
  return { runner, calls }
}

const NASTY_SUBJECT = 'feat: line one\nline two\tand a | pipe "quoted"'
const COMMIT_RAW = ['Alice Smith', 'alice@example.com', '2026-07-31T12:34:56+02:00', NASTY_SUBJECT].join('\0')

const LOG_CMD = `log -1 --format=${COMMIT_FORMAT}`

function happyGit(overrides: Record<string, string | typeof FAIL> = {}): FakeGit {
  return fakeGit({
    'rev-parse --show-toplevel': '/home/dev/repo',
    'remote get-url origin': 'git@github.com:likec4/likec4.git',
    'rev-parse HEAD': 'abc123def456',
    [LOG_CMD]: COMMIT_RAW,
    'symbolic-ref --short -q HEAD': 'main',
    'tag --points-at HEAD': '',
    'status --porcelain': '',
    ...overrides,
  })
}

describe('parseGitOrigin', () => {
  it.each([
    ['git@github.com:owner/repo.git', 'owner/repo'],
    ['git@github.com:owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo.git', 'owner/repo'],
    ['https://github.com/owner/repo/', 'owner/repo'],
    ['https://user:token@github.com/owner/repo', 'owner/repo'],
    ['https://x-access-token:ghs_secret@github.com/owner/repo.git', 'owner/repo'],
    ['ssh://git@github.com/owner/repo.git', 'owner/repo'],
    ['ssh://git@github.com:22/owner/repo.git', 'owner/repo'],
    ['git://github.com/owner/repo.git', 'owner/repo'],
    ['  https://github.com/owner/repo.git  ', 'owner/repo'],
    ['https://github.com/owner/repo.github.git', 'owner/repo.github'],
  ])('normalizes %s to %s', (url, expected) => {
    expect(parseGitOrigin(url)).toBe(expected)
  })

  it.each([
    ['git@gitlab.com:group/subgroup/repo.git', 'gitlab subgroup (scp)'],
    ['https://gitlab.com/group/subgroup/repo.git', 'gitlab subgroup (https)'],
    ['https://github.com/owner', 'single segment'],
    ['https://github.com/', 'no segments'],
    ['/srv/git/owner/repo.git', 'local absolute path'],
    ['C:\\repos\\my-repo', 'local windows path'],
    ['../sibling-repo', 'relative path'],
    ['not a url at all', 'garbage'],
    ['', 'empty'],
    ['   ', 'blank'],
  ])('returns null for %s (%s)', url => {
    expect(parseGitOrigin(url)).toBeNull()
  })

  it('never leaks credentials', () => {
    const origin = parseGitOrigin('https://user:sup3r-s3cret@github.com/owner/repo.git')
    expect(origin).toBe('owner/repo')
    expect(origin).not.toContain('sup3r-s3cret')
    expect(origin).not.toContain('user')
  })
})

describe('parseCommit', () => {
  it('parses NUL-separated output and keeps a nasty subject intact', () => {
    expect(parseCommit(COMMIT_RAW)).toEqual({
      message: NASTY_SUBJECT,
      author: 'Alice Smith',
      email: 'alice@example.com',
      date: '2026-07-31T10:34:56.000Z',
    })
  })

  it.each([
    ['2026-07-31T12:34:56+02:00', '2026-07-31T10:34:56.000Z'],
    ['2026-07-31T12:34:56-05:00', '2026-07-31T17:34:56.000Z'],
    ['2026-07-31T12:34:56Z', '2026-07-31T12:34:56.000Z'],
  ])('normalizes %s to UTC %s', (raw, expected) => {
    expect(parseCommit(['Alice', 'a@b.c', raw, 'subject'].join('\0')).date).toBe(expected)
  })

  it('tolerates a trailing newline', () => {
    expect(parseCommit(COMMIT_RAW + '\n').message).toBe(NASTY_SUBJECT)
  })

  it('accepts an empty subject and empty identity', () => {
    expect(parseCommit(['', '', '2026-07-31T12:34:56Z', ''].join('\0'))).toEqual({
      message: '',
      author: '',
      email: '',
      date: '2026-07-31T12:34:56.000Z',
    })
  })

  it('throws when fields are missing', () => {
    expect(() => parseCommit('Alice\0alice@example.com')).toThrow(/Unexpected "git log" output/)
  })

  it('throws on an unparsable date', () => {
    expect(() => parseCommit(['Alice', 'a@b.c', 'yesterday', 'subject'].join('\0')))
      .toThrow(/Unexpected commit date/)
  })
})

describe('resolveBranch', () => {
  it('prefers GITHUB_HEAD_REF (pull requests)', () => {
    const env = { GITHUB_HEAD_REF: 'feature/x', GITHUB_REF_TYPE: 'branch', GITHUB_REF_NAME: '42/merge' }
    expect(resolveBranch(env, 'detached')).toBe('feature/x')
  })

  it('ignores an empty GITHUB_HEAD_REF (set outside pull requests)', () => {
    const env = { GITHUB_HEAD_REF: '', GITHUB_REF_TYPE: 'branch', GITHUB_REF_NAME: 'main' }
    expect(resolveBranch(env, null)).toBe('main')
  })

  it('uses GITHUB_REF_NAME only when GITHUB_REF_TYPE is branch', () => {
    expect(resolveBranch({ GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: 'v1.0.0' }, 'main')).toBe('main')
    expect(resolveBranch({ GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: 'v1.0.0' }, null)).toBeNull()
  })

  it('falls back to git, then null', () => {
    expect(resolveBranch({}, 'main')).toBe('main')
    expect(resolveBranch({}, null)).toBeNull()
    expect(resolveBranch({}, '')).toBeNull()
  })
})

describe('resolveTag', () => {
  it('uses GITHUB_REF_NAME when GITHUB_REF_TYPE is tag', () => {
    expect(resolveTag({ GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: 'v1.0.0' }, 'v0.9.0')).toBe('v1.0.0')
  })

  it('ignores GITHUB_REF_NAME for branches', () => {
    expect(resolveTag({ GITHUB_REF_TYPE: 'branch', GITHUB_REF_NAME: 'main' }, 'v0.9.0')).toBe('v0.9.0')
    expect(resolveTag({ GITHUB_REF_TYPE: 'branch', GITHUB_REF_NAME: 'main' }, null)).toBeNull()
  })

  it('falls back to git, then null', () => {
    expect(resolveTag({}, 'v1.2.3')).toBe('v1.2.3')
    expect(resolveTag({}, null)).toBeNull()
  })
})

describe('readGitProvenance', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the full provenance of a clean checkout', async () => {
    const { runner } = happyGit({ 'tag --points-at HEAD': 'v1.0.0\nv1.0.0-rc.1' })

    await expect(readGitProvenance({ runner, env: {} })).resolves.toEqual({
      origin: 'likec4/likec4',
      sha: 'abc123def456',
      branch: 'main',
      tag: 'v1.0.0',
      commit: {
        message: NASTY_SUBJECT,
        author: 'Alice Smith',
        email: 'alice@example.com',
        date: '2026-07-31T10:34:56.000Z',
      },
      root: '/home/dev/repo',
      dirty: false,
    })
  })

  it('detects a dirty working tree', async () => {
    const { runner } = happyGit({ 'status --porcelain': ' M packages/likec4/src/cli/publish/git.ts\n?? new.c4' })
    await expect(readGitProvenance({ runner, env: {} })).resolves.toMatchObject({ dirty: true })
  })

  it('detects a clean working tree', async () => {
    const { runner } = happyGit({ 'status --porcelain': '' })
    await expect(readGitProvenance({ runner, env: {} })).resolves.toMatchObject({ dirty: false })
  })

  it('reports dirty as null (undetermined), not false, when status cannot be read', async () => {
    const { runner } = happyGit({ 'status --porcelain': FAIL })
    const provenance = await readGitProvenance({ runner, env: {} })

    expect(provenance.dirty).toBeNull()
    expect(provenance.dirty).not.toBe(false)
  })

  it('falls back to the CI environment on a detached HEAD', async () => {
    const { runner } = happyGit({ 'symbolic-ref --short -q HEAD': FAIL })
    const env = { GITHUB_REF_TYPE: 'branch', GITHUB_REF_NAME: 'release/1.x' }

    await expect(readGitProvenance({ runner, env })).resolves.toMatchObject({ branch: 'release/1.x' })
  })

  it('resolves branch to null on a detached HEAD without CI environment', async () => {
    const { runner } = happyGit({ 'symbolic-ref --short -q HEAD': FAIL })
    await expect(readGitProvenance({ runner, env: {} })).resolves.toMatchObject({ branch: null })
  })

  it('applies flag precedence: flag beats env beats git', async () => {
    const { runner } = happyGit({ 'tag --points-at HEAD': 'v0.0.1-from-git' })
    const env = {
      GITHUB_HEAD_REF: 'from-env',
      GITHUB_REF_TYPE: 'tag',
      GITHUB_REF_NAME: 'v0.0.2-from-env',
    }

    await expect(
      readGitProvenance({
        runner,
        env,
        overrides: { origin: 'flag/repo', sha: 'shaFromFlag', branch: 'from-flag', tag: 'v9.9.9-from-flag' },
      }),
    ).resolves.toMatchObject({
      origin: 'flag/repo',
      sha: 'shaFromFlag',
      branch: 'from-flag',
      tag: 'v9.9.9-from-flag',
    })

    await expect(readGitProvenance({ runner, env })).resolves.toMatchObject({
      branch: 'from-env',
      tag: 'v0.0.2-from-env',
    })

    await expect(readGitProvenance({ runner, env: {} })).resolves.toMatchObject({
      branch: 'main',
      tag: 'v0.0.1-from-git',
    })
  })

  it('never queries the origin remote when --origin is given', async () => {
    const { runner, calls } = happyGit({ 'remote get-url origin': FAIL })

    await expect(readGitProvenance({ runner, env: {}, overrides: { origin: 'owner/repo' } }))
      .resolves.toMatchObject({ origin: 'owner/repo' })
    expect(calls.map(args => args.join(' '))).not.toContain('remote get-url origin')
  })

  it('errors when there is no origin remote', async () => {
    const { runner } = happyGit({ 'remote get-url origin': FAIL })
    await expect(readGitProvenance({ runner, env: {} })).rejects.toThrow(/--origin/)
  })

  it('errors when the origin remote is not "owner/repo"', async () => {
    const { runner } = happyGit({ 'remote get-url origin': 'git@gitlab.com:group/sub/repo.git' })
    await expect(readGitProvenance({ runner, env: {} })).rejects.toThrow(
      /Cannot derive "owner\/repo".*--origin/s,
    )
  })

  it('errors with the --origin/--sha hint when git is unavailable', async () => {
    const { runner } = fakeGit({})
    await expect(readGitProvenance({ runner, env: {} })).rejects.toThrow(/--origin/)
    await expect(readGitProvenance({ runner, env: {} })).rejects.toThrow(/--sha/)
  })

  it('errors when only one of --origin/--sha is given outside a repository', async () => {
    const { runner } = fakeGit({})
    await expect(readGitProvenance({ runner, env: {}, overrides: { origin: 'owner/repo' } }))
      .rejects.toThrow(/--sha/)
    await expect(readGitProvenance({ runner, env: {}, overrides: { sha: 'abc' } }))
      .rejects.toThrow(/--origin/)
  })

  it('uses the manual escape hatch when both --origin and --sha are given', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-31T00:00:00.000Z'))
    const { runner, calls } = fakeGit({})

    await expect(
      readGitProvenance({
        runner,
        env: { GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: 'v2.0.0' },
        overrides: { origin: 'owner/repo', sha: 'deadbeef' },
      }),
    ).resolves.toEqual({
      origin: 'owner/repo',
      sha: 'deadbeef',
      branch: null,
      tag: 'v2.0.0',
      commit: { message: '', author: '', email: '', date: '2026-07-31T00:00:00.000Z' },
      root: '',
      // no repository to inspect, so the working tree state is undetermined
      dirty: null,
    })
    // only the toplevel probe is attempted, nothing else
    expect(calls).toEqual([['rev-parse', '--show-toplevel']])
  })

  it('uses the exact git commands agreed in the plan', async () => {
    const { runner, calls } = happyGit()
    await readGitProvenance({ runner, env: {} })

    expect(calls.map(args => args.join(' '))).toEqual([
      'rev-parse --show-toplevel',
      'remote get-url origin',
      'rev-parse HEAD',
      `log -1 --format=${COMMIT_FORMAT}`,
      'symbolic-ref --short -q HEAD',
      'tag --points-at HEAD',
      'status --porcelain',
    ])
  })
})

// The spawner is injected, never mocked, so these never reach a real `git` process.
describe('createGitRunner', () => {
  it('spawns git in the given cwd and trims stdout', async () => {
    const calls: Array<[string, readonly string[], { cwd: string }]> = []
    const spawnProcess: SpawnProcess = async (command, args, options) => {
      calls.push([command, args, options])
      return { stdout: '  /home/dev/repo\n' }
    }

    const runner = createGitRunner('/home/dev/repo/packages/app', spawnProcess)

    await expect(runner(['rev-parse', '--show-toplevel'])).resolves.toBe('/home/dev/repo')
    expect(calls).toEqual([
      ['git', ['rev-parse', '--show-toplevel'], { cwd: '/home/dev/repo/packages/app' }],
    ])
  })

  it('rejects when git fails or is not installed', async () => {
    const spawnProcess: SpawnProcess = () => Promise.reject(new Error('spawn git ENOENT'))

    await expect(createGitRunner('/home/dev/repo', spawnProcess)(['status', '--porcelain']))
      .rejects.toThrow('spawn git ENOENT')
  })
})
