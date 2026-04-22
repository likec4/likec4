import { type DiagramNode, type Icon, type LayoutedView, type ProjectId, type ViewId, exact } from '@likec4/core'
import { objectHash, onNextTick } from '@likec4/core/utils'
import JSON5 from 'json5'
import { type Disposable, SimpleCache, URI, UriUtils } from 'langium'
import pLimit from 'p-limit'
import { indexBy, prop } from 'remeda'
import {
  type Location,
  Position,
  Range,
} from 'vscode-languageserver-types'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { safeCall } from '../utils'
import type { Project } from '../workspace/ProjectsManager'
import type {
  LikeC4ManualLayouts,
  LikeC4ManualLayoutsModuleContext,
  ManualLayoutsSnapshot,
  ManualLayoutUpdateEvent,
  ManualLayoutUpdateListener,
} from './types'

const layoutsLogger = rootLogger.getChild('manual-layouts')

const extension = '.likec4.snap'
/**
 * @todo sync with vscode extension watchers
 *       (search for ".likec4.snap" references)
 */
export const isManualLayoutFile = (path: string) => path !== extension && path.endsWith(extension)

function fileName(view: ViewId): string {
  return `${view}${extension}`
}

function viewIdFromURI(uri: URI): ViewId | null {
  const fileName = UriUtils.basename(uri)
  if (!isManualLayoutFile(fileName)) {
    return null
  }
  return fileName.slice(0, -extension.length) as ViewId
}

function getManualLayoutsOutDir(project: Project): URI {
  return UriUtils.resolvePath(
    project.folderUri,
    project.config.manualLayouts?.outDir ?? '.likec4',
  )
}

export const WithLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext = {
  manualLayouts: (services: LikeC4SharedServices) => new DefaultLikeC4ManualLayouts(services),
}

const RELATIVE_PATH_PREFIX = 'file://./'

export class DefaultLikeC4ManualLayouts implements LikeC4ManualLayouts {
  protected cache: SimpleCache<ProjectId, ManualLayoutsSnapshot | null>

  private listeners: ManualLayoutUpdateListener[] = []

  #limit = pLimit(1)

  constructor(private services: LikeC4SharedServices) {
    this.cache = new SimpleCache()

    onNextTick(() => {
      services.workspace.ProjectsManager.onProjectsUpdate(() => {
        this.clearCaches()
      })
    })
  }

  async handleFileSystemUpdate(
    event: { update: URI; delete?: never } | { delete: URI; update?: never },
  ): Promise<void> {
    const uri = event.update ?? event.delete
    let viewId = viewIdFromURI(uri) ?? undefined
    const projectId = this.services.workspace.ProjectsManager.ownerProjectId(uri)
    this.cache.delete(projectId)
    if ('delete' in event) {
      this.triggerUpdate(exact({
        removed: uri,
        projectId,
        viewId,
      }))
      return
      // TODO: handle delete
    }

    const project = this.services.workspace.ProjectsManager.getProject(projectId)
    if (!viewId) {
      const snapshot = await this.readSnapshot(uri, project)
      if (snapshot) {
        viewId = snapshot.id
      } else {
        layoutsLogger.error(`Snapshot ${uri.fsPath} does not exist or is invalid`)
        viewId = 'index' as ViewId
      }
    }
    this.triggerUpdate({
      updated: uri,
      projectId,
      viewId,
    })
  }

  onManualLayoutUpdate(listener: ManualLayoutUpdateListener): Disposable {
    this.listeners.push(listener)
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener)
        if (index !== -1) {
          this.listeners.splice(index, 1)
        }
      },
    }
  }

  protected async readManualLayouts(project: Project): Promise<ManualLayoutsSnapshot | null> {
    const logger = layoutsLogger.getChild(project.id)
    const fs = this.services.workspace.FileSystemProvider
    const outDir = getManualLayoutsOutDir(project)
    const manualLayouts = [] as LayoutedView[]
    try {
      const files = await fs.scanDirectory(outDir, isManualLayoutFile)
      if (files.length === 0) {
        return null
      }
      for (const file of files) {
        try {
          const content = await fs.readFile(file.uri)
          const parsed = JSON5.parse<LayoutedView>(content)
          const resolved = this.resolveIconPathsAfterRead(parsed, project.folderUri)
          manualLayouts.push({
            ...resolved,
            _layout: 'manual',
          })
        } catch (err) {
          logger.warn(`Failed to read view snapshot ${file.uri.fsPath}`, { err })
        }
      }
      if (manualLayouts.length) {
        logger.trace`read manual layouts for ${project.id}, found ${manualLayouts.length}`
      }
    } catch (err) {
      logger.warn(`Failed to read manual layouts for ${project.folderUri.fsPath}`, { err })
    }
    if (manualLayouts.length === 0) {
      return null
    }
    const views = indexBy(manualLayouts, prop('id'))
    return {
      hash: objectHash(views),
      views,
    }
  }

  async readSnapshot(uri: URI, project?: Project): Promise<LayoutedView | null> {
    const fs = this.services.workspace.FileSystemProvider
    try {
      const content = await fs.readFile(uri)
      const parsed = JSON5.parse<LayoutedView>(content)
      if (!project) {
        const projectId = this.services.workspace.ProjectsManager.ownerProjectId(uri)
        project = this.services.workspace.ProjectsManager.getProject(projectId)
      }
      const resolved = this.resolveIconPathsAfterRead(parsed, project.folderUri)
      return {
        ...resolved,
        _layout: 'manual',
      }
    } catch (err) {
      layoutsLogger.warn(`Failed to read view snapshot ${uri.fsPath}`, { err })
      return null
    }
  }

  async read(project: Project): Promise<ManualLayoutsSnapshot | null> {
    return await this.#limit(async () => {
      const cached = this.cache.get(project.id)
      if (cached !== undefined) {
        return cached
      }
      const result = await this.readManualLayouts(project)
      this.cache.set(project.id, result)
      return result
    })
  }

  async write(project: Project, layouted: LayoutedView): Promise<Location> {
    // Clean cache first
    this.cache.delete(project.id)

    const logger = layoutsLogger.getChild(project.id)
    const outDir = getManualLayoutsOutDir(project)
    const file = UriUtils.joinPath(outDir, fileName(layouted.id))
    // Ensure the manualLayout field is omitted (may exist in migration)
    if ('manualLayout' in layouted) {
      const { manualLayout: _, ...rest } = layouted
      layouted = rest
    }
    const content = JSON5.stringify(
      // Normalize icon paths before writing
      this.normalizeIconPathsForWrite(layouted, project.folderUri),
      {
        space: 2,
        quote: '\'',
      },
    )
    const location = {
      uri: file.toString(),
      range: Range.create(
        Position.create(0, 0),
        Position.create(content.split('\n').length - 1, 1),
      ),
    }
    logger.debug`write snapshot of ${layouted.id} in project ${project.id} to ${file.fsPath}`
    const fs = this.services.workspace.FileSystemProvider
    try {
      await fs.writeFile(file, content + '\n')
      this.triggerUpdate({
        updated: file,
        projectId: project.id,
        viewId: layouted.id,
      })
    } catch (err) {
      logger.warn(`Failed to write snapshot ${layouted.id} to ${file.fsPath}`, { err })
    }
    return location
  }

  async remove(project: Project, view: ViewId): Promise<Location | null> {
    // Clean cache first
    this.cache.delete(project.id)

    const logger = layoutsLogger.getChild(project.id)
    const outDir = getManualLayoutsOutDir(project)
    const file = UriUtils.joinPath(outDir, fileName(view))

    logger.debug`delete snapshot of ${view} in project ${project.id}. File: ${file.fsPath}`

    const location = {
      uri: file.toString(),
      range: Range.create(0, 0, 0, 0),
    }

    try {
      const fs = this.services.workspace.FileSystemProvider
      if (!(await fs.deleteFile(file))) {
        logger.warn`Snapshot ${view} did not exist at ${file.fsPath}`
        return null
      }
      this.triggerUpdate({
        removed: file,
        projectId: project.id,
        viewId: view,
      })
    } catch (err) {
      logger.warn(`Failed to delete snapshot ${view} from ${file.fsPath}`, { err })
    }
    return location
  }

  clearCaches(): void {
    layoutsLogger.trace`clear caches`
    this.cache.clear()
  }

  private triggerUpdate(event: ManualLayoutUpdateEvent): void {
    for (const listener of this.listeners) {
      safeCall(() => listener(event))
    }
  }

  /**
   * When we save snapshot - it may contain fullpath to icons on the machine it was created,
   * that is wrong when opened on another.
   *
   * Prepares a snapshot for writing by converting absolute icon paths to relative paths.
   * Absolute paths starting with 'file://' are converted to relative paths prefixed with 'file://./'
   */
  protected normalizeIconPathsForWrite(layouted: LayoutedView, projectUri: URI): LayoutedView {
    const nodes = layouted.nodes.map((node): DiagramNode => {
      if (!node.icon || typeof node.icon !== 'string') {
        return node
      }
      // Check if icon is an absolute file path
      if (node.icon.startsWith('file://')) {
        const iconUri = URI.parse(node.icon)
        // Get relative path from project folder to icon
        const relativePath = UriUtils.relative(projectUri, iconUri)

        // If icon is outside of project folder - leave it as is,
        // to avoid security issues on reading snapshots on another machine
        if (relativePath.startsWith('..')) {
          return node
        }

        return {
          ...node,
          icon: `${RELATIVE_PATH_PREFIX}${relativePath}` as Icon,
        }
      }
      return node
    })
    return {
      ...layouted,
      nodes: nodes,
    }
  }

  /**
   * Postprocesses a snapshot after reading by converting relative icon paths back to absolute paths.
   * Relative paths prefixed with 'file://./' are converted to absolute paths based on project folder.
   */
  protected resolveIconPathsAfterRead(layouted: LayoutedView, projectUri: URI): LayoutedView {
    const nodes = layouted.nodes.map((node): DiagramNode => {
      if (!node.icon || typeof node.icon !== 'string') {
        return node
      }
      // Check if icon is a relative file path
      if (node.icon.startsWith(RELATIVE_PATH_PREFIX)) {
        const relativePath = node.icon.substring(RELATIVE_PATH_PREFIX.length)
        const absoluteUri = UriUtils.joinPath(projectUri, relativePath)
        return {
          ...node,
          icon: absoluteUri.toString() as any,
        }
      }
      return node
    })
    return {
      ...layouted,
      nodes: nodes as any,
    }
  }
}
