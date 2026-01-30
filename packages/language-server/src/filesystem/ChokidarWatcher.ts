import { isLikeC4Config } from '@likec4/config/node'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { URI } from 'langium'
import type { Stats } from 'node:fs'
import { basename } from 'node:path'
import PQueue from 'p-queue'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { isManualLayoutFile } from './LikeC4ManualLayouts'
import type { FileSystemWatcher, FileSystemWatcherModuleContext } from './types'
import { hasLikeC4Ext } from './utils'

const logger = mainLogger.getChild('chokidar')

export const WithChokidarWatcher: FileSystemWatcherModuleContext = {
  fileSystemWatcher: (services: LikeC4SharedServices) => new ChokidarFileSystemWatcher(services),
}

const isAnyLikeC4File = (path: string) => {
  const filename = basename(path)
  return hasLikeC4Ext(filename) || isLikeC4Config(filename) || isManualLayoutFile(filename)
}

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
        (path, stats) => !!stats?.isFile() && !isAnyLikeC4File(path),
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
        logger.warn(`Failed on {fileop}`, { fileop, error })
      }
    }).catch(error => {
      logger.error(`Error on {fileop}`, { fileop, error })
    })
  }

  private async onAddOrChange(path: string) {
    const workspace = this.services.workspace
    const filename = basename(path)
    const uri = URI.file(path)
    switch (true) {
      case isLikeC4Config(filename): {
        logger.debug`project file changed: ${path}`
        workspace.ManualLayouts.clearCaches()
        await workspace.ProjectsManager.registerConfigFile(uri)
        break
      }
      case hasLikeC4Ext(filename): {
        logger.debug`file changed: ${path}`
        await workspace.DocumentBuilder.update([uri], [])
        break
      }
      case isManualLayoutFile(filename): {
        logger.debug`manual layout file changed: ${path}`
        workspace.ManualLayouts.clearCaches()
        const projectId = workspace.ProjectsManager.ownerProjectId(uri)
        await workspace.ProjectsManager.rebuildProject(projectId)
        break
      }
      default: {
        logger.warn`Unknown file change: ${path}`
      }
    }
  }

  private async onRemove(path: string) {
    const workspace = this.services.workspace
    const filename = basename(path)
    const uri = URI.file(path)
    switch (true) {
      case isLikeC4Config(filename): {
        logger.debug`project file removed: ${path}`
        workspace.ManualLayouts.clearCaches()
        await workspace.ProjectsManager.reloadProjects()
        break
      }
      case hasLikeC4Ext(filename): {
        logger.debug`file removed: ${path}`
        await workspace.DocumentBuilder.update([], [uri])
        break
      }
      case isManualLayoutFile(filename): {
        logger.debug`manual layout file removed: ${path}`
        const project = workspace.ProjectsManager.ownerProjectId(uri)
        workspace.ManualLayouts.clearCaches()
        await workspace.ProjectsManager.rebuildProject(project)
        break
      }
      default: {
        logger.warn`Unknown file removal: ${path}`
      }
    }
  }

  private async onRemoveDir(path: string) {
    logger.debug`directory removed: ${path}`
    const workspace = this.services.workspace
    const projects = workspace.ProjectsManager.findOverlaped(path)
    if (projects.length > 0) {
      workspace.ManualLayouts.clearCaches()
      await workspace.ProjectsManager.reloadProjects()
    }
  }
}
