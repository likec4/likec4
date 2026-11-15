import { parseGitRepositoryUrl } from '@likec4/config'
import { describe, it } from 'vitest'
import {
  findGitExecutable,
  GIT_CONFIG_ARGS,
  gitEnvironment,
  gitRefCandidates,
  isSupportedGitVersion,
  isValidGitRef,
  parseGitVersion,
  parseLsRemote,
  pickRemoteRef,
  refAsFullSha,
} from './git'
import { gitRemoteUrl, redactGitUrl, stripGitUrlCredentials } from './install'

const A = 'a'.repeat(40)
const B = 'b'.repeat(40)
const C = 'c'.repeat(40)

describe('git', () => {
  it('validates refs', ({ expect }) => {
    for (const ref of ['main', 'v1.0.0', 'release/1.x', 'refs/heads/main', 'HEAD', 'feature+x', 'user@fix', A]) {
      expect(isValidGitRef(ref), ref).toBe(true)
    }
    for (
      const ref of [
        '',
        '-x',
        '--upload-pack=x',
        'a b',
        'a:b',
        'a..b',
        'main~1',
        'main^',
        'a?',
        'a*',
        'a[b',
        'a\\b',
        '@{1}',
        '@',
        'a.lock',
        'a/',
        '/a',
        'a//b',
        'a.',
        '.a',
        'a\n',
      ]
    ) {
      expect(isValidGitRef(ref), ref).toBe(false)
    }
  })

  it('treats only full SHAs as SHAs', ({ expect }) => {
    expect(refAsFullSha(A.toUpperCase())).toBe(A)
    expect(refAsFullSha('d'.repeat(64))).toBe('d'.repeat(64))
    expect(refAsFullSha('abcdef1')).toBeUndefined()
    expect(refAsFullSha('main')).toBeUndefined()
  })

  it('prefers tags to branches and peels annotated tags', ({ expect }) => {
    expect(gitRefCandidates('v1')).toEqual(['refs/tags/v1', 'refs/tags/v1^{}', 'refs/heads/v1'])
    const refs = parseLsRemote(
      [`${A}\trefs/heads/v1`, `${B}\trefs/tags/v1`, `${C}\trefs/tags/v1^{}`, `${A}\trefs/remotes/x/refs/tags/v2`, '']
        .join('\n'),
    )
    expect(pickRemoteRef('v1', refs)).toEqual({ name: 'refs/tags/v1', sha: C })
    // tail matches of ls-remote are ignored
    expect(pickRemoteRef('v2', refs)).toBeUndefined()
    expect(pickRemoteRef('refs/heads/v1', refs)).toEqual({ name: 'refs/heads/v1', sha: A })
  })

  it('runs git without prompts, with restricted transports and without LFS', ({ expect }) => {
    const env = gitEnvironment({ PATH: '/bin', GIT_DIR: '/x', GIT_CONFIG_PARAMETERS: '\'a.b\'=\'c\'', HOME: '/home' })
    expect(env).toMatchObject({
      PATH: '/bin',
      HOME: '/home',
      GIT_TERMINAL_PROMPT: '0',
      GIT_ALLOW_PROTOCOL: 'https:ssh',
      GIT_LFS_SKIP_SMUDGE: '1',
    })
    expect(env).not.toHaveProperty('GIT_DIR')
    expect(env).not.toHaveProperty('GIT_CONFIG_PARAMETERS')
  })

  it('redacts credentials of URLs', ({ expect }) => {
    expect(redactGitUrl('https://user:token@example.com/org/repo.git')).toBe('https://***@example.com/org/repo.git')
    expect(redactGitUrl('git@example.com:org/repo.git')).toBe('git@example.com:org/repo.git')
  })

  it('keeps only allowed GIT_* variables and drops askpass programs', ({ expect }) => {
    const env = gitEnvironment({
      GIT_SSH_COMMAND: 'ssh -i key',
      GIT_SSL_CAINFO: '/ca.pem',
      GIT_CONFIG_GLOBAL: '/gitconfig',
      GIT_TEMPLATE_DIR: '/templates',
      GIT_DEFAULT_HASH: 'sha256',
      GIT_SHALLOW_FILE: '/shallow',
      GIT_ASKPASS: '/askpass',
      SSH_ASKPASS: '/ssh-askpass',
      HTTPS_PROXY: 'http://proxy',
    })
    expect(Object.keys(env).filter(k => k.includes('ASKPASS'))).toEqual(['SSH_ASKPASS_REQUIRE'])
    expect(env).toMatchObject({
      GIT_SSH_COMMAND: 'ssh -i key',
      GIT_SSL_CAINFO: '/ca.pem',
      GIT_CONFIG_GLOBAL: '/gitconfig',
      HTTPS_PROXY: 'http://proxy',
      SSH_ASKPASS_REQUIRE: 'never',
    })
    for (const key of ['GIT_TEMPLATE_DIR', 'GIT_DEFAULT_HASH', 'GIT_SHALLOW_FILE', 'GIT_ASKPASS', 'SSH_ASKPASS']) {
      expect(env).not.toHaveProperty(key)
    }
    expect(GIT_CONFIG_ARGS).toEqual(
      expect.arrayContaining(['core.askPass=', 'init.templateDir=', 'transfer.fsckObjects=true']),
    )
  })

  it('checks the git version', ({ expect }) => {
    expect(parseGitVersion('git version 2.39.2 (Apple Git-143)')).toEqual([2, 39, 2])
    expect(parseGitVersion('git version 2.45.1.windows.1\n')).toEqual([2, 45, 1])
    expect(parseGitVersion('git version 3.0')).toEqual([3, 0, 0])
    expect(parseGitVersion('hello')).toBeUndefined()
    expect(isSupportedGitVersion([2, 35, 0])).toBe(true)
    expect(isSupportedGitVersion([2, 55, 0])).toBe(true)
    expect(isSupportedGitVersion([3, 0, 0])).toBe(true)
    expect(isSupportedGitVersion([2, 34, 9])).toBe(false)
    expect(isSupportedGitVersion([1, 99, 0])).toBe(false)
  })

  describe('findGitExecutable', () => {
    const lookup = (existing: string[]) => {
      const checked: string[] = []
      const isExecutable = (path: string) => {
        checked.push(path)
        return Promise.resolve(existing.includes(path))
      }
      return { checked, isExecutable }
    }

    it('searches absolute PATH entries only (POSIX)', async ({ expect }) => {
      const { checked, isExecutable } = lookup(['git', './git', 'bin/git', '/opt/bin/git'])
      const found = await findGitExecutable({
        env: { PATH: '::.:bin:/usr/bin:/opt/bin' },
        platform: 'linux',
        isExecutable,
      })
      expect(found).toBe('/opt/bin/git')
      expect(checked).toEqual(['/usr/bin/git', '/opt/bin/git'])
    })

    it('searches absolute PATH entries with PATHEXT .exe and .com only (Windows)', async ({ expect }) => {
      const { checked, isExecutable } = lookup(['git.exe', 'C:\\Git\\cmd\\git.exe'])
      const found = await findGitExecutable({
        env: { Path: '.;bin;"C:\\Git\\cmd"', PATHEXT: '.COM;.EXE;.BAT;.CMD' },
        platform: 'win32',
        isExecutable,
      })
      expect(found).toBe('C:\\Git\\cmd\\git.exe')
      expect(checked).toEqual(['C:\\Git\\cmd\\git.com', 'C:\\Git\\cmd\\git.exe'])
    })

    it('accepts absolute paths, rejects relative paths', async ({ expect }) => {
      const { isExecutable } = lookup(['/usr/local/bin/git', './git'])
      expect(await findGitExecutable({ name: '/usr/local/bin/git', env: {}, platform: 'linux', isExecutable }))
        .toBe('/usr/local/bin/git')
      expect(await findGitExecutable({ name: './git', env: { PATH: '/usr/bin' }, platform: 'linux', isExecutable }))
        .toBeUndefined()
      expect(await findGitExecutable({ env: {}, platform: 'linux', isExecutable })).toBeUndefined()
    })
  })

  it('rebuilds the URL passed to git from the parsed parts', ({ expect }) => {
    const remote = (url: string) => gitRemoteUrl(parseGitRepositoryUrl(url)!, url)
    expect(remote('https://GitHub.com/my-org/billing.git/')).toBe('https://github.com/my-org/billing.git')
    expect(remote('https://deploy@example.com:8443/a/b')).toBe('https://deploy@example.com:8443/a/b')
    expect(remote('https://example.com:443/a/bill%23ing.git')).toBe('https://example.com/a/bill%23ing.git')
    expect(remote('ssh://git@example.com:2222/a/b.git')).toBe('ssh://git@example.com:2222/a/b.git')
    expect(remote('git@github.com:my-org/billing.git')).toBe('git@github.com:my-org/billing.git')
    expect(remote('github.com:my-org/billing')).toBe('github.com:my-org/billing')
  })

  it('strips credentials from stored URLs', ({ expect }) => {
    expect(stripGitUrlCredentials('https://user:token@example.com/a/b.git')).toBe('https://user@example.com/a/b.git')
    expect(stripGitUrlCredentials(' https://user@example.com/a/b.git ')).toBe('https://user@example.com/a/b.git')
    expect(stripGitUrlCredentials('git@example.com:a/b.git')).toBe('git@example.com:a/b.git')
  })
})
