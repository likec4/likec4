import { isLikeC4Config } from '@likec4/config/node'
import { loggable } from '@likec4/log'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { URI } from 'langium'
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
      await this.watcher.close()
      this.watcher = undefined
    }
    return
  }

  private createWatcher(folder: string): FSWatcher {
    let watcher = chokidar.watch(folder, {
      ignored: [
        path => path.includes('node_modules') || path.includes('.git'),
        (path, stats) => (!!stats && stats.isFile() && !isAnyLikeC4File(path)),
      ],
      ignoreInitial: true,
    })

    const onAddOrChange = async (path: string) => {
      try {
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
      } catch (error) {
        logger.error(loggable(error))
      }
    }

    const onRemove = async (path: string) => {
      try {
        if (isLikeC4Config(path)) {
          logger.debug`project file removed: ${path}`
          await this.services.workspace.ProjectsManager.reloadProjects()
        } else if (isLikeC4File(path)) {
          logger.debug`file removed: ${path}`
          await this.services.workspace.DocumentBuilder.update([], [URI.file(path)])
        } else if (isManualLayoutFile(path)) {
          logger.debug`manual layout file removed: ${path}`
          // TODO: optimize to only reload manual layouts instead of all projects
          await this.services.workspace.ProjectsManager.reloadProjects()
        } else {
          logger.warn`Unknown file removal: ${path}`
        }
      } catch (error) {
        logger.error(loggable(error))
      }
    }

    watcher.on('add', onAddOrChange)
      .on('change', onAddOrChange)
      .on('unlink', onRemove)

    return watcher
  }
}
