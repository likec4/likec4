import { isLikeC4Config } from '@likec4/config/node'
import { loggable } from '@likec4/log'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { URI } from 'langium'
import PQueue from 'p-queue'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { isManualLayoutFile } from '../views/LikeC4ManualLayouts'
import type { FileSystemWatcher, FileSystemWatcherModuleContext } from './FileSystemWatcher'
import { isLikeC4File } from './LikeC4FileSystem'

const logger = mainLogger.getChild('chokidar')

export const chokidarFileSystemWatcher: FileSystemWatcherModuleContext = {
  fileSystemWatcher: (services: LikeC4SharedServices) => new ChokidarFileSystemWatcher(services),
}

const isAnyLikeC4File = (path: string) => isLikeC4File(path) || isLikeC4Config(path) || isManualLayoutFile(path)

/**
 * A no-op file system watcher.
 */
export class ChokidarFileSystemWatcher implements FileSystemWatcher {
  private watcher?: FSWatcher | undefined

  private queue = new PQueue({ concurrency: 1, timeout: 5000 })

  constructor(protected services: LikeC4SharedServices) {
  }

  watch(folder: string): void {
    if (this.watcher) {
      this.watcher.add(folder)
    } else {
      this.watcher = this.createWatcher(folder)
    }
    logger.debug`watching folder: ${folder}`
  }

  async dispose(): Promise<void> {
    if (this.watcher) {
      const watcher = this.watcher
      this.watcher = undefined
      await watcher.close()
    }
    return
  }

  private createWatcher(folder: string): FSWatcher {
    let watcher = chokidar.watch(folder, {
      ignored: [
        path => path.includes('node_modules') || path.includes('.git'),
        (path, stats) => (!!stats && stats.isFile() && !isAnyLikeC4File(path)),
      ],
      followSymlinks: true,
      ignoreInitial: true,
    })

    const onAddOrChange = (path: string) => {
      this.enqueueFileOp('addOrChange: ' + path, async () => {
        if (isLikeC4Config(path)) {
          logger.debug`project file changed: ${path}`
          await this.services.workspace.ProjectsManager.reloadProjects()
        } else if (isLikeC4File(path)) {
          logger.debug`file changed: ${path}`
          await this.services.workspace.DocumentBuilder.update([URI.file(path)], [])
        } else if (isManualLayoutFile(path)) {
          logger.debug`manual layout file changed: ${path}`
          // TODO: optimize to only reload manual layouts instead of all projects
          await this.services.workspace.ProjectsManager.reloadProjects()
        } else {
          logger.warn`Unknown file change: ${path}`
        }
      })
    }

    const onRemove = (path: string) => {
      this.enqueueFileOp('remove: ' + path, async () => {
        const pm = this.services.workspace.ProjectsManager
        if (isLikeC4Config(path)) {
          logger.debug`project file removed: ${path}`
          await pm.reloadProjects()
        } else if (isLikeC4File(path)) {
          logger.debug`file removed: ${path}`
          await this.services.workspace.DocumentBuilder.update([], [URI.file(path)])
        } else if (isManualLayoutFile(path)) {
          logger.debug`manual layout file removed: ${path}`
          const project = pm.belongsTo(path)
          await pm.rebuidProject(project)
        } else {
          logger.warn`Unknown file removal: ${path}`
        }
      })
    }

    watcher.on('add', onAddOrChange)
      .on('change', onAddOrChange)
      .on('unlink', onRemove)

    return watcher
  }

  private enqueueFileOp<T>(fileop: string, fn: () => Promise<T>): void {
    this.queue.add(async () => {
      try {
        await fn()
      } catch (error) {
        logger.warn(`Failed on ${fileop}`, { error })
      }
    }).catch(error => {
      logger.error(loggable(error))
    })
  }
}
