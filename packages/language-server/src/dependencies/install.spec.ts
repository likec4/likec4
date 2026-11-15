import { parseGitRepositoryUrl } from '@likec4/config'
import { Cancellation } from 'langium'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, it } from 'vitest'
import { createTestServices } from '../test'
import { type GitRunner, createGitRunner, fetchGitCommit, GIT_BATCH_SSH_COMMAND, initGitRepository } from './git'
import { type GitDependencyInstallerOptions, createGitDependencyInstaller } from './install'
import { dependencyCacheKey } from './storage'

const URL = 'https://example.test/org/billing.git'
const URL_SCP = 'git@example.test:org/billing.git'
const REPOSITORY = 'example.test/org/billing'

/**
 * Temporary folder with a local git repository and its bare clone (the "remote").
 * Tests never go to the network: allowed URLs (`https://example.test/...`) are mapped to the bare repository.
 */
function createFixture(installerOptions?: GitDependencyInstallerOptions, objectFormat: 'sha1' | 'sha256' = 'sha1') {
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
  git(root, 'init', '--quiet', '--bare', '--initial-branch=main', `--object-format=${objectFormat}`, bare)
  // partial clone (--filter=blob:none) is supported by the "remote"
  git(bare, 'config', 'uploadpack.allowFilter', 'true')
  git(root, 'init', '--quiet', '--initial-branch=main', `--object-format=${objectFormat}`, work)

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
  /**
   * Writes files and commits them with a commit object written as is (`hash-object --literally`), pushes.
   * @param people author and committer lines
   */
  const commitLiterally = (files: Record<string, string>, people: string[]) => {
    for (const [path, content] of Object.entries(files)) {
      const file = join(work, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, content)
    }
    git(work, 'add', '--all')
    const tree = git(work, 'write-tree')
    const parent = git(work, 'rev-parse', 'HEAD')
    const content = [`tree ${tree}`, `parent ${parent}`, ...people, '', 'literally', ''].join('\n')
    const sha = execFileSync('git', ['hash-object', '--literally', '-t', 'commit', '-w', '--stdin'], {
      cwd: work,
      env,
      input: content,
      encoding: 'utf8',
    }).trim()
    git(work, 'update-ref', 'refs/heads/main', sha)
    git(work, 'push', '--quiet', bare, 'main')
    return sha
  }
  /**
   * Adds a symbolic link to the index (portable: no symbolic link on the file system), commits and pushes.
   */
  const commitSymlink = (path: string, target: string) => {
    const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
      cwd: work,
      env,
      input: target,
      encoding: 'utf8',
    })
      .trim()
    git(work, 'update-index', '--add', '--cacheinfo', `120000,${blob},${path}`)
    git(work, 'commit', '--quiet', '--no-verify', '-m', 'symlink')
    git(work, 'push', '--quiet', bare, 'main')
    return git(work, 'rev-parse', 'HEAD')
  }
  const tag = (name: string) => {
    git(work, 'tag', '-a', name, '-m', name)
    git(work, 'push', '--quiet', bare, `refs/tags/${name}`)
  }

  // real git, with the local transport allowed for the bare repository of the fixture
  const realGit = createGitRunner({ env, allowProtocol: 'file' })
  const calls: string[][] = []
  const cwds: string[] = []
  // when set, git commands wait for it (or for the abort of the command)
  let gate: Promise<void> | undefined
  const runGit: GitRunner = async (args, options) => {
    calls.push([...args])
    cwds.push(options.cwd)
    if (gate) {
      const wait = gate
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => reject(new Error('git command was cancelled'))
        if (options.signal?.aborted) {
          onAbort()
          return
        }
        options.signal?.addEventListener('abort', onAbort, { once: true })
        void wait.then(() => {
          options.signal?.removeEventListener('abort', onAbort)
          resolve()
        })
      })
    }
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
          ...installerOptions,
        }),
    },
  })
  const installer = services.shared.dependencies.Installer
  const storage = services.shared.dependencies.Storage
  const keys = async () => (await storage.storage.getKeys()).sort()

  return {
    initialize,
    globalConfig,
    root,
    env,
    bare,
    temp,
    work,
    git,
    commit,
    commitSymlink,
    commitLiterally,
    tag,
    calls,
    cwds,
    realGit,
    /**
     * Holds git commands until the returned function is called
     */
    hold: () => {
      let release = () => {}
      gate = new Promise<void>(resolve => {
        release = () => {
          gate = undefined
          resolve()
        }
      })
      return release
    },
    remotes,
    installer,
    storage,
    keys,
    gitCommands: () => calls.map(gitCommand),
    tempIsEmpty: () => readdirSync(temp).length === 0,
  }
}

type Fixture = ReturnType<typeof createFixture>

/**
 * Git command of the arguments (without `-C <dir>` and global options)
 */
function gitCommand(args: readonly string[]): string | undefined {
  let i = 0
  while (i < args.length && args[i]!.startsWith('-')) {
    i += args[i] === '-C' ? 2 : 1
  }
  return args[i]
}

/**
 * Files with the name in the folder (recursive)
 */
function findFiles(dir: string, name: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile() && entry.name === name)
    .map(entry => join(entry.parentPath, entry.name))
}

const BILLING_FILES = {
  'arch/likec4.config.json': '{"name":"billing"}',
  'arch/model.c4': 'model {}',
  'arch/views/index.likec4': 'views {}',
}

describe('GitDependencyInstaller', () => {
  const fixtures = [] as Fixture[]
  const setup = async (options?: GitDependencyInstallerOptions, objectFormat?: 'sha1' | 'sha256') => {
    const fixture = createFixture(options, objectFormat)
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
    expect(f.gitCommands()).toEqual(['init', 'config', 'config', 'config', 'config', 'ls-remote'])
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

    const lsRemote = f.calls.filter(args => gitCommand(args) === 'ls-remote')
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
    // full SHAs are recorded in lower case
    expect((await f.storage.readVersion(REPOSITORY, sha))?.sha).toBe(sha)
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
    const sha = f.commitSymlink('arch/link.c4', '../outside/other.c4')

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
    const sha = f.commit({
      'model.c4': 'model {}',
      'likec4.config.json': '{"name":"root"}',
      'a/b.c4': '',
      'a/likec4.config.json': '{}',
      'README.md': '# root',
      'likec4.config.ts': 'export default {}',
      'upper.C4': 'model {}',
    })

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

  it('runs git outside of the checkout', async ({ expect }) => {
    const f = await setup()
    f.commit(BILLING_FILES)
    expect(await f.installer.install({ git: URL, ref: 'main', path: 'arch' })).toMatchObject({ status: 'installed' })
    expect(f.cwds.length).toBeGreaterThan(0)
    // the temporary directory of the install, the checkout is its "repo" subdirectory addressed with -C
    for (const cwd of f.cwds) {
      expect(dirname(cwd)).toBe(f.temp)
    }
    for (const args of f.calls.filter(args => gitCommand(args) !== 'ls-remote')) {
      expect(args.slice(0, 2)).toEqual(['-C', join(f.cwds[0]!, 'repo')])
    }
  })

  // meaningful on case-insensitive file systems (macOS, Windows): the checkout of "ARCH" would succeed there
  it('requires the exact case of the path', async ({ expect }) => {
    const f = await setup()
    f.commit(BILLING_FILES)
    const result = await f.installer.install({ git: URL, ref: 'main', path: 'ARCH' })
    expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('Path "ARCH" not found') })
    expect(await f.keys()).toEqual([])
    expect(f.tempIsEmpty()).toBe(true)
  })

  it('installs a SHA of an annotated tag once', async ({ expect }) => {
    const f = await setup()
    const commit = f.commit(BILLING_FILES)
    f.tag('v1.0')
    const tagObject = f.git(f.work, 'rev-parse', 'refs/tags/v1.0')
    expect(tagObject).not.toBe(commit)

    const first = await f.installer.install({ git: URL, ref: tagObject, path: 'arch' })
    expect(first).toMatchObject({ status: 'installed', cached: false, instance: { sha: commit } })
    expect((await f.storage.readVersion(REPOSITORY, tagObject))?.sha).toBe(commit)

    f.calls.length = 0
    const second = await f.installer.install({ git: URL, ref: tagObject, path: 'arch' }, { update: true })
    expect(second).toMatchObject({ status: 'installed', cached: true, instance: { sha: commit } })
    expect(f.calls).toEqual([])
  })

  it('downloads only blobs of the sources of the path (partial clone)', async ({ expect }) => {
    const f = await setup()
    f.commit({ ...BILLING_FILES, 'big/blob.txt': 'x'.repeat(100_000), 'arch/logo.png': 'png' })
    const blob = f.git(f.work, 'rev-parse', 'HEAD:big/blob.txt')
    const logo = f.git(f.work, 'rev-parse', 'HEAD:arch/logo.png')
    const model = f.git(f.work, 'rev-parse', 'HEAD:arch/model.c4')
    const dir = join(f.root, 'checkout')
    mkdirSync(dir)
    const options = { cwd: f.root }
    await initGitRepository(f.realGit, { remote: f.bare, dir }, options)
    await fetchGitCommit(f.realGit, { what: 'refs/heads/main', subdir: 'arch', dir }, options)
    const objects = f.git(dir, 'rev-list', '--objects', '--missing=print', 'HEAD')
    expect(objects).toContain(`?${blob}`)
    expect(objects).toContain(`?${logo}`)
    expect(objects).not.toContain(`?${model}`)
    expect(existsSync(join(dir, 'big'))).toBe(false)
    expect(existsSync(join(dir, 'arch', 'logo.png'))).toBe(false)
  })

  it('installs commits with harmless defects (no fsck)', async ({ expect }) => {
    const f = await setup()
    f.commit(BILLING_FILES)
    // bad time zone and a missing space before the date
    const sha = f.commitLiterally({ 'arch/model.c4': 'model { e = actor }' }, [
      'author test <test@example.test> 1700000000 +0000x',
      'committer test <test@example.test>1700000000 +0000',
    ])
    const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', instance: { sha } })
    expect((await f.storage.readEntry({ repository: REPOSITORY, sha, subdir: 'arch' }))?.files['model.c4'])
      .toBe('model { e = actor }')
  })

  it('installs a nested path', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit({
      'a/b/likec4.config.json': '{"name":"nested"}',
      'a/b/model.c4': 'model {}',
      'a/other.c4': 'model {}',
      'a/bc/other.c4': 'model {}',
    })
    const result = await f.installer.install({ git: URL, ref: 'main', path: 'a/b/' })
    expect(result).toEqual({
      status: 'installed',
      instance: { repository: REPOSITORY, sha, subdir: 'a/b' },
      files: 2,
      cached: false,
    })
    const entry = await f.storage.readEntry({ repository: REPOSITORY, sha, subdir: 'a/b' })
    expect(Object.keys(entry?.files ?? {}).sort()).toEqual(['likec4.config.json', 'model.c4'])
  })

  it('stores the URL as written, without credentials', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit(BILLING_FILES)
    const git = 'https://deploy@example.test/org/billing.git'
    expect(await f.installer.install({ git, ref: 'main', path: 'arch' })).toMatchObject({ status: 'installed' })
    expect((await f.storage.readEntry({ repository: REPOSITORY, sha, subdir: 'arch' }))?.url).toBe(git)
    expect((await f.storage.readVersion(REPOSITORY, 'main'))?.url).toBe(git)
  })

  it('removes stale temporary directories', async ({ expect }) => {
    const f = await setup()
    f.commit(BILLING_FILES)
    const stale = join(f.temp, 'likec4-git-stale')
    const fresh = join(f.temp, 'likec4-git-fresh')
    const other = join(f.temp, 'other')
    for (const dir of [stale, fresh, other]) {
      mkdirSync(dir)
    }
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    utimesSync(stale, old, old)
    utimesSync(other, old, old)
    await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(readdirSync(f.temp).sort()).toEqual(['likec4-git-fresh', 'other'])
  })

  it('installs a SHA-256 repository', async ({ expect }) => {
    const f = await setup(undefined, 'sha256')
    const sha = f.commit(BILLING_FILES)
    expect(sha).toMatch(/^[0-9a-f]{64}$/)
    const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', cached: false, instance: { sha }, files: 3 })
    expect((await f.storage.readVersion(REPOSITORY, 'main'))?.sha).toBe(sha)
  })

  it('ignores init.defaultObjectFormat of the user', async ({ expect }) => {
    const f = await setup()
    const sha = f.commit(BILLING_FILES)
    writeFileSync(f.globalConfig, '[init]\n\tdefaultObjectFormat = sha256\n')
    const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(result).toMatchObject({ status: 'installed', instance: { sha } })
  })

  it('fails if the configuration of the user adds a URL to the remote', async ({ expect }) => {
    const f = await setup()
    f.commit(BILLING_FILES)
    writeFileSync(f.globalConfig, '[remote "likec4-dependency"]\n\turl = /somewhere/else.git\n')
    const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('Unexpected URL of the remote') })
    expect(f.gitCommands()).not.toContain('ls-remote')
    expect(await f.keys()).toEqual([])
  })

  it('sets a batch ssh command on Windows only when none is configured', async ({ expect }) => {
    const f = await setup()
    const init = async (platform: string) => {
      const dir = mkdtempSync(join(f.root, 'init-'))
      await initGitRepository(f.realGit, { remote: f.bare, dir, platform }, { cwd: f.root })
      try {
        return f.git(dir, 'config', '--local', '--get', 'core.sshCommand')
      } catch {
        // not set
        return ''
      }
    }
    expect(await init('win32')).toBe(GIT_BATCH_SSH_COMMAND)
    expect(await init('linux')).toBe('')
    writeFileSync(f.globalConfig, '[core]\n\tsshCommand = ssh -i key\n')
    expect(await init('win32')).toBe('')
  })

  it('an install abandoned while awaiting the storage writes nothing, the next run waits for it', async ({ expect }) => {
    const f = await setup({ deadline: 1500 })
    const sha = f.commit(BILLING_FILES)
    const instance = { repository: REPOSITORY, sha, subdir: 'arch' }
    await f.storage.writeEntry({
      format: 1,
      repository: REPOSITORY,
      url: URL,
      sha,
      subdir: 'arch',
      files: { 'a.c4': '' },
    })

    // hold the storage read after ls-remote (the instance is installed: only the version index would be written)
    let releaseRead = () => {}
    const readHeld = new Promise<void>(resolve => {
      releaseRead = resolve
    })
    let reads = 0
    const readEntry = f.storage.readEntry.bind(f.storage)
    f.storage.readEntry = async entry => {
      reads++
      await readHeld
      return readEntry(entry)
    }
    let versionWrites = 0
    const writeVersion = f.storage.writeVersion.bind(f.storage)
    f.storage.writeVersion = async record => {
      versionWrites++
      return writeVersion(record)
    }

    const first = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    expect(first).toMatchObject({ status: 'failed', error: expect.stringContaining('timed out') })
    expect(reads).toBe(1)

    // the next run of the same source waits for the abandoned install
    const calls = f.calls.length
    const second = f.installer.install({ git: URL, ref: 'main', path: 'arch' })
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(f.calls.length).toBe(calls)

    releaseRead()
    expect(await second).toMatchObject({ status: 'installed', cached: true, instance })
    // only the second run wrote the version index
    expect(versionWrites).toBe(1)
    expect(f.tempIsEmpty()).toBe(true)
  })

  describe('concurrent installs', () => {
    it('a cancelled caller does not cancel the shared install', async ({ expect }) => {
      const f = await setup()
      const sha = f.commit(BILLING_FILES)
      const release = f.hold()
      const a = new Cancellation.CancellationTokenSource()
      const b = new Cancellation.CancellationTokenSource()
      const first = f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { cancelToken: a.token })
      const second = f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { cancelToken: b.token })
      a.cancel()
      expect(await first).toEqual({ status: 'failed', error: 'Installation was cancelled' })
      release()
      expect(await second).toMatchObject({ status: 'installed', instance: { sha } })
    })

    it('the shared install is aborted when all callers cancelled', async ({ expect }) => {
      const f = await setup()
      const sha = f.commit(BILLING_FILES)
      const release = f.hold()
      const a = new Cancellation.CancellationTokenSource()
      const b = new Cancellation.CancellationTokenSource()
      const first = f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { cancelToken: a.token })
      const second = f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { cancelToken: b.token })
      // the run reaches git
      await expect.poll(() => f.calls.length).toBeGreaterThan(0)
      a.cancel()
      b.cancel()
      expect(await first).toMatchObject({ status: 'failed' })
      expect(await second).toMatchObject({ status: 'failed' })
      expect(await f.keys()).toEqual([])
      // the next install does not join the aborted run
      const next = f.installer.install({ git: URL, ref: 'main', path: 'arch' })
      release()
      expect(await next).toMatchObject({ status: 'installed', instance: { sha } })
      expect(f.tempIsEmpty()).toBe(true)
    })

    it('an update waits for the running install', async ({ expect }) => {
      const f = await setup()
      const sha = f.commit(BILLING_FILES)
      const release = f.hold()
      const install = f.installer.install({ git: URL, ref: 'main', path: 'arch' })
      const update = f.installer.install({ git: URL, ref: 'main', path: 'arch' }, { update: true })
      await expect.poll(() => f.calls.length).toBe(1)
      release()
      expect(await install).toMatchObject({ status: 'installed', cached: false, instance: { sha } })
      expect(await update).toMatchObject({ status: 'installed', cached: true, instance: { sha } })
      // the update resolved the ref again after the install finished
      const commands = f.gitCommands()
      expect(commands.filter(c => c === 'ls-remote')).toHaveLength(2)
      expect(commands.lastIndexOf('ls-remote')).toBeGreaterThan(commands.indexOf('checkout'))
    })

    it('fails when the deadline is exceeded', async ({ expect }) => {
      const f = await setup({ deadline: 50 })
      f.commit(BILLING_FILES)
      const release = f.hold()
      const result = await f.installer.install({ git: URL, ref: 'main', path: 'arch' })
      expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('timed out') })
      release()
      // the abandoned install cleans up in the background and writes nothing
      await expect.poll(() => f.tempIsEmpty()).toBe(true)
      expect(await f.keys()).toEqual([])
    })
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
    const locks = findFiles(f.root, 'likec4.lock').filter(path => !path.startsWith(join(f.work, '')))
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
