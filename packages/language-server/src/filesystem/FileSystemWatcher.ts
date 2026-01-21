import type { AsyncDisposable } from 'langium'
import type { LikeC4SharedServices } from '../module'

export interface FileSystemWatcherModuleContext {
  fileSystemWatcher: (services: LikeC4SharedServices) => FileSystemWatcher
}

export const NoFileSystemWatcher: FileSystemWatcherModuleContext = {
  fileSystemWatcher: () => new NoopFileSystemWatcher(),
}

export interface FileSystemWatcher extends AsyncDisposable {
  /**
   * Watches a folder for changes and triggers a reload of the documents and projects.
   */
  watch(folder: string): void
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
