import type { LikeC4ProjectConfig } from '@likec4/config'
import type { URI } from 'langium'
import { LibIcons } from '../generated-lib/icons'
import { isLikeC4Builtin } from '../likec4lib'
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

  readFile(uri: URI): Promise<string> {
    if (isLikeC4Builtin(uri)) {
      return Promise.resolve(LibIcons)
    }
    throw new Error('No file system is available.')
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
  watch(): void {
    return
  }

  dispose(): Promise<void> {
    return Promise.resolve()
  }
}

export class NoopLikeC4ManualLayouts implements LikeC4ManualLayouts {
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
