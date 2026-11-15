import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Driver } from 'unstorage'
import { createStorage } from 'unstorage'
import { afterEach, describe, it } from 'vitest'
import { createTestServices } from '../test'
import { lazyDriver } from './lazy-driver'
import { WithNodeDependencies } from './node'
import type { DependencyCacheEntry } from './types'

const SHA = '0123456789abcdef0123456789abcdef01234567'

const entry: DependencyCacheEntry = {
  format: 1,
  repository: 'github.com/My-Org/billing',
  url: 'git@github.com:My-Org/billing.git',
  sha: SHA,
  subdir: 'docs',
  files: { 'model.c4': 'model {}', 'likec4.config.json': '{"name":"billing"}' },
}

describe('node dependencies', () => {
  const dirs = [] as string[]
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('creates the backing driver lazily', async ({ expect }) => {
    let created = 0
    const storage = createStorage({
      driver: lazyDriver('memory', () => {
        created++
        const map = new Map<string, string>()
        const driver: Driver = {
          hasItem: key => map.has(key),
          getItem: key => map.get(key) ?? null,
          setItem: (key, value) => void map.set(key, value),
          getKeys: () => [...map.keys()],
        }
        return driver
      }),
    })
    expect(created).toBe(0)
    await storage.dispose()
    expect(created).toBe(0)
    await storage.setItem('a', { b: 1 })
    expect(await storage.getItem('a')).toEqual({ b: 1 })
    expect(created).toBe(1)
  })

  it('stores instances in the cache directory, created on first write', async ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), 'likec4-deps-'))
    dirs.push(root)
    const cacheDir = join(root, 'cache')
    const { services, initialize } = createTestServices({ context: WithNodeDependencies({ cacheDir }) })
    await initialize()
    const storage = services.shared.dependencies.Storage

    expect(services.shared.dependencies.Installer.supported).toBe(false)
    expect(await storage.hasEntry(entry)).toBe(false)
    expect(existsSync(cacheDir)).toBe(false)

    await storage.writeEntry(entry)
    expect(existsSync(cacheDir)).toBe(true)
    expect(await storage.readEntry(entry)).toEqual(entry)
    expect(await storage.readEntries([entry, { ...entry, subdir: '' }])).toEqual([entry, undefined])
  })
})
