import type { LikeC4ProjectConfig } from '@likec4/config'
import type { LayoutedView } from '@likec4/core'
import type { Disposable, FileSystemNode, URI } from 'langium'
import { LibIcons } from '../generated/icons'
import { isLikeC4Builtin } from '../likec4lib'
import { logger } from '../logger'
import type {
  FileNode,
  FileSystemModuleContext,
  FileSystemProvider,
  FileSystemWatcher,
  FileSystemWatcherModuleContext,
  LikeC4ManualLayouts,
  LikeC4ManualLayoutsModuleContext,
} from './types'

export class NoopFileSystemProvider implements FileSystemProvider {
  scanProjectFiles(): Promise<FileNode[]> {
    return Promise.resolve([])
  }
  scanDirectory(): Promise<FileNode[]> {
    return Promise.resolve([])
  }

  stat(): Promise<FileSystemNode> {
    throw new Error('No file system is available.')
  }

  statSync(): FileSystemNode {
    throw new Error('No file system is available.')
  }

  exists(): Promise<boolean> {
    return Promise.resolve(false)
  }

  existsSync(): boolean {
    return false
  }

  readBinary(uri: URI): Promise<Uint8Array> {
    throw new Error(`No file system is available (${uri.toString()})`)
  }

  readBinarySync(uri: URI): Uint8Array {
    throw new Error(`No file system is available (${uri.toString()})`)
  }

  readFileSync(uri: URI): string {
    if (isLikeC4Builtin(uri)) {
      return LibIcons
    }
    throw new Error(`No file system is available (${uri.toString()})`)
  }

  readDirectorySync(): FileSystemNode[] {
    return []
  }

  readFile(uri: URI): Promise<string> {
    if (isLikeC4Builtin(uri)) {
      return Promise.resolve(LibIcons)
    }
    throw new Error(`No file system is available (${uri.toString()})`)
  }

  realpath(): Promise<string | undefined> {
    return Promise.resolve(undefined)
  }

  readDirectory(): Promise<FileNode[]> {
    return Promise.resolve([])
  }

  loadProjectConfig(): Promise<LikeC4ProjectConfig> {
    throw new Error('No file system is available.')
  }

  writeFile(): Promise<void> {
    throw new Error('No file system is available.')
  }

  deleteFile(): Promise<boolean> {
    throw new Error('No file system is available.')
  }
}

/**
 * A no-op file system watcher.
 */
export class NoopFileSystemWatcher implements FileSystemWatcher {
  constructor() {
    logger.debug`NoopFileSystemWatcher created`
  }

  watch(): void {
    return
  }

  dispose(): Promise<void> {
    return Promise.resolve()
  }
}

export class NoopLikeC4ManualLayouts implements LikeC4ManualLayouts {
  constructor() {
    logger.debug`NoopLikeC4ManualLayouts created`
  }

  handleFileSystemUpdate(): Promise<void> {
    return Promise.resolve()
  }

  readSnapshot(): Promise<LayoutedView | null> {
    return Promise.resolve(null)
  }

  read() {
    return Promise.resolve(null)
  }

  write() {
    return Promise.reject(
      new Error('NoopLikeC4ManualLayouts: write operation is not supported'),
    )
  }

  remove() {
    return Promise.resolve(null)
  }

  clearCaches() {
  }

  onManualLayoutUpdate(): Disposable {
    return {
      dispose: () => {},
    }
  }

  dispose(): void {
  }
}

export const NoFileSystemWatcher: FileSystemWatcherModuleContext = {
  fileSystemWatcher: () => new NoopFileSystemWatcher(),
}
export const NoFileSystem: FileSystemModuleContext = {
  fileSystemProvider: () => new NoopFileSystemProvider(),
  ...NoFileSystemWatcher,
}
export const NoLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext = {
  manualLayouts: () => new NoopLikeC4ManualLayouts(),
}
