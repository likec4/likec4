import { createStorage } from 'unstorage'
import { describe, it, vi } from 'vitest'
import { DependencyStorageRequests } from '../protocol'
import { type LspStorageConnection, createLspStorageDriver } from './lspStorageDriver'
import { readDependencyCacheEntries, readDependencyCacheEntry, writeDependencyCacheEntry } from './storage'
import type { DependencyCacheEntry } from './types'
import { readDependencyVersion, writeDependencyVersion } from './version-index'

const SHA = '0123456789abcdef0123456789abcdef01234567'

/**
 * Fake connection: answers the dependency storage requests from a map, like the client does
 */
function fakeConnection() {
  const files = new Map<string, string>()
  const sendRequest = vi.fn<(type: { method: string }, params: any) => Promise<unknown>>(async (type, params) => {
    switch (type.method) {
      case DependencyStorageRequests.GetItem.req.method:
        return { value: files.get(params.key) ?? null }
      case DependencyStorageRequests.GetItems.req.method:
        // Omits missing keys (allowed by the protocol)
        return {
          items: (params.keys as string[]).flatMap(key => files.has(key) ? [{ key, value: files.get(key)! }] : []),
        }
      case DependencyStorageRequests.SetItem.req.method:
        files.set(params.key, params.value)
        return null
      case DependencyStorageRequests.GetKeys.req.method: {
        const base: string = params.base ?? ''
        return { keys: [...files.keys()].filter(key => key.startsWith(base)) }
      }
      default:
        throw new Error(`Unexpected request ${type.method}`)
    }
  })
  const connection = { sendRequest } as unknown as LspStorageConnection
  return { files, sendRequest, connection }
}

function entry(subdir: string): DependencyCacheEntry {
  return {
    format: 1,
    repository: 'github.com/my-org/billing',
    url: 'https://github.com/my-org/billing.git',
    sha: SHA,
    subdir,
    files: { 'model.c4': 'model {}' },
  }
}

describe('createLspStorageDriver', () => {
  it('reads and writes serialized values with requests', async ({ expect }) => {
    const { files, sendRequest, connection } = fakeConnection()
    const storage = createStorage({ driver: createLspStorageDriver(connection) })

    await storage.setItem('a:b:c', { x: 1 })
    expect(files.get('a:b:c')).toBe('{"x":1}')
    expect(sendRequest).toHaveBeenLastCalledWith(DependencyStorageRequests.SetItem.req, {
      key: 'a:b:c',
      value: '{"x":1}',
    })

    await expect(storage.getItem('a:b:c')).resolves.toEqual({ x: 1 })
    expect(sendRequest).toHaveBeenLastCalledWith(DependencyStorageRequests.GetItem.req, { key: 'a:b:c' })
  })

  it('returns null for a missing key and answers hasItem with get-item', async ({ expect }) => {
    const { sendRequest, connection } = fakeConnection()
    const storage = createStorage({ driver: createLspStorageDriver(connection) })

    await expect(storage.getItem('missing:key')).resolves.toBeNull()
    await expect(storage.hasItem('missing:key')).resolves.toBe(false)
    expect(sendRequest).toHaveBeenLastCalledWith(DependencyStorageRequests.GetItem.req, { key: 'missing:key' })

    await storage.setItem('present:key', 'value')
    await expect(storage.hasItem('present:key')).resolves.toBe(true)
  })

  it('reads several keys with one batch request', async ({ expect }) => {
    const { sendRequest, connection } = fakeConnection()
    const storage = createStorage({ driver: createLspStorageDriver(connection) })
    await storage.setItem('k:one', { n: 1 })
    await storage.setItem('k:two', { n: 2 })
    sendRequest.mockClear()

    const items = await storage.getItems(['k:one', 'k:missing', 'k:two'])
    expect(items).toEqual([
      { key: 'k:one', value: { n: 1 } },
      { key: 'k:missing', value: null },
      { key: 'k:two', value: { n: 2 } },
    ])
    expect(sendRequest).toHaveBeenCalledOnce()
    expect(sendRequest).toHaveBeenCalledWith(DependencyStorageRequests.GetItems.req, {
      keys: ['k:one', 'k:missing', 'k:two'],
    })
  })

  it('lists keys, with and without a base', async ({ expect }) => {
    const { sendRequest, connection } = fakeConnection()
    const storage = createStorage({ driver: createLspStorageDriver(connection) })
    await storage.setItem('instances:a:1', '1')
    await storage.setItem('instances:b:2', '2')
    await storage.setItem('versions:a:main', '3')

    await expect(storage.getKeys()).resolves.toEqual(['instances:a:1', 'instances:b:2', 'versions:a:main'])
    expect(sendRequest).toHaveBeenLastCalledWith(DependencyStorageRequests.GetKeys.req, {})

    await expect(storage.getKeys('instances')).resolves.toEqual(['instances:a:1', 'instances:b:2'])
    expect(sendRequest).toHaveBeenLastCalledWith(DependencyStorageRequests.GetKeys.req, { base: 'instances:' })
  })

  it('does not support removal', async ({ expect }) => {
    const { connection } = fakeConnection()
    const storage = createStorage({ driver: createLspStorageDriver(connection) })
    await expect(storage.removeItem('a:b')).rejects.toThrow(/does not support removeItem/)
    await expect(storage.clear()).rejects.toThrow(/does not support clear/)
  })

  it('backs the records of installed instances and the version index', async ({ expect }) => {
    const { connection } = fakeConnection()
    const storage = createStorage({ driver: createLspStorageDriver(connection) })
    const root = entry('')
    const docs = entry('docs/arch')

    await writeDependencyCacheEntry(storage, root)
    await writeDependencyCacheEntry(storage, docs)
    await writeDependencyVersion(storage, {
      format: 1,
      url: 'https://github.com/my-org/billing.git',
      repository: 'github.com/my-org/billing',
      ref: 'main',
      sha: SHA,
      resolvedAt: '2026-01-01T00:00:00.000Z',
    })

    await expect(readDependencyCacheEntry(storage, root)).resolves.toEqual(root)
    await expect(
      readDependencyCacheEntries(storage, [docs, { ...root, sha: 'f'.repeat(40) }, root]),
    ).resolves.toEqual([docs, undefined, root])
    await expect(readDependencyVersion(storage, 'github.com/my-org/billing', 'main')).resolves.toMatchObject({
      sha: SHA,
    })
  })
})
