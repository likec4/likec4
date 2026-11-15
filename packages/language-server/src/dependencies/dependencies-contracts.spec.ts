import type { ProjectId } from '@likec4/core'
import { createStorage } from 'unstorage'
import { describe, it } from 'vitest'
import { createTestServices } from '../test'
import { clientDeclaresDependencyStorage } from './DependencyStorage'
import {
  type DependencyCacheEntry,
  type DependencyInstaller,
  type DependencyVersionRecord,
  dependencyCacheDir,
  dependencyCacheKey,
  dependencyVersionKey,
  likec4CacheDir,
  readDependencyCacheEntries,
  readDependencyCacheEntry,
  readDependencyVersion,
  writeDependencyCacheEntry,
  writeDependencyVersion,
} from './index'

const SHA = '0123456789abcdef0123456789abcdef01234567'
const SHA2 = 'fedcba9876543210fedcba9876543210fedcba98'

function entry(subdir: string, files: Record<string, string> = { 'model.c4': 'model {}' }): DependencyCacheEntry {
  return {
    format: 1,
    repository: 'github.com/my-org/billing',
    url: 'git@github.com:my-org/billing.git',
    sha: SHA,
    subdir,
    files,
  }
}

describe('dependencies contracts', () => {
  describe('cache keys', () => {
    it('builds keys of instances', ({ expect }) => {
      expect(dependencyCacheKey({ repository: 'github.com/my-org/billing', sha: SHA, subdir: '' }))
        .toBe(`instances:github.com:my-org:billing:${SHA}:@`)
      expect(dependencyCacheKey({ repository: 'github.com/my-org/billing', sha: SHA, subdir: './docs/arch/' }))
        .toBe(`instances:github.com:my-org:billing:${SHA}:@docs%2farch`)
      expect(dependencyCacheKey({ repository: 'example.com:2222/group/sub/repo', sha: SHA, subdir: 'a:b?c' }))
        .toBe(`instances:example.com%3a2222:group:sub:repo:${SHA}:@a%3ab%3fc`)
    })

    it('gives distinct keys to distinct instances', ({ expect }) => {
      const keys = [
        { repository: 'github.com/a/b', sha: SHA, subdir: '' },
        { repository: 'github.com/a/b', sha: SHA, subdir: 'c' },
        { repository: 'github.com/a/b/c', sha: SHA, subdir: '' },
        { repository: 'github.com/a/b', sha: SHA2, subdir: '' },
        { repository: 'github.com:22/a/b', sha: SHA, subdir: '' },
      ].map(dependencyCacheKey)
      expect(new Set(keys).size).toBe(keys.length)
    })

    it('rejects invalid instances', ({ expect }) => {
      expect(() => dependencyCacheKey({ repository: 'github.com/a/b', sha: 'main', subdir: '' })).toThrow()
      expect(() => dependencyCacheKey({ repository: 'github.com', sha: SHA, subdir: '' })).toThrow()
      expect(() => dependencyCacheKey({ repository: 'github.com/a/b', sha: SHA, subdir: '../x' })).toThrow()
      expect(() => dependencyCacheKey({ repository: 'github.com/../b', sha: SHA, subdir: '' })).toThrow()
    })

    it('builds keys of the version index', ({ expect }) => {
      expect(dependencyVersionKey('github.com/my-org/billing', 'main')).toBe('versions:github.com:my-org:billing:main')
      expect(dependencyVersionKey('github.com/my-org/billing', 'release/1.0'))
        .toBe('versions:github.com:my-org:billing:release%2f1.0')
      expect(() => dependencyVersionKey('github.com/my-org/billing', '')).toThrow()
    })

    it('gives keys without upper case letters (case-insensitive file systems)', ({ expect }) => {
      const versionKeys = ['main', 'Main', 'MAIN', '^main', '%5Emain'].map(ref =>
        dependencyVersionKey('github.com/My-Org/billing', ref)
      )
      expect(versionKeys[1]).toBe('versions:github.com:^my-^org:billing:^main')
      expect(new Set(versionKeys.map(k => k.toLowerCase())).size).toBe(versionKeys.length)
      for (const key of versionKeys) {
        expect(key).toBe(key.toLowerCase())
      }
      const instanceKeys = ['Docs', 'docs', 'a/B'].map(subdir =>
        dependencyCacheKey({ repository: 'github.com/My-Org/Billing', sha: SHA, subdir })
      )
      expect(instanceKeys[0]).toBe(`instances:github.com:^my-^org:^billing:${SHA}:@^docs`)
      expect(new Set(instanceKeys.map(k => k.toLowerCase())).size).toBe(instanceKeys.length)
    })

    it('gives keys safe as file names on Windows', ({ expect }) => {
      const windowsUnsafe = (segment: string) =>
        /[<>:"/\\|?*]/.test(segment)
        || [...segment].some(char => char.charCodeAt(0) < 0x20)
        || /[. ]$/.test(segment)
        || segment.startsWith(' ')
        || /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(segment)
      // fs-lite rejects keys with segments ending in ".."
      const fsLiteRejects = (key: string) => /\.\.:|\.\.$/.test(key)
      const repositories = [
        'host.com/a*b/c',
        'host.com/con/nul.c4',
        'host.com/x../y.',
        'host.com/ a /b',
        'host.com/com1/LPT9',
      ]
      const refs = ['main', 'a*b', 'v1.', 'x..', ' ref ', 'con', 'NUL', 'aux.txt', 'feature/<x>|"y"?']
      const keys = [
        ...repositories.map(repository => dependencyCacheKey({ repository, sha: SHA, subdir: 'docs..' })),
        ...repositories.flatMap(repository => refs.map(ref => dependencyVersionKey(repository, ref))),
      ]
      for (const key of keys) {
        expect(fsLiteRejects(key), key).toBe(false)
        for (const segment of key.split(':')) {
          expect(windowsUnsafe(segment), `${segment} of ${key}`).toBe(false)
        }
      }
      expect(new Set(keys).size).toBe(keys.length)
      expect(dependencyVersionKey('host.com/con/b', 'a*b.')).toBe('versions:host.com:%63on:b:a%2ab%2e')
      // escaped forms do not collide with literal input
      const lookalikes = ['con', '%63on', 'a.', 'a%2e', 'a*', 'a%2a'].map(ref =>
        dependencyVersionKey('host.com/a/b', ref)
      )
      expect(new Set(lookalikes).size).toBe(lookalikes.length)
    })

    it('requires full SHAs in keys and version records', async ({ expect }) => {
      expect(() => dependencyCacheKey({ repository: 'github.com/a/b', sha: SHA.slice(0, 7), subdir: '' })).toThrow()
      expect(dependencyCacheKey({ repository: 'github.com/a/b', sha: SHA + SHA.slice(0, 24), subdir: '' }))
        .toContain(SHA + SHA.slice(0, 24))
      await expect(writeDependencyVersion(createStorage(), {
        format: 1,
        repository: 'github.com/a/b',
        url: 'git@github.com:a/b.git',
        ref: 'main',
        sha: SHA.slice(0, 7),
        resolvedAt: '2026-11-15T00:00:00.000Z',
      })).rejects.toThrow()
    })
  })

  describe('storage', () => {
    it('writes and reads installed instances', async ({ expect }) => {
      const storage = createStorage()
      const root = entry('', { 'model.c4': 'model {}', 'likec4.config.json': '{"name":"billing"}', 'n.c4': '123' })
      const docs = entry('docs')
      await writeDependencyCacheEntry(storage, root)
      await writeDependencyCacheEntry(storage, docs)

      expect(await readDependencyCacheEntry(storage, root)).toEqual(root)
      expect(await readDependencyCacheEntry(storage, { ...root, sha: SHA2 })).toBeUndefined()
      expect(await readDependencyCacheEntries(storage, [docs, { ...root, sha: SHA2 }, root]))
        .toEqual([docs, undefined, root])
      expect(await storage.getKeys('instances')).toHaveLength(2)
    })

    it('ignores malformed records', async ({ expect }) => {
      const storage = createStorage()
      await storage.setItem(dependencyCacheKey(entry('')), { format: 2 })
      expect(await readDependencyCacheEntry(storage, entry(''))).toBeUndefined()
    })

    it('writes and reads the version index', async ({ expect }) => {
      const storage = createStorage()
      const record: DependencyVersionRecord = {
        format: 1,
        repository: 'github.com/my-org/billing',
        url: 'https://github.com/my-org/billing.git',
        ref: 'release/1.0',
        sha: SHA,
        resolvedAt: '2026-11-15T00:00:00.000Z',
      }
      expect(await readDependencyVersion(storage, record.repository, record.ref)).toBeUndefined()
      await writeDependencyVersion(storage, record)
      expect(await readDependencyVersion(storage, record.repository, record.ref)).toEqual(record)
      expect(await readDependencyVersion(storage, record.repository, 'main')).toBeUndefined()
      // update moves the ref
      await writeDependencyVersion(storage, { ...record, sha: SHA2 })
      expect((await readDependencyVersion(storage, record.repository, record.ref))?.sha).toBe(SHA2)
    })
  })

  describe('services', () => {
    it('registers defaults: in-memory storage, unsupported installer, no states', async ({ expect }) => {
      const { services, initialize } = createTestServices()
      await initialize()
      const dependencies = services.shared.dependencies
      expect(dependencies.Installer.supported).toBe(false)
      expect(await dependencies.Installer.install({ git: 'git@github.com:a/b.git', ref: 'main' }))
        .toEqual({ status: 'unsupported' })
      expect(dependencies.States.get('a' as ProjectId, 'billing')).toBeUndefined()
      expect(dependencies.States.all()).toEqual([])

      await dependencies.Storage.writeEntry(entry(''))
      expect(await dependencies.Storage.hasEntry(entry(''))).toBe(true)
      expect(await dependencies.Storage.readEntries([entry('')])).toEqual([entry('')])

      // the backing storage can be replaced (e.g. with the client storage)
      const replaced = createStorage()
      dependencies.Storage.use(replaced)
      expect(dependencies.Storage.storage).toBe(replaced)
      expect(await dependencies.Storage.hasEntry(entry(''))).toBe(false)
    })

    it('uses the storage and installer of the context', async ({ expect }) => {
      const storage = createStorage()
      const installer: DependencyInstaller = {
        supported: true,
        install: () => Promise.resolve({ status: 'failed', error: 'test' }),
      }
      const { services, initialize } = createTestServices({
        context: {
          dependencyStorage: () => storage,
          dependencyInstaller: () => installer,
        },
      })
      await initialize()
      expect(services.shared.dependencies.Storage.storage).toBe(storage)
      expect(services.shared.dependencies.Installer).toBe(installer)
    })

    it('reads the client storage flag of initializationOptions', ({ expect }) => {
      expect(clientDeclaresDependencyStorage({ dependencyStorage: true })).toBe(true)
      expect(clientDeclaresDependencyStorage({ dependencyStorage: 'true' })).toBe(false)
      expect(clientDeclaresDependencyStorage({})).toBe(false)
      expect(clientDeclaresDependencyStorage(undefined)).toBe(false)
    })
  })

  describe('cache directory', () => {
    it.for(
      [
        ['linux', {}, '/home/u/.cache/likec4/dependencies'],
        ['linux', { XDG_CACHE_HOME: '/xdg/' }, '/xdg/likec4/dependencies'],
        ['darwin', {}, '/home/u/Library/Caches/likec4/dependencies'],
        ['linux', { LIKEC4_CACHE_DIR: '/custom/' }, '/custom/dependencies'],
        ['darwin', { LIKEC4_CACHE_DIR: ' /custom ' }, '/custom/dependencies'],
      ] as const,
    )('%s %o -> %s', ([platform, env, expected], { expect }) => {
      expect(dependencyCacheDir({ platform, env, homedir: '/home/u' })).toBe(expected)
    })

    it('uses LOCALAPPDATA on Windows', ({ expect }) => {
      expect(
        dependencyCacheDir({ platform: 'win32', env: { LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' }, homedir: '' }),
      )
        .toBe('C:\\Users\\u\\AppData\\Local\\likec4\\cache\\dependencies')
      expect(likec4CacheDir({ platform: 'win32', env: {}, homedir: 'C:\\Users\\u' }))
        .toBe('C:\\Users\\u\\AppData\\Local\\likec4\\cache')
    })

    it('ignores relative XDG_CACHE_HOME and LOCALAPPDATA', ({ expect }) => {
      expect(dependencyCacheDir({ platform: 'linux', env: { XDG_CACHE_HOME: 'rel' }, homedir: '/home/u' }))
        .toBe('/home/u/.cache/likec4/dependencies')
      expect(likec4CacheDir({ platform: 'win32', env: { LOCALAPPDATA: 'rel' }, homedir: 'C:\\Users\\u' }))
        .toBe('C:\\Users\\u\\AppData\\Local\\likec4\\cache')
    })

    it('resolves relative LIKEC4_CACHE_DIR against cwd, rejects it without cwd', ({ expect }) => {
      expect(dependencyCacheDir({ platform: 'linux', env: { LIKEC4_CACHE_DIR: 'cache' }, homedir: '/h', cwd: '/work' }))
        .toBe('/work/cache/dependencies')
      expect(() => dependencyCacheDir({ platform: 'linux', env: { LIKEC4_CACHE_DIR: 'cache' }, homedir: '/h' }))
        .toThrow(/LIKEC4_CACHE_DIR must be an absolute path/)
      expect(dependencyCacheDir({ platform: 'win32', env: { LIKEC4_CACHE_DIR: 'D:\\c' }, homedir: '' }))
        .toBe('D:\\c\\dependencies')
    })

    it('throws without home directory and override', ({ expect }) => {
      expect(() => dependencyCacheDir({ platform: 'linux', env: {}, homedir: '' })).toThrow(/LIKEC4_CACHE_DIR/)
      expect(() => dependencyCacheDir({ platform: 'darwin', env: {}, homedir: ' ' })).toThrow(/LIKEC4_CACHE_DIR/)
      expect(dependencyCacheDir({ platform: 'linux', env: { LIKEC4_CACHE_DIR: '/c' }, homedir: '' }))
        .toBe('/c/dependencies')
      expect(dependencyCacheDir({ platform: 'linux', env: { XDG_CACHE_HOME: '/x' }, homedir: '' }))
        .toBe('/x/likec4/dependencies')
    })
  })
})
