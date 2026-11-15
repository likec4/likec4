import { describe, it } from 'vitest'
import { gitEnvironment, gitRefCandidates, isValidGitRef, parseLsRemote, pickRemoteRef, refAsFullSha } from './git'
import { redactGitUrl } from './install'

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
})
