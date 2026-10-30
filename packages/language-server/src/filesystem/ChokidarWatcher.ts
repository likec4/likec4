import { isLikeC4Config } from '@likec4/config/node'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { URI } from 'langium'
import type { Stats } from 'node:fs'
import { basename } from 'node:path'
import { funnel } from 'remeda'
import { type FileEvent, FileChangeType } from 'vscode-languageserver-protocol'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { isManualLayoutFile } from './LikeC4ManualLayouts'
import type { FileSystemWatcher, FileSystemWatcherModuleContext } from './types'
import { hasLikeC4Ext, insideNodeModulesOrRepo } from './utils'

const logger = mainLogger.getChild('chokidar')

export const WithChokidarWatcher: FileSystemWatcherModuleContext = {
  fileSystemWatcher: (services: LikeC4SharedServices) => new ChokidarFileSystemWatcher(services),
}

const isAnyLikeC4File = (path: string) => {
  const filename = basename(path)
  return hasLikeC4Ext(filename) || isLikeC4Config(filename) || isManualLayoutFile(filename)
}

/**
 * File system watcher based on chokidar (used when there is no LSP client to watch files)
 */
export class ChokidarFileSystemWatcher implements FileSystemWatcher {
  private watcher?: FSWatcher | undefined

  /**
   * Batches file changes (like LSP clients do) and passes them to the DocumentUpdateHandler,
   * the single entry point for file changes (same as in LSP mode)
   */
  private notifyChanges = funnel(
    (changes: Map<string, FileEvent>) => {
      this.services.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
        changes: [...changes.values()],
      })
    },
    {
      minQuietPeriodMs: 50,
      maxBurstDurationMs: 250,
      reducer(accumulator: Map<string, FileEvent> | undefined, change: FileEvent) {
        accumulator ??= new Map()
        // Last change wins
        accumulator.delete(change.uri)
        accumulator.set(change.uri, change)
        return accumulator
      },
    },
  )

  constructor(protected services: LikeC4SharedServices) {
    logger.trace`ChokidarFileSystemWatcher created`
  }

  watch(folder: string): void {
    if (this.watcher) {
      logger.debug`add watching folder: ${folder}`
      this.watcher.add(folder)
      return
    }
    this.watcher = this.createWatcher(folder)
  }

  /**
   * The LikeC4 files, and the files referenced by a `descriptionFile`: a change to one of those
   * changes the model.
   */
  private isWatchedFile(path: string): boolean {
    return isAnyLikeC4File(path) || this.services.workspace.DescriptionFiles.isReferenced(URI.file(path))
  }

  async dispose(): Promise<void> {
    this.notifyChanges.cancel()
    if (this.watcher) {
      const watcher = this.watcher
      this.watcher = undefined
      try {
        await watcher.close()
      } catch {
        // Ignore errors during close
      }
    }
    return
  }

  private createWatcher(folder: string): FSWatcher {
    logger.debug`create watcher for folder: ${folder}`

    let watcher = chokidar.watch(folder, {
      ignored: [
        path => insideNodeModulesOrRepo(path),
        // Filter out non-LikeC4 files early to avoid unnecessary processing
        (path, stats) => !!stats && stats.isFile() && !this.isWatchedFile(path),
        // Honor the project's `exclude` so the watcher skips excluded subtrees.
        path => this.services.workspace.ProjectsManager.isExcluded(URI.file(path)),
      ],
      followSymlinks: true,
      ignoreInitial: true,
    })

    const notify = (type: FileChangeType) => (path: string, stats?: Stats) => {
      if (stats?.isDirectory()) {
        return
      }
      this.notifyChanges.call({ uri: URI.file(path).toString(), type })
    }

    watcher.on('add', notify(FileChangeType.Created))
      .on('change', notify(FileChangeType.Changed))
      .on('unlink', notify(FileChangeType.Deleted))
      .on('unlinkDir', path => {
        this.notifyChanges.call({ uri: URI.file(path).toString(), type: FileChangeType.Deleted })
      })

    return watcher
  }
}
