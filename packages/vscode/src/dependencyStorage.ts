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
  'readFile' | 'writeFile' | 'createDirectory' | 'readDirectory' | 'rename' | 'delete' | 'stat'
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
 * Folder of temporary files inside the storage root (values are written there and renamed into place).
 * Never a key segment: keys start with `instances` or `versions`, and keys starting with it are rejected.
 */
export const DEPENDENCY_STORAGE_TEMP_FOLDER = '.tmp'

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
  if (segments[0] === DEPENDENCY_STORAGE_TEMP_FOLDER) {
    throw new Error(`Invalid dependency storage key: ${key}`)
  }
  return segments
}

// Codes of `vscode.FileSystemError` meaning "there is nothing at this path"
const NOT_FOUND_CODES = new Set(['FileNotFound', 'EntryNotFound', 'FileNotADirectory', 'EntryNotADirectory'])

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && typeof error.code === 'string' && NOT_FOUND_CODES.has(error.code)
}

function hasCode(error: unknown, ...codes: string[]): boolean {
  return error instanceof Error && 'code' in error && typeof error.code === 'string' && codes.includes(error.code)
}

/**
 * Temporary files older than this are removed on registration (left by an interrupted write)
 */
export const STALE_TEMP_FILE_AGE_MS = 60 * 60 * 1000

function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
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

  // A file that cannot be read (e.g. no permissions) is "not installed" as well, with a warning:
  // the server then offers to install it again, which overwrites the file
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

  // Lists keys of files in the folder recursively (sibling folders concurrently), `prefix` is the key of the folder
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
    const nested = await Promise.all(entries.map(async ([name, type]): Promise<string[]> => {
      const segments = [...prefix, name]
      switch (true) {
        case prefix.length === 0 && name === DEPENDENCY_STORAGE_TEMP_FOLDER:
          return []
        case (type & vscode.FileType.Directory) !== 0:
          return await list(vscode.Uri.joinPath(folder, name), segments)
        case (type & vscode.FileType.File) !== 0:
          return [segments.join(KEY_SEPARATOR)]
        default:
          return []
      }
    }))
    return nested.flat()
  }

  return {
    async getItem({ key }) {
      return { value: await read(key) }
    },

    async getItems({ keys }) {
      const items = await Promise.all(keys.map(async key => ({ key, value: await read(key) })))
      return { items }
    },

    // Writes a temporary file outside of the key tree and renames it into place: no partial reads
    // (a reader sees either the previous value, no value, or the new value).
    // Not atomic: `rename` with overwrite of VS Code deletes the target first.
    async setItem({ key, value }) {
      const segments = itemSegments(key)
      const target = vscode.Uri.joinPath(root, ...segments)
      const tempFolder = vscode.Uri.joinPath(root, DEPENDENCY_STORAGE_TEMP_FOLDER)
      const temp = vscode.Uri.joinPath(tempFolder, randomName())
      try {
        const stat = await fs.stat(target)
        if ((stat.type & vscode.FileType.Directory) !== 0) {
          throw new Error(`Dependency storage key ${key} is a folder, refusing to overwrite it`)
        }
      } catch (error) {
        if (!isFileNotFound(error)) {
          throw error
        }
      }
      await fs.createDirectory(tempFolder)
      await fs.createDirectory(vscode.Uri.joinPath(root, ...segments.slice(0, -1)))
      try {
        await fs.writeFile(temp, encoder.encode(value))
        try {
          await fs.rename(temp, target, { overwrite: true })
        } catch (error) {
          // A concurrent write of the same key may race between delete and rename of the target: retry once
          if (!hasCode(error, 'FileNotFound', 'EntryNotFound', 'FileExists', 'EntryExists')) {
            throw error
          }
          await fs.rename(temp, target, { overwrite: true })
        }
      } catch (error) {
        try {
          await fs.delete(temp, { useTrash: false })
        } catch {
          // the temporary file may not exist
        }
        throw error
      }
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
/**
 * Removes temporary files older than {@link STALE_TEMP_FILE_AGE_MS} (best effort, never throws).
 */
export async function removeStaleTempFiles(
  root: vscode.Uri,
  fs: DependencyStorageFileSystem,
  now: number = Date.now(),
): Promise<void> {
  const tempFolder = vscode.Uri.joinPath(root, DEPENDENCY_STORAGE_TEMP_FOLDER)
  let entries: [string, vscode.FileType][]
  try {
    entries = await fs.readDirectory(tempFolder)
  } catch {
    return
  }
  await Promise.all(entries.map(async ([name]) => {
    try {
      const uri = vscode.Uri.joinPath(tempFolder, name)
      const stat = await fs.stat(uri)
      if (now - stat.mtime > STALE_TEMP_FILE_AGE_MS) {
        await fs.delete(uri, { recursive: true, useTrash: false })
      }
    } catch {
      // best effort
    }
  }))
}

export function registerDependencyStorage(
  client: BaseLanguageClient,
  globalStorageUri: vscode.Uri,
  fs: DependencyStorageFileSystem,
  logger?: Logger,
): vscode.Disposable {
  const root = vscode.Uri.joinPath(globalStorageUri, DEPENDENCY_STORAGE_FOLDER)
  const handlers = createDependencyStorageHandlers(root, fs, logger)
  removeStaleTempFiles(root, fs).catch(() => {
    // best effort, never fails activation
  })
  const disposables = [
    client.onRequest(DependencyStorageRequests.GetItem.req, params => handlers.getItem(params)),
    client.onRequest(DependencyStorageRequests.GetItems.req, params => handlers.getItems(params)),
    client.onRequest(DependencyStorageRequests.SetItem.req, params => handlers.setItem(params)),
    client.onRequest(DependencyStorageRequests.GetKeys.req, params => handlers.getKeys(params)),
  ]

  client.clientOptions.initializationOptions = withDependencyStorageOption(client.clientOptions.initializationOptions)

  return vscode.Disposable.from(...disposables)
}

/**
 * Adds `dependencyStorage: true` to `initializationOptions` of the client,
 * which may be a value or a function (`LanguageClientOptions.initializationOptions`)
 */
export function withDependencyStorageOption(current: unknown): unknown {
  const extend = (options: unknown): LikeC4InitializationOptions & Record<string, unknown> => ({
    ...(typeof options === 'object' && options !== null ? options : {}),
    dependencyStorage: true,
  })
  if (typeof current === 'function') {
    return () => extend(current())
  }
  return extend(current)
}
