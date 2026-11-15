import { describe, it } from 'vitest'
import { parseGitRepositoryUrl } from './git-url'
import { isGitDependencySource } from './schema.dependencies'

describe('parseGitRepositoryUrl', () => {
  it.for(
    [
      ['https://github.com/my-org/billing.git', 'https'],
      ['https://github.com/my-org/billing', 'https'],
      ['https://github.com/my-org/billing/', 'https'],
      ['https://GitHub.com:443/my-org/billing.git', 'https'],
      ['https://user:token@github.com/my-org/billing.git', 'https'],
      ['ssh://git@github.com/my-org/billing.git', 'ssh'],
      ['ssh://git@github.com:22/my-org/billing.git', 'ssh'],
      ['git@github.com:my-org/billing.git', 'scp'],
      ['github.com:my-org/billing', 'scp'],
      ['  git@github.com:my-org/billing.git  ', 'scp'],
    ] as const,
  )('maps %s to github.com/my-org/billing', ([url, protocol], { expect }) => {
    expect(parseGitRepositoryUrl(url)).toEqual({
      protocol,
      host: 'github.com',
      path: 'my-org/billing',
      id: 'github.com/my-org/billing',
    })
  })

  it('keeps non-default ports and nested paths', ({ expect }) => {
    expect(parseGitRepositoryUrl('ssh://git@git.example.com:2222/group/sub/repo.git')).toEqual({
      protocol: 'ssh',
      host: 'git.example.com',
      port: 2222,
      path: 'group/sub/repo',
      id: 'git.example.com:2222/group/sub/repo',
    })
    expect(parseGitRepositoryUrl('https://git.example.com:8443/Group/Repo')?.id).toBe('git.example.com:8443/Group/Repo')
  })

  it.for([
    '',
    'http://github.com/my-org/billing.git',
    'file:///work/billing',
    'git://github.com/my-org/billing.git',
    'ext::ssh -i key git@host repo',
    '../billing',
    '/work/billing',
    'C:/work/billing',
    'C:billing',
    'https://github.com/',
    'https://github.com/.git',
    'https://github.com/my-org/../billing',
    'https://github.com/my-org/%2E%2E/billing',
    'https://github.com/my-org/billing?ref=main',
    'https://github.com/my-org/billing#main',
    'https://[::1]/my-org/billing',
    'git@github.com:/my-org/billing.git',
    'ext::sh',
    'fd::17/foo',
    'foo::bar',
    'github.com:my-org/a:b',
    '-oProxyCommand=x@github.com:a/b',
    'ssh://-oProxyCommand=x@github.com/a/b',
    'ssh://us%20er@github.com/a/b',
    'git@-github.com:a/b',
    'ssh://-github.com/a/b',
    'https://github.com/my-org%2Fbilling',
    'https://github.com/my-org%5Cbilling',
    'git@github.com:my-org%2fbilling',
  ])('rejects %s', (url, { expect }) => {
    expect(parseGitRepositoryUrl(url)).toBeUndefined()
  })
})

describe('isGitDependencySource', () => {
  it('detects git sources', ({ expect }) => {
    expect(isGitDependencySource({ git: 'git@github.com:my-org/billing.git', ref: 'main' })).toBe(true)
    expect(isGitDependencySource({ git: 'git@github.com:my-org/billing.git', ref: 'main', path: 'docs' })).toBe(true)
    expect(isGitDependencySource('../shared')).toBe(false)
    expect(isGitDependencySource({ git: 'git@github.com:my-org/billing.git' })).toBe(false)
    expect(isGitDependencySource(null)).toBe(false)
  })
})
