import { isLikeC4Config } from '@likec4/config/node'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { URI } from 'langium'
import type { Stats } from 'node:fs'
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
      logger.debug`add watching folder: ${folder}`
      this.watcher.add(folder)
      return
    }
    this.watcher = this.createWatcher(folder)
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
    logger.debug`create watcher for folder: ${folder}`

    let watcher = chokidar.watch(folder, {
      ignored: [
        path => path.includes('node_modules') || path.includes('.git'),
        (path, stats) => (!!stats && stats.isFile() && !isAnyLikeC4File(path)),
      ],
      followSymlinks: true,
      ignoreInitial: true,
    })

    const onAddOrChange = (path: string, stats?: Stats) => {
      if (stats?.isDirectory()) {
        return
      }
      this.enqueueFileOp('addOrChange: ' + path, async () => {
        await this.onAddOrChange(path)
      })
    }

    const onRemove = (path: string, stats?: Stats) => {
      if (stats?.isDirectory()) {
        return
      }
      this.enqueueFileOp('remove: ' + path, async () => {
        await this.onRemove(path)
      })
    }

    watcher.on('add', onAddOrChange)
      .on('change', onAddOrChange)
      .on('unlink', onRemove)
      .on('unlinkDir', (path) => {
        this.enqueueFileOp('removeDir: ' + path, async () => {
          await this.onRemoveDir(path)
        })
      })

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
      logger.error(`Error on ${fileop}`, { error })
    })
  }

  private async onAddOrChange(path: string) {
    const pm = this.services.workspace.ProjectsManager
    if (isLikeC4Config(path)) {
      logger.debug`project file changed: ${path}`
      await pm.registerConfigFile(URI.file(path))
    } else if (isLikeC4File(path)) {
      logger.debug`file changed: ${path}`
      await this.services.workspace.DocumentBuilder.update([URI.file(path)], [])
    } else if (isManualLayoutFile(path)) {
      logger.debug`manual layout file changed: ${path}`
      const projectId = pm.belongsTo(URI.file(path))
      await pm.rebuidProject(projectId)
    } else {
      logger.warn`Unknown file change: ${path}`
    }
  }

  private async onRemove(path: string) {
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
  }

  private async onRemoveDir(path: string) {
    logger.debug`directory removed: ${path}`
    const pm = this.services.workspace.ProjectsManager
    const projects = pm.findAllProjectsByFolder(path)
    if (projects.length > 0) {
      await pm.reloadProjects()
    }
  }
}
