import { parseGitRepositoryUrl } from '@likec4/config'
import { Cancellation } from 'langium'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, it } from 'vitest'
import { createTestServices } from '../test'
import { type GitRunner, createGitRunner } from './git'
import { createGitDependencyInstaller } from './install'
import { dependencyCacheKey } from './storage'

const URL = 'https://example.test/org/billing.git'
const URL_SCP = 'git@example.test:org/billing.git'
const REPOSITORY = 'example.test/org/billing'

/**
 * Temporary folder with a local git repository and its bare clone (the "remote").
 * Tests never go to the network: allowed URLs (`https://example.test/...`) are mapped to the bare repository.
 */
function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'likec4-install-'))
  // isolate git from the configuration of the user (signing, hooks, default branch, ...)
  const globalConfig = join(root, 'gitconfig')
  writeFileSync(globalConfig, '')
  const env: Record<string, string | undefined> = {
    ...process.env,
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'test',
    GIT_AUTHOR_EMAIL: 'test@example.test',
    GIT_COMMITTER_NAME: 'test',
    GIT_COMMITTER_EMAIL: 'test@example.test',
  }
  const work = join(root, 'work')
  const bare = join(root, 'remote.git')
  const temp = join(root, 'tmp')
  mkdirSync(temp)
  const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git(root, 'init', '--quiet', '--bare', '--initial-branch=main', bare)
  git(root, 'init', '--quiet', '--initial-branch=main', work)

  /**
   * Writes files to the work tree, commits and pushes. Returns the commit SHA.
   */
  const commit = (files: Record<string, string>, message = 'commit') => {
    for (const [path, content] of Object.entries(files)) {
      const file = join(work, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, content)
    }
    git(work, 'add', '--all')
    git(work, 'commit', '--quiet', '--no-verify', '-m', message)
    git(work, 'push', '--quiet', '--tags', bare, 'main')
    return git(work, 'rev-parse', 'HEAD')
  }
  const tag = (name: string) => {
    git(work, 'tag', '-a', name, '-m', name)
    git(work, 'push', '--quiet', bare, `refs/tags/${name}`)
  }

  // real git, with the local transport allowed for the bare repository of the fixture
  const realGit = createGitRunner({ env, allowProtocol: 'file' })
  const calls: string[][] = []
  const runGit: GitRunner = (args, options) => {
    calls.push([...args])
    return realGit(args, options)
  }
  // allowed URL (by identity) -> bare repository
  const remotes = new Map<string, string>([[REPOSITORY, bare]])

  const { services, initialize } = createTestServices({
    context: {
      dependencyInstaller: shared =>
        createGitDependencyInstaller(shared, {
          runGit,
          remoteUrl: url => remotes.get(url.id) ?? join(root, 'missing.git'),
          tempDir: temp,
        }),
    },
  })
  const installer = services.shared.dependencies.Installer
  const storage = services.shared.dependencies.Storage
  const keys = async () => (await storage.storage.getKeys()).sort()

  return {
    initialize,
    root,
    env,
    bare,
    temp,
    work,
    git,
    commit,
    tag,
    calls,
    remotes,
    installer,
    storage,
    keys,
    gitCommands: () => calls.map(args => args[0]),
    tempIsEmpty: () => readdirSync(temp).length === 0,
  }
}

type Fixture = ReturnType<typeof createFixture>

const BILLING_FILES = {
  'arch/likec4.config.json': '{"name":"billing"}',
  'arch/model.c4': 'model {}',
  'arch/views/index.likec4': 'views {}',
}

describe('GitDependencyInstaller', () => {
  const fixtures = [] as Fixture[]
  const setup = async () => {
    const fixture = createFixture()
    fixtures.push(fixture)
    await fixture.initialize()
    return fixture
  }
  afterEach(() => {
    for (const fixture of fixtures.splice(0)) {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  it('is supported', async ({ expect }) => {
    const { installer } = await setup()
    expect(installer.supported).toBe(true)
  })

  it('installs a tag: writes the SHA to the version index and files to the storage', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit(BILLING_FILES)
    f.tag('v1.0')

    const result = await f.installer.install({ git: URL, ref: 'v1.0', path: 'arch' })

    const instance = { repository: REPOSITORY, sha, subdir: 'arch' }
    expect(result).toEqual({ status: 'installed', instance, files: 3, cached: false })
    // annotated tag is peeled to the commit
    expect(await f.storage.readVersion(REPOSITORY, 'v1.0')).toMatchObject({
      format: 1,
      repository: REPOSITORY,
      url: URL,
      ref: 'v1.0',
      sha,
    })
    expect(await f.storage.readEntry(instance)).toEqual({
      format: 1,
      repository: REPOSITORY,
      url: URL,
      sha,
      subdir: 'arch',
      files: {
        'likec4.config.json': '{"name":"billing"}',
        'model.c4': 'model {}',
        'views/index.likec4': 'views {}',
      },
    })
    expect(sha).toMatch(/^[0-9a-f]{40}$/)
    expect(f.tempIsEmpty()).toBe(true)
  })

  it('branch: install keeps the SHA of the version index, update moves it', async ({ expect }) => {
    const f = await setup()
    const first = f.commit(BILLING_FILES)

    const installed = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(installed).toMatchObject({ status: 'installed', cached: false, instance: { sha: first } })

    const second = f.commit({ 'arch/model.c4': 'model { a = actor }' })
    expect(second).not.toBe(first)

    f.calls.length = 0
    const again = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(again).toMatchObject({ status: 'installed', cached: true, instance: { sha: first } })
    expect(f.calls).toEqual([])
    expect((await f.storage.readVersion(REPOSITORY, 'main'))?.sha).toBe(first)

    const updated = await f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { update: true })
    expect(updated).toMatchObject({ status: 'installed', cached: false, instance: { sha: second } })
    expect((await f.storage.readVersion(REPOSITORY, 'main'))?.sha).toBe(second)
    expect((await f.storage.readEntry({ repository: REPOSITORY, sha: second, subdir: 'arch' }))?.files['model.c4'])
      .toBe('model { a = actor }')
    // the previous instance stays (records are immutable, no automatic cleanup)
    expect(await f.storage.hasEntry({ repository: REPOSITORY, sha: first, subdir: 'arch' })).toBe(true)
    expect(f.tempIsEmpty()).toBe(true)
  })

  it('update of an unchanged branch does not download again', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit(BILLING_FILES)
    await f.installer.install({ git: URL, ref: 'main', path: 'arch' })

    f.calls.length = 0
    const updated = await f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { update: true })
    expect(updated).toMatchObject({ status: 'installed', cached: true, instance: { sha } })
    expect(f.gitCommands()).toEqual(['ls-remote'])
  })

  it('changed ref in the config resolves only this record', async ({ expect }) => {
    const f = await setup()
    const first = f.commit(BILLING_FILES)
    f.tag('v1.0')
    await f.installer.install({ git: URL, ref: 'v1.0', path: 'arch' })
    await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    const mainRecord = await f.storage.readVersion(REPOSITORY, 'main')
    const v1Record = await f.storage.readVersion(REPOSITORY, 'v1.0')

    const second = f.commit({ 'arch/model.c4': 'model { b = actor }' })
    f.tag('v2.0')

    f.calls.length = 0
    // the config changed "v1.0" to "v2.0"
    const result = await f.installer.install({ git: URL, ref: 'v2.0', path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', instance: { sha: second } })

    const lsRemote = f.calls.filter(args => args[0] === 'ls-remote')
    expect(lsRemote).toHaveLength(1)
    expect(lsRemote[0]).toContain('refs/tags/v2.0')
    expect(lsRemote[0]!.join(' ')).not.toContain('main')
    expect(lsRemote[0]!.join(' ')).not.toContain('v1.0')

    // other records are untouched (the branch still points to the first commit)
    expect(await f.storage.readVersion(REPOSITORY, 'main')).toEqual(mainRecord)
    expect(await f.storage.readVersion(REPOSITORY, 'v1.0')).toEqual(v1Record)
    expect(mainRecord?.sha).toBe(first)
    expect((await f.storage.readVersion(REPOSITORY, 'v2.0'))?.sha).toBe(second)
  })

  it('two projects with the same URL and ref share one version record and one instance', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit(BILLING_FILES)
    f.tag('v1.0')

    // https and scp-like spellings of the same repository, installed concurrently
    const [a, b] = await Promise.all([
      f.installer.install({ git: URL, ref: 'v1.0', path: 'arch' }),
      f.installer.install({ git: URL_SCP, ref: 'v1.0', path: './arch/' }),
    ])
    const instance = { repository: REPOSITORY, sha, subdir: 'arch' }
    expect(a).toMatchObject({ status: 'installed', instance })
    expect(b).toMatchObject({ status: 'installed', instance })
    // one run of git for both
    expect(f.gitCommands().filter(c => c === 'fetch')).toHaveLength(1)

    const keys = await f.keys()
    expect(keys.filter(k => k.startsWith('versions:'))).toHaveLength(1)
    expect(keys.filter(k => k.startsWith('instances:'))).toEqual([dependencyCacheKey(instance)])

    // installed again by the second project, sequentially: nothing is downloaded
    f.calls.length = 0
    expect(await f.installer.install({ git: URL_SCP, ref: 'v1.0', path: 'arch' })).toMatchObject({
      status: 'installed',
      cached: true,
      instance,
    })
    expect(f.calls).toEqual([])
  })

  it('does not run git when the instance is already in the storage', async ({ expect }) => {
    const f = await setup()
    const sha = 'a'.repeat(40)
    const instance = { repository: REPOSITORY, sha, subdir: 'arch' }
    await f.storage.writeEntry({
      format: 1,
      repository: REPOSITORY,
      url: URL,
      sha,
      subdir: 'arch',
      files: { 'a.c4': '' },
    })
    await f.storage.writeVersion({
      format: 1,
      repository: REPOSITORY,
      url: URL,
      ref: 'main',
      sha,
      resolvedAt: '2026-11-15T00:00:00.000Z',
    })

    // ref from the version index
    expect(await f.installer.install({ git: URL, ref: 'main', path: 'arch' })).toEqual({
      status: 'installed',
      instance,
      files: 1,
      cached: true,
    })
    // ref is a full SHA (upper case is accepted)
    expect(await f.installer.install({ git: URL_SCP, ref: sha.toUpperCase(), path: 'arch' })).toEqual({
      status: 'installed',
      instance,
      files: 1,
      cached: true,
    })
    expect(f.calls).toEqual([])
    expect((await f.storage.readVersion(REPOSITORY, sha.toUpperCase()))?.sha).toBe(sha)
  })

  it('installs a full commit SHA', async ({ expect }) => {
    const f = await setup()
    const first = f.commit(BILLING_FILES)
    f.commit({ 'arch/model.c4': 'model { c = actor }' })

    const result = await f.installer.install({ git: URL, ref: first, path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', cached: false, instance: { sha: first } })
    expect(f.gitCommands()).not.toContain('ls-remote')
    expect((await f.storage.readEntry({ repository: REPOSITORY, sha: first, subdir: 'arch' }))?.files['model.c4'])
      .toBe('model {}')
  })

  it('stores only .c4, .likec4 and the JSON config of the path', async ({ expect }) => {
    const f = await setup()
    f.commit({
      ...BILLING_FILES,
      'arch/likec4.config.ts': 'export default { name: "billing" }',
      'arch/likec4.config.mjs': 'export default {}',
      'arch/logo.png': 'png',
      'arch/README.md': '# billing',
      'arch/docs/description.md': 'description',
      'arch/nested/likec4.config.json': '{"name":"nested"}',
      'arch/nested/deep.c4': 'model {}',
      'outside/other.c4': 'model {}',
      'root.c4': 'model {}',
      'likec4.config.json': '{"name":"root"}',
    })
    symlinkSync('../outside/other.c4', join(f.work, 'arch', 'link.c4'))
    const sha = f.commit({}, 'symlink')

    const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', instance: { sha } })
    const entry = await f.storage.readEntry({ repository: REPOSITORY, sha, subdir: 'arch' })
    expect(Object.keys(entry?.files ?? {}).sort()).toEqual([
      'likec4.config.json',
      'model.c4',
      'nested/deep.c4',
      'views/index.likec4',
    ])
  })

  it('installs the repository root when path is omitted', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit({ 'model.c4': 'model {}', 'likec4.config.json': '{"name":"root"}', 'a/b.c4': '' })

    const result = await f.installer.install({ git: URL, ref: 'main' })
    expect(result).toEqual({
      status: 'installed',
      instance: { repository: REPOSITORY, sha, subdir: '' },
      files: 3,
      cached: false,
    })
  })

  describe('failures leave the version index and the storage unchanged', () => {
    it('unknown ref', async ({ expect }) => {
      const f = await setup()
      f.commit(BILLING_FILES)
      const result = await f.installer.install({ git: URL, ref: 'v9.9', path: 'arch' })
      expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('Ref "v9.9" not found') })
      expect(await f.keys()).toEqual([])
      expect(f.tempIsEmpty()).toBe(true)
    })

    it('unknown full SHA', async ({ expect }) => {
      const f = await setup()
      f.commit(BILLING_FILES)
      const result = await f.installer.install({ git: URL, ref: 'b'.repeat(40), path: 'arch' })
      expect(result).toMatchObject({ status: 'failed' })
      expect(await f.keys()).toEqual([])
      expect(f.tempIsEmpty()).toBe(true)
    })

    it('unreachable repository', async ({ expect }) => {
      const f = await setup()
      const result = await f.installer.install({ git: 'https://example.test/org/missing.git', ref: 'main' })
      expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('git ls-remote failed') })
      expect(await f.keys()).toEqual([])
      expect(f.tempIsEmpty()).toBe(true)
    })

    it('path not found in the repository', async ({ expect }) => {
      const f = await setup()
      f.commit(BILLING_FILES)
      const result = await f.installer.install({ git: URL, ref: 'main', path: 'missing' })
      expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('Path "missing" not found') })
      expect(await f.keys()).toEqual([])
      expect(f.tempIsEmpty()).toBe(true)
    })

    it('path without sources', async ({ expect }) => {
      const f = await setup()
      f.commit({ ...BILLING_FILES, 'docs/README.md': '# docs' })
      const result = await f.installer.install({ git: URL, ref: 'main', path: 'docs' })
      expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('No .c4 or .likec4 files') })
      expect(await f.keys()).toEqual([])
    })

    it('update to an unknown ref keeps the previous record', async ({ expect }) => {
      const f = await setup()
      f.commit(BILLING_FILES)
      await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
      const before = await f.keys()
      const record = await f.storage.readVersion(REPOSITORY, 'main')
      // the branch is deleted in the remote
      f.git(f.root, '--git-dir', f.bare, 'update-ref', '-d', 'refs/heads/main')

      const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { update: true })
      expect(result).toMatchObject({ status: 'failed' })
      expect(await f.keys()).toEqual(before)
      expect(await f.storage.readVersion(REPOSITORY, 'main')).toEqual(record)
      expect(f.tempIsEmpty()).toBe(true)
    })

    it('cancelled install', async ({ expect }) => {
      const f = await setup()
      f.commit(BILLING_FILES)
      const source = new Cancellation.CancellationTokenSource()
      source.cancel()
      const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { cancelToken: source.token })
      expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('cancelled') })
      expect(await f.keys()).toEqual([])
      expect(f.tempIsEmpty()).toBe(true)
    })
  })

  it.for([
    ['file:///tmp/repo.git'],
    ['http://example.test/org/billing.git'],
    ['git://example.test/org/billing.git'],
    ['ext::sh -c touch% /tmp/pwned'],
    ['/tmp/repo.git'],
    ['./repo'],
    ['https://example.test/org/billing.git?x=1'],
    ['ssh://-oProxyCommand=touch%20pwned@example.test/org/billing.git'],
    ['-uhttps://example.test/org/billing.git'],
  ])('rejects forbidden URL %s before running git', async ([git = ''], { expect }) => {
    const f = await setup()
    // the URL would be mapped to the local repository, if it passed the check
    f.remotes.set(parseGitRepositoryUrl(git)?.id ?? '', f.bare)
    const result = await f.installer.install({ git, ref: 'main' })
    expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('Invalid git repository URL') })
    expect(f.calls).toEqual([])
    expect(await f.keys()).toEqual([])
  })

  it.for<{ ref: string; path?: string }>([
    { ref: '--upload-pack=touch pwned' },
    { ref: '-x' },
    { ref: 'main~1' },
    { ref: 'main^' },
    { ref: 'a..b' },
    { ref: 'refs/heads/*' },
    { ref: '' },
    { ref: 'main', path: '../outside' },
    { ref: 'main', path: 'a/*' },
    { ref: 'main', path: '-x' },
  ])('rejects invalid source %j before running git', async (source, { expect }) => {
    const f = await setup()
    const result = await f.installer.install({ git: URL, ...source })
    expect(result).toMatchObject({ status: 'failed', error: expect.stringMatching(/^Invalid/) })
    expect(f.calls).toEqual([])
  })

  it('neither creates nor reads likec4.lock', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit({ ...BILLING_FILES, 'arch/likec4.lock': 'lock' })
    // a lock file with another SHA is ignored
    writeFileSync(join(f.root, 'likec4.lock'), JSON.stringify({ billing: 'c'.repeat(40) }))
    writeFileSync(join(f.temp, '..', 'likec4.lock'), JSON.stringify({ billing: 'c'.repeat(40) }))

    const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', instance: { sha } })
    const entry = await f.storage.readEntry({ repository: REPOSITORY, sha, subdir: 'arch' })
    expect(Object.keys(entry?.files ?? {})).not.toContain('likec4.lock')
    expect(existsSync(join(f.work, 'arch', 'likec4.lock'))).toBe(true)
    const locks = execFileSync('find', [f.root, '-name', 'likec4.lock', '-not', '-path', `${f.work}/*`], {
      encoding: 'utf8',
    }).trim().split('\n')
    expect(locks).toEqual([join(f.root, 'likec4.lock')])
  })
})

describe('createGitRunner', () => {
  it('refuses transports other than https and ssh by default', async ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), 'likec4-git-'))
    try {
      execFileSync('git', ['init', '--quiet', '--bare', join(root, 'repo.git')])
      const runGit = createGitRunner()
      await expect(runGit(['ls-remote', '--', join(root, 'repo.git')], { cwd: root })).rejects.toThrow(
        /transport 'file' not allowed/,
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reports a missing git executable', async ({ expect }) => {
    const runGit = createGitRunner({ git: 'likec4-no-such-git' })
    await expect(runGit(['version'], { cwd: tmpdir() })).rejects.toThrow(/git executable not found/)
  })
})
