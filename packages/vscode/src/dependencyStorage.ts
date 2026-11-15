import { type LikeC4InitializationOptions, DependencyStorageRequests } from '@likec4/language-server/protocol'
import * as vscode from 'vscode'
import type { BaseLanguageClient } from 'vscode-languageclient'

/**
 * Folder of the dependency storage inside `globalStorageUri`
 */
export const DEPENDENCY_STORAGE_FOLDER = 'dependencies'

/**
 * Subset of `vscode.workspace.fs` used by the dependency storage
 */
export type DependencyStorageFileSystem = Pick<
  vscode.FileSystem,
  'readFile' | 'writeFile' | 'createDirectory' | 'readDirectory'
>

type Logger = {
  warn(message: string, meta?: Record<string, unknown>): void
}

/**
 * Handlers of the `likec4/dependency-storage/*` requests (see `DependencyStorageRequests`)
 */
export interface DependencyStorageHandlers {
  getItem(params: DependencyStorageRequests.GetItem.Params): Promise<DependencyStorageRequests.GetItem.Res>
  getItems(params: DependencyStorageRequests.GetItems.Params): Promise<DependencyStorageRequests.GetItems.Res>
  setItem(params: DependencyStorageRequests.SetItem.Params): Promise<void>
  getKeys(params: DependencyStorageRequests.GetKeys.Params): Promise<DependencyStorageRequests.GetKeys.Res>
}

const KEY_SEPARATOR = ':'

/**
 * Splits an unstorage key into path segments (`a:b:c` -> `['a', 'b', 'c']`).
 * Segments are already file-safe (see `encodeKeySegment` of the language server),
 * here only path traversal is rejected.
 */
function keySegments(key: string): string[] {
  const segments = key.split(KEY_SEPARATOR).filter(s => s.length > 0)
  for (const segment of segments) {
    if (segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\')) {
      throw new Error(`Invalid dependency storage key: ${key}`)
    }
  }
  return segments
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error
    && (error.code === 'FileNotFound' || error.code === 'EntryNotFound')
}

/**
 * Creates handlers of the dependency storage requests:
 * each key is a file in `root` (`a:b:c` is `root/a/b/c`), the value is its UTF-8 content as is.
 *
 * Paths are built with `vscode.Uri.joinPath` and accessed only with `fs` (`vscode.workspace.fs`):
 * the scheme of `globalStorageUri` is not always `file:`.
 */
export function createDependencyStorageHandlers(
  root: vscode.Uri,
  fs: DependencyStorageFileSystem,
  logger?: Logger,
): DependencyStorageHandlers {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const itemSegments = (key: string): string[] => {
    const segments = keySegments(key)
    if (segments.length === 0) {
      throw new Error(`Invalid dependency storage key: "${key}"`)
    }
    return segments
  }
  const uriOf = (key: string): vscode.Uri => vscode.Uri.joinPath(root, ...itemSegments(key))

  const read = async (key: string): Promise<string | null> => {
    const uri = uriOf(key)
    try {
      return decoder.decode(await fs.readFile(uri))
    } catch (error) {
      if (!isFileNotFound(error)) {
        logger?.warn(`Failed to read dependency storage key ${key}`, { error })
      }
      return null
    }
  }

  // Lists keys of files in the folder recursively, `prefix` is the key of the folder
  const list = async (folder: vscode.Uri, prefix: string[]): Promise<string[]> => {
    let entries: [string, vscode.FileType][]
    try {
      entries = await fs.readDirectory(folder)
    } catch (error) {
      if (!isFileNotFound(error)) {
        logger?.warn(`Failed to list dependency storage folder ${folder.toString()}`, { error })
      }
      return []
    }
    const keys: string[] = []
    for (const [name, type] of entries) {
      const segments = [...prefix, name]
      switch (true) {
        case (type & vscode.FileType.Directory) !== 0:
          keys.push(...await list(vscode.Uri.joinPath(folder, name), segments))
          break
        case (type & vscode.FileType.File) !== 0:
          keys.push(segments.join(KEY_SEPARATOR))
          break
      }
    }
    return keys
  }

  return {
    async getItem({ key }) {
      return { value: await read(key) }
    },

    async getItems({ keys }) {
      const items = await Promise.all(keys.map(async key => ({ key, value: await read(key) })))
      return { items }
    },

    async setItem({ key, value }) {
      const segments = itemSegments(key)
      await fs.createDirectory(vscode.Uri.joinPath(root, ...segments.slice(0, -1)))
      await fs.writeFile(vscode.Uri.joinPath(root, ...segments), encoder.encode(value))
    },

    async getKeys({ base }) {
      const prefix = base ?? ''
      const segments = keySegments(prefix)
      // A base that does not end with the separator may end with a part of a segment: list its folder
      const folderSegments = prefix.length === 0 || prefix.endsWith(KEY_SEPARATOR) ? segments : segments.slice(0, -1)
      const keys = await list(vscode.Uri.joinPath(root, ...folderSegments), folderSegments)
      return { keys: keys.filter(key => key.startsWith(prefix)) }
    },
  }
}

/**
 * Serves the dependency storage of the language server from `globalStorageUri/dependencies`
 * and declares it in `initializationOptions` (`dependencyStorage: true`), only together with the handlers.
 *
 * Must be called before the client starts.
 */
export function registerDependencyStorage(
  client: BaseLanguageClient,
  globalStorageUri: vscode.Uri,
  fs: DependencyStorageFileSystem,
  logger?: Logger,
): vscode.Disposable {
  const handlers = createDependencyStorageHandlers(
    vscode.Uri.joinPath(globalStorageUri, DEPENDENCY_STORAGE_FOLDER),
    fs,
    logger,
  )
  const disposables = [
    client.onRequest(DependencyStorageRequests.GetItem.req, params => handlers.getItem(params)),
    client.onRequest(DependencyStorageRequests.GetItems.req, params => handlers.getItems(params)),
    client.onRequest(DependencyStorageRequests.SetItem.req, params => handlers.setItem(params)),
    client.onRequest(DependencyStorageRequests.GetKeys.req, params => handlers.getKeys(params)),
  ]

  const current = client.clientOptions.initializationOptions
  const initializationOptions: LikeC4InitializationOptions & Record<string, unknown> = {
    ...(typeof current === 'object' && current !== null ? current : {}),
    dependencyStorage: true,
  }
  client.clientOptions.initializationOptions = initializationOptions

  return vscode.Disposable.from(...disposables)
}
