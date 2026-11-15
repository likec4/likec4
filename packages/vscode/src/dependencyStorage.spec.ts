import { DependencyStorageRequests } from '@likec4/language-server/protocol'
import { describe, expect, it, vi } from 'vitest'
import * as vscode from 'vscode'
import type { BaseLanguageClient } from 'vscode-languageclient'
import {
  createDependencyStorageHandlers,
  DEPENDENCY_STORAGE_TEMP_FOLDER,
  registerDependencyStorage,
  withDependencyStorageOption,
} from './dependencyStorage'

vi.mock('vscode', () => {
  // Like the real `Uri`: `path` is kept as is (no percent re-encoding), `joinPath` joins posix paths
  type FakeUri = { scheme: string; path: string; readonly fsPath: string; toString(): string }
  const make = (scheme: string, path: string): FakeUri => ({
    scheme,
    path,
    get fsPath(): string {
      throw new Error('fsPath must not be used')
    },
    toString: () => `${scheme}:${path}`,
  })
  const parse = (value: string) => {
    const i = value.indexOf(':')
    return make(value.slice(0, i), value.slice(i + 1))
  }
  const joinPath = (base: FakeUri, ...segments: string[]) => {
    const parts: string[] = []
    for (const part of [base.path, ...segments].join('/').split('/')) {
      switch (true) {
        case part === '' || part === '.':
          break
        case part === '..':
          parts.pop()
          break
        default:
          parts.push(part)
      }
    }
    return make(base.scheme, `/${parts.join('/')}`)
  }

  class Disposable {
    constructor(private readonly fn: () => void) {}
    static from(...items: { dispose(): void }[]) {
      return new Disposable(() => items.forEach(i => i.dispose()))
    }
    dispose() {
      this.fn()
    }
  }

  return {
    Uri: { parse, joinPath },
    FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 },
    Disposable,
  }
})

// Not a `file:` URI: paths are built with `Uri.joinPath`, never with `fsPath`
const globalStorageUri = vscode.Uri.parse('vscode-userdata:/user/globalStorage/likec4.likec4-vscode')
const root = vscode.Uri.joinPath(globalStorageUri, 'dependencies')

function fsError(code: string): Error {
  return Object.assign(new Error(code), { code })
}

/**
 * In-memory fake of `vscode.workspace.fs` keyed by URI strings
 */
function fakeFileSystem() {
  const files = new Map<string, Uint8Array>()
  const dirs = new Set<string>()
  const fs = {
    readFile: vi.fn<(uri: vscode.Uri) => Promise<Uint8Array>>(async uri => {
      const content = files.get(uri.toString())
      if (!content) {
        throw fsError('FileNotFound')
      }
      return content
    }),
    writeFile: vi.fn<(uri: vscode.Uri, content: Uint8Array) => Promise<void>>(async (uri, content) => {
      files.set(uri.toString(), content)
    }),
    rename: vi.fn<(source: vscode.Uri, target: vscode.Uri, options?: { overwrite?: boolean }) => Promise<void>>(
      async (source, target, options) => {
        const content = files.get(source.toString())
        if (!content) {
          throw fsError('FileNotFound')
        }
        if (files.has(target.toString()) && !options?.overwrite) {
          throw fsError('FileExists')
        }
        files.delete(source.toString())
        files.set(target.toString(), content)
      },
    ),
    delete: vi.fn<(uri: vscode.Uri, options?: { recursive?: boolean; useTrash?: boolean }) => Promise<void>>(
      async uri => {
        if (!files.delete(uri.toString())) {
          throw fsError('FileNotFound')
        }
      },
    ),
    createDirectory: vi.fn<(uri: vscode.Uri) => Promise<void>>(async uri => {
      dirs.add(uri.toString())
    }),
    readDirectory: vi.fn<(uri: vscode.Uri) => Promise<[string, vscode.FileType][]>>(async uri => {
      if (files.has(uri.toString())) {
        throw fsError('FileNotADirectory')
      }
      const prefix = `${uri.toString().replace(/\/$/, '')}/`
      const entries = new Map<string, vscode.FileType>()
      for (const path of files.keys()) {
        if (path.startsWith(prefix)) {
          const [name, ...rest] = path.slice(prefix.length).split('/')
          entries.set(name!, rest.length > 0 ? vscode.FileType.Directory : vscode.FileType.File)
        }
      }
      if (entries.size === 0 && !dirs.has(uri.toString())) {
        throw fsError('FileNotFound')
      }
      return [...entries]
    }),
  }
  return { files, dirs, fs }
}

const encode = (value: string) => new TextEncoder().encode(value)
const uri = (...segments: string[]) => vscode.Uri.joinPath(root, ...segments).toString()

describe('dependency storage of the extension', () => {
  it('writes a value as UTF-8 content of a file in global storage, through a temporary file', async () => {
    const { files, fs } = fakeFileSystem()
    const handlers = createDependencyStorageHandlers(root, fs)

    await handlers.setItem({ key: 'versions:github.com:my-org:billing:@:main', value: '{"sha":"é"}' })

    const file = uri('versions', 'github.com', 'my-org', 'billing', '@', 'main')
    expect(file).toBe(
      'vscode-userdata:/user/globalStorage/likec4.likec4-vscode/dependencies/versions/github.com/my-org/billing/@/main',
    )
    expect(new TextDecoder().decode(files.get(file))).toBe('{"sha":"é"}')
    expect([...files.keys()]).toEqual([file])

    // Written to a temporary file outside of the key tree, then renamed with overwrite
    const temp = fs.writeFile.mock.calls[0]?.[0].toString()
    expect(temp?.startsWith(`${uri(DEPENDENCY_STORAGE_TEMP_FOLDER)}/`)).toBe(true)
    expect(fs.rename).toHaveBeenCalledOnce()
    expect(fs.rename.mock.calls[0]?.[0].toString()).toBe(temp)
    expect(fs.rename.mock.calls[0]?.[1].toString()).toBe(file)
    expect(fs.rename.mock.calls[0]?.[2]).toEqual({ overwrite: true })
    expect(fs.createDirectory.mock.calls.map(c => c[0].toString())).toContain(
      uri('versions', 'github.com', 'my-org', 'billing', '@'),
    )
  })

  it('replaces an existing value', async () => {
    const { files, fs } = fakeFileSystem()
    const handlers = createDependencyStorageHandlers(root, fs)
    await handlers.setItem({ key: 'a:b', value: '1' })
    await handlers.setItem({ key: 'a:b', value: '2' })
    await expect(handlers.getItem({ key: 'a:b' })).resolves.toEqual({ value: '2' })
    expect(files.size).toBe(1)
  })

  it('removes the temporary file if the rename fails', async () => {
    const { files, fs } = fakeFileSystem()
    fs.rename.mockRejectedValueOnce(fsError('NoPermissions'))
    const handlers = createDependencyStorageHandlers(root, fs)

    await expect(handlers.setItem({ key: 'a:b', value: '1' })).rejects.toThrow('NoPermissions')
    expect(fs.delete).toHaveBeenCalledOnce()
    expect(fs.delete.mock.calls[0]?.[0].toString()).toBe(fs.writeFile.mock.calls[0]?.[0].toString())
    expect(files.size).toBe(0)
  })

  it('reads a value', async () => {
    const { files, fs } = fakeFileSystem()
    files.set(uri('instances', 'github.com', 'a', 'b', 'sha', '@'), encode('{"format":1}'))
    const handlers = createDependencyStorageHandlers(root, fs)

    await expect(handlers.getItem({ key: 'instances:github.com:a:b:sha:@' })).resolves.toEqual({
      value: '{"format":1}',
    })
    expect(fs.readFile.mock.calls[0]?.[0].toString()).toBe(uri('instances', 'github.com', 'a', 'b', 'sha', '@'))
  })

  it('returns null for a missing key', async () => {
    const { fs } = fakeFileSystem()
    const warn = vi.fn<(message: string) => void>()
    const handlers = createDependencyStorageHandlers(root, fs, { warn })

    await expect(handlers.getItem({ key: 'instances:missing' })).resolves.toEqual({ value: null })
    expect(warn).not.toHaveBeenCalled()
  })

  it('returns null and warns if a file cannot be read', async () => {
    const { fs } = fakeFileSystem()
    fs.readFile.mockRejectedValueOnce(fsError('NoPermissions'))
    const warn = vi.fn<(message: string) => void>()
    const handlers = createDependencyStorageHandlers(root, fs, { warn })

    await expect(handlers.getItem({ key: 'instances:locked' })).resolves.toEqual({ value: null })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('reads several keys in one batch, missing keys have null value', async () => {
    const { files, fs } = fakeFileSystem()
    files.set(uri('k', 'one'), encode('1'))
    files.set(uri('k', 'two'), encode('2'))
    const handlers = createDependencyStorageHandlers(root, fs)

    await expect(handlers.getItems({ keys: ['k:one', 'k:missing', 'k:two'] })).resolves.toEqual({
      items: [
        { key: 'k:one', value: '1' },
        { key: 'k:missing', value: null },
        { key: 'k:two', value: '2' },
      ],
    })
  })

  it('lists keys recursively in the unstorage form, without temporary files', async () => {
    const { files, fs } = fakeFileSystem()
    const handlers = createDependencyStorageHandlers(root, fs)
    await handlers.setItem({ key: 'instances:github.com:a:b:sha:@', value: '1' })
    await handlers.setItem({ key: 'instances:github.com:a:b:sha:@docs%2farch', value: '2' })
    await handlers.setItem({ key: 'instances:gitlab.com:c:d:sha:@', value: '3' })
    await handlers.setItem({ key: 'versions:github.com:a:b:@:main', value: '4' })
    // A leftover temporary file
    files.set(uri(DEPENDENCY_STORAGE_TEMP_FOLDER, 'leftover'), encode('x'))

    const all = await handlers.getKeys({})
    expect(all.keys.sort()).toEqual([
      'instances:github.com:a:b:sha:@',
      'instances:github.com:a:b:sha:@docs%2farch',
      'instances:gitlab.com:c:d:sha:@',
      'versions:github.com:a:b:@:main',
    ])

    const github = await handlers.getKeys({ base: 'instances:github.com:' })
    expect(github.keys.sort()).toEqual([
      'instances:github.com:a:b:sha:@',
      'instances:github.com:a:b:sha:@docs%2farch',
    ])

    // A base that ends with a part of a segment
    const partial = await handlers.getKeys({ base: 'instances:git' })
    expect(partial.keys).toHaveLength(3)
  })

  it('round-trips keys with escaped segments', async () => {
    const { fs } = fakeFileSystem()
    const handlers = createDependencyStorageHandlers(root, fs)
    // Keys as produced by `dependencyVersionKey` / `dependencyCacheKey` of the language server
    const version = 'versions:github.com:^my-^org:billing:@:^main'
    const instance =
      'instances:github.com%3a8443:^my-^org:billing:0123456789abcdef0123456789abcdef01234567:@docs%2f^arch'

    await handlers.setItem({ key: version, value: 'v' })
    await handlers.setItem({ key: instance, value: 'i' })

    expect(fs.rename.mock.calls.map(c => c[1].toString())).toEqual([
      `${uri()}/versions/github.com/^my-^org/billing/@/^main`,
      `${uri()}/instances/github.com%3a8443/^my-^org/billing/0123456789abcdef0123456789abcdef01234567/@docs%2f^arch`,
    ])
    const { keys } = await handlers.getKeys({})
    expect(keys.sort()).toEqual([instance, version])
    await expect(handlers.getKeys({ base: 'versions:github.com:^my-^org:' })).resolves.toEqual({ keys: [version] })
    await expect(handlers.getItems({ keys: [version, instance] })).resolves.toEqual({
      items: [{ key: version, value: 'v' }, { key: instance, value: 'i' }],
    })
  })

  it('lists no keys if the storage folder does not exist or the base is a file', async () => {
    const { fs } = fakeFileSystem()
    const warn = vi.fn<(message: string) => void>()
    const handlers = createDependencyStorageHandlers(root, fs, { warn })

    await expect(handlers.getKeys({})).resolves.toEqual({ keys: [] })
    await expect(handlers.getKeys({ base: 'instances:' })).resolves.toEqual({ keys: [] })

    await handlers.setItem({ key: 'a:b', value: '1' })
    await expect(handlers.getKeys({ base: 'a:b:' })).resolves.toEqual({ keys: [] })
    expect(warn).not.toHaveBeenCalled()
  })

  it('rejects keys that escape the storage folder or use the temporary folder', async () => {
    const { fs } = fakeFileSystem()
    const handlers = createDependencyStorageHandlers(root, fs)

    await expect(handlers.getItem({ key: 'instances:..:secret' })).rejects.toThrow(/Invalid dependency storage key/)
    await expect(handlers.setItem({ key: 'a/b', value: '' })).rejects.toThrow(/Invalid dependency storage key/)
    await expect(handlers.setItem({ key: '', value: '' })).rejects.toThrow(/Invalid dependency storage key/)
    await expect(handlers.setItem({ key: `${DEPENDENCY_STORAGE_TEMP_FOLDER}:x`, value: '' })).rejects.toThrow(
      /Invalid dependency storage key/,
    )
    expect(fs.writeFile).not.toHaveBeenCalled()
  })

  it('adds the storage flag to initializationOptions given as a value or a function', () => {
    expect(withDependencyStorageOption(undefined)).toEqual({ dependencyStorage: true })
    expect(withDependencyStorageOption({ other: 1 })).toEqual({ other: 1, dependencyStorage: true })
    const options = withDependencyStorageOption(() => ({ other: 2 }))
    expect(typeof options).toBe('function')
    expect((options as () => unknown)()).toEqual({ other: 2, dependencyStorage: true })
  })

  it('registers the request handlers and declares the storage in initializationOptions', async () => {
    const { files, fs } = fakeFileSystem()
    const handlers = new Map<string, (params: unknown) => unknown>()
    const disposeHandler = vi.fn<() => void>()
    const client = {
      clientOptions: { initializationOptions: { other: 1 } as unknown },
      onRequest: vi.fn<(type: { method: string }, handler: (params: unknown) => unknown) => { dispose(): void }>(
        (type, handler) => {
          handlers.set(type.method, handler)
          return { dispose: disposeHandler }
        },
      ),
    }

    const disposable = registerDependencyStorage(client as unknown as BaseLanguageClient, globalStorageUri, fs)

    expect(client.clientOptions.initializationOptions).toEqual({ other: 1, dependencyStorage: true })
    expect([...handlers.keys()].sort()).toEqual([
      DependencyStorageRequests.GetItem.req.method,
      DependencyStorageRequests.GetItems.req.method,
      DependencyStorageRequests.GetKeys.req.method,
      DependencyStorageRequests.SetItem.req.method,
    ].sort())

    await handlers.get(DependencyStorageRequests.SetItem.req.method)!({ key: 'a:b', value: 'v' })
    expect(files.has(uri('a', 'b'))).toBe(true)
    await expect(handlers.get(DependencyStorageRequests.GetItem.req.method)!({ key: 'a:b' })).resolves.toEqual({
      value: 'v',
    })

    disposable.dispose()
    expect(disposeHandler).toHaveBeenCalledTimes(4)
  })
})
