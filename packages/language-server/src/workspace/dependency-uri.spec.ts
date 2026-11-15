import { parseGitRepositoryUrl } from '@likec4/config'
import { URI } from 'langium'
import { describe, it } from 'vitest'
import {
  buildDependencyUri,
  documentSourceUri,
  gitDependencyUri,
  isDependencyUri,
  isGitSha,
  isValidLocalDependencyFolder,
  localDependencyFile,
  localDependencyFolder,
  localDependencyUri,
  normalizeGitSubdir,
  parseDependencyUri,
  parseGitDependencyUri,
} from './dependency-uri'
import { externalProjectIdOfUri } from './ExternalProjects'

const SHA = '0123456789abcdef0123456789abcdef01234567'

describe('dependency-uri', () => {
  it('builds and parses URIs of local dependencies', ({ expect }) => {
    const uri = localDependencyUri(URI.parse('file:///work/shared'), URI.parse('file:///work/shared/views/index.c4'))
    expect(uri.toString()).toBe('likec4-dep://local/work/shared/-/views/index.c4')
    expect(isDependencyUri(uri)).toBe(true)
    expect(isDependencyUri(uri.toString())).toBe(true)
    expect(isDependencyUri('file:///work/shared/views/index.c4')).toBe(false)
    expect(parseDependencyUri(uri)).toEqual({ authority: 'local', instance: '/work/shared', path: 'views/index.c4' })
    expect(parseDependencyUri(uri.toString())).toEqual(parseDependencyUri(uri))
    expect(localDependencyFolder(uri)?.toString()).toBe('file:///work/shared')
  })

  it('accepts folders with trailing slash', ({ expect }) => {
    const uri = localDependencyUri(URI.parse('file:///work/shared/'), URI.parse('file:///work/shared/model.c4'))
    expect(uri.toString()).toBe('likec4-dep://local/work/shared/-/model.c4')
  })

  it('gives distinct URIs for the same file in nested folders', ({ expect }) => {
    const file = URI.parse('file:///deps/lib/sub/model.c4')
    const outer = localDependencyUri(URI.parse('file:///deps/lib'), file)
    const inner = localDependencyUri(URI.parse('file:///deps/lib/sub'), file)
    expect(outer.toString()).toBe('likec4-dep://local/deps/lib/-/sub/model.c4')
    expect(inner.toString()).toBe('likec4-dep://local/deps/lib/sub/-/model.c4')
    expect(localDependencyFolder(outer)?.toString()).toBe('file:///deps/lib')
    expect(localDependencyFolder(inner)?.toString()).toBe('file:///deps/lib/sub')
  })

  it('round-trips Windows drive paths', ({ expect }) => {
    for (
      const [folder, file] of [
        [URI.parse('file:///C:/work/shared'), URI.parse('file:///C:/work/shared/model.c4')],
        [URI.parse('file:///c%3A/work/shared'), URI.parse('file:///C%3A/work/shared/model.c4')],
        [URI.file('C:/work/shared'), URI.file('C:/work/shared/model.c4')],
      ] as const
    ) {
      const uri = localDependencyUri(folder, file)
      expect(uri.toString()).toBe('likec4-dep://local/c%3A/work/shared/-/model.c4')
      const parsed = URI.parse(uri.toString())
      expect(parseDependencyUri(parsed)).toEqual({ authority: 'local', instance: '/c:/work/shared', path: 'model.c4' })
      expect(localDependencyFolder(parsed)?.toString()).toBe('file:///c%3A/work/shared')
      expect(localDependencyFolder(parsed)?.toString()).toBe(URI.parse(folder.toString()).toString())
    }
    // upper case drive in the dependency URI resolves to the same folder
    expect(localDependencyFolder('likec4-dep://local/C:/work/shared/-/model.c4')?.toString())
      .toBe('file:///c%3A/work/shared')
  })

  it('round-trips special characters', ({ expect }) => {
    const folder = URI.file('/work/my deps/shared#1')
    const file = URI.file('/work/my deps/shared#1/views/a b.c4')
    const uri = localDependencyUri(folder, file)
    const parsed = parseDependencyUri(uri.toString())
    expect(parsed).toEqual({ authority: 'local', instance: '/work/my deps/shared#1', path: 'views/a b.c4' })
    expect(localDependencyFolder(uri.toString())?.toString()).toBe(folder.toString())
  })

  it('escapes "-" segments of the folder path', ({ expect }) => {
    const folder = URI.parse('file:///work/-/--/shared')
    const uri = localDependencyUri(folder, URI.parse('file:///work/-/--/shared/-/model.c4'))
    expect(uri.toString()).toBe('likec4-dep://local/work/--/---/shared/-/-/model.c4')
    expect(parseDependencyUri(uri.toString())).toEqual({
      authority: 'local',
      instance: '/work/-/--/shared',
      path: '-/model.c4',
    })
    expect(localDependencyFolder(uri)?.toString()).toBe('file:///work/-/--/shared')
  })

  it('keeps the format open for other authorities (git)', ({ expect }) => {
    const uri = buildDependencyUri({
      authority: 'github.com',
      instance: '/my-org/billing@0123abcd',
      path: 'architecture/model.c4',
    })
    expect(uri.toString()).toBe('likec4-dep://github.com/my-org/billing%400123abcd/-/architecture/model.c4')
    expect(parseDependencyUri(uri.toString())).toEqual({
      authority: 'github.com',
      instance: '/my-org/billing@0123abcd',
      path: 'architecture/model.c4',
    })
    // not a local dependency
    expect(localDependencyFolder(uri)).toBeUndefined()
  })

  it('rejects invalid URIs and folders', ({ expect }) => {
    expect(parseDependencyUri('likec4-dep://local/work/shared/model.c4')).toBeUndefined()
    expect(parseDependencyUri('likec4-dep://local/-/model.c4')).toBeUndefined()
    expect(parseDependencyUri('likec4-dep://local/work/shared/-/')).toBeUndefined()
    expect(parseDependencyUri('likec4-dep:///work/shared/-/model.c4')).toBeUndefined()
    expect(parseDependencyUri('file:///work/shared/-/model.c4')).toBeUndefined()

    expect(isValidLocalDependencyFolder(URI.parse('file:///work/shared'))).toBe(true)
    expect(isValidLocalDependencyFolder(URI.parse('file://server/share/shared'))).toBe(false)
    expect(isValidLocalDependencyFolder(URI.parse('vscode-vfs://github/org/repo'))).toBe(false)
    expect(() => localDependencyUri(URI.parse('file:///work/shared'), URI.parse('file:///work/other/m.c4')))
      .toThrow()
  })

  it('maps documents of local dependencies back to their files', ({ expect }) => {
    const folder = URI.file('C:/work/shared')
    const file = URI.file('C:/work/shared/views/a b.c4')
    const uri = localDependencyUri(folder, file)
    expect(localDependencyFile(uri)?.toString()).toBe(URI.parse(file.toString()).toString())
    expect(documentSourceUri(uri).toString()).toBe('file:///c%3A/work/shared/views/a%20b.c4')
    const escaped = localDependencyUri(URI.parse('file:///work/-'), URI.parse('file:///work/-/-/m.c4'))
    expect(documentSourceUri(escaped).toString()).toBe('file:///work/-/-/m.c4')

    // non-local dependencies and other documents keep their URIs
    const git = URI.parse('likec4-dep://github.com/my-org/billing%40abc/-/model.c4')
    expect(localDependencyFile(git)).toBeUndefined()
    expect(documentSourceUri(git)).toBe(git)
    const workspaceDoc = URI.parse('file:///work/app/model.c4')
    expect(documentSourceUri(workspaceDoc)).toBe(workspaceDoc)
  })

  describe('git dependencies', () => {
    it.for(
      [
        // url, subdir, expected URI
        [
          'https://github.com/my-org/billing.git',
          '',
          `likec4-dep://github.com/my-org/billing%40${SHA}/-/architecture/model.c4`,
        ],
        [
          'https://github.com/my-org/billing',
          'docs/arch',
          `likec4-dep://github.com/my-org/billing%40${SHA}/docs/arch/-/architecture/model.c4`,
        ],
        [
          'ssh://git@github.com/my-org/billing.git',
          'docs',
          `likec4-dep://github.com/my-org/billing%40${SHA}/docs/-/architecture/model.c4`,
        ],
        [
          'ssh://git@git.example.com:2222/group/sub/billing.git',
          'docs/arch',
          `likec4-dep://git.example.com:2222/group/sub/billing%40${SHA}/docs/arch/-/architecture/model.c4`,
        ],
        [
          'git@github.com:my-org/billing.git',
          'docs/arch',
          `likec4-dep://github.com/my-org/billing%40${SHA}/docs/arch/-/architecture/model.c4`,
        ],
        [
          'git@gitlab.example.com:group/-/billing.git',
          '-/nested',
          `likec4-dep://gitlab.example.com/group/--/billing%40${SHA}/--/nested/-/architecture/model.c4`,
        ],
      ] as const,
    )('round-trips %s (subdir "%s")', ([url, subdir, expected], { expect }) => {
      const repository = parseGitRepositoryUrl(url)?.id
      expect(repository).toBeDefined()
      const instance = { repository: repository!, sha: SHA, subdir }
      const uri = gitDependencyUri(instance, 'architecture/model.c4')
      expect(uri.toString()).toBe(expected)
      expect(isDependencyUri(uri)).toBe(true)
      expect(parseGitDependencyUri(uri.toString())).toEqual({ instance, path: 'architecture/model.c4' })
      expect(parseGitDependencyUri(URI.parse(uri.toString()))).toEqual({ instance, path: 'architecture/model.c4' })
      // not a local dependency, no file
      expect(localDependencyFolder(uri)).toBeUndefined()
      expect(documentSourceUri(uri)).toBe(uri)
      // owner is derived from the URI alone
      expect(externalProjectIdOfUri(uri)).toBe(
        `#likec4-dep://${repository!.split('/')[0]}${parseDependencyUri(uri)!.instance}`,
      )
    })

    it('gives the same URIs to different spellings of one repository', ({ expect }) => {
      const uris = [
        'https://github.com/my-org/billing.git',
        'https://GitHub.com:443/my-org/billing/',
        'ssh://git@github.com:22/my-org/billing.git',
        'git@github.com:my-org/billing.git',
      ].map(url => gitDependencyUri({ repository: parseGitRepositoryUrl(url)!.id, sha: SHA, subdir: '' }, 'm.c4'))
      expect(new Set(uris.map(u => u.toString())).size).toBe(1)
      expect(new Set(uris.map(u => externalProjectIdOfUri(u))).size).toBe(1)
    })

    it('gives distinct instances to different SHAs and subdirectories', ({ expect }) => {
      const repository = 'github.com/my-org/billing'
      const owners = [
        { repository, sha: SHA, subdir: '' },
        { repository, sha: SHA, subdir: 'docs' },
        { repository, sha: 'fedcba9876543210fedcba9876543210fedcba98', subdir: '' },
      ].map(instance => externalProjectIdOfUri(gitDependencyUri(instance, 'docs/model.c4')))
      expect(new Set(owners).size).toBe(3)
    })

    it('normalizes subdirectories', ({ expect }) => {
      expect(normalizeGitSubdir(undefined)).toBe('')
      expect(normalizeGitSubdir('.')).toBe('')
      expect(normalizeGitSubdir('/')).toBe('')
      expect(normalizeGitSubdir('./docs//arch/')).toBe('docs/arch')
      expect(normalizeGitSubdir('docs\\arch')).toBe('docs/arch')
      expect(() => normalizeGitSubdir('docs/../..')).toThrow()
      const uri = gitDependencyUri({ repository: 'github.com/a/b', sha: SHA, subdir: './docs/' }, 'm.c4')
      expect(parseGitDependencyUri(uri)?.instance.subdir).toBe('docs')
    })

    it('rejects invalid instances and URIs', ({ expect }) => {
      expect(isGitSha(SHA)).toBe(true)
      expect(isGitSha('main')).toBe(false)
      expect(isGitSha(SHA.toUpperCase())).toBe(false)
      expect(() => gitDependencyUri({ repository: 'github.com/a/b', sha: 'main', subdir: '' }, 'm.c4')).toThrow()
      expect(() => gitDependencyUri({ repository: 'github.com', sha: SHA, subdir: '' }, 'm.c4')).toThrow()
      expect(() => gitDependencyUri({ repository: 'github.com/a/b', sha: SHA, subdir: '' }, '')).toThrow()
      // local dependencies and URIs without SHA are not git dependencies
      expect(parseGitDependencyUri('likec4-dep://local/work/shared@0123abcd/-/model.c4')).toBeUndefined()
      expect(parseGitDependencyUri('likec4-dep://github.com/my-org/billing/-/model.c4')).toBeUndefined()
      expect(parseGitDependencyUri('file:///work/billing/model.c4')).toBeUndefined()
    })
  })
})
