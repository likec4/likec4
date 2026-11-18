import { type DiagramNode, type Icon, type LayoutedView, type ProjectId, type ViewId, exact } from '@likec4/core'
import { objectHash, onNextTick, stringHash } from '@likec4/core/utils'
import JSON5 from 'json5'
import { Disposable, SimpleCache, URI, UriUtils } from 'langium'
import pLimit from 'p-limit'
import { basename } from 'pathe'
import { funnel, indexBy, prop } from 'remeda'
import { withTrailingSlash } from 'ufo'
import { type FileEvent, FileChangeType } from 'vscode-languageserver-protocol'
import {
  type Location,
  Position,
  Range,
} from 'vscode-languageserver-types'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable, compareByUri, safeCall } from '../utils'
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
export { extension as MANUAL_LAYOUTS_EXTENSION }
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

export class DefaultLikeC4ManualLayouts extends ADisposable implements LikeC4ManualLayouts {
  protected cache: SimpleCache<ProjectId, ManualLayoutsSnapshot | null>

  private listeners: ManualLayoutUpdateListener[] = []

  /**
   * Reads and writes are serialized, otherwise a read in progress may cache a stale snapshot
   */
  #limit = pLimit(1)

  constructor(private services: LikeC4SharedServices) {
    super()

    this.onDispose(
      this.cache = new SimpleCache(),
      Disposable.create(() => {
        this.triggerUpdate.cancel()
        this.#limit.clearQueue()
        this.listeners.length = 0
      }),
    )

    onNextTick(() => {
      this.onDispose(
        services.workspace.ProjectsManager.onProjectsUpdate(() => {
          this.clearCaches()
        }),
        services.lsp.DocumentUpdateHandler.onWatchedFilesChangeBy(
          // Process snapshot files and deleted folders with snapshots
          // (when a folder is deleted, the client sends a single event for the folder)
          ({ uri, type }) =>
            isManualLayoutFile(basename(uri))
            || (type === FileChangeType.Deleted && this.projectsWithSnapshotsIn(URI.parse(uri)).length > 0),
          (changes) => {
            layoutsLogger.trace`onWatchedFilesChangeBy\n${changes.map((c) => c.uri)}`
            for (const change of changes) {
              if (!isManualLayoutFile(basename(change.uri))) {
                this.onSnapshotsFolderDelete(URI.parse(change.uri))
                continue
              }
              this.onSnapshotFileChange(change).catch((error) => {
                layoutsLogger.warn(`Error handling snapshot change {change}`, {
                  change,
                  error,
                })
              })
            }
            return
          },
        ),
      )
    })
  }

  /**
   * Projects with snapshots inside the given folder:
   * the folder is the snapshots folder (or its parent), or a folder inside it
   */
  protected projectsWithSnapshotsIn(folder: URI): ProjectId[] {
    const projects = this.services.workspace.ProjectsManager
    const deleted = withTrailingSlash(folder.toString())
    return projects.all.filter(projectId => {
      const outDir = withTrailingSlash(getManualLayoutsOutDir(projects.getProject(projectId)).toString())
      return outDir.startsWith(deleted) || deleted.startsWith(outDir)
    })
  }

  /**
   * Handles deletion of a folder with snapshots.
   * Snapshots inside are unknown (folder is already deleted), so all views of the project are affected
   */
  protected onSnapshotsFolderDelete(folder: URI): void {
    for (const projectId of this.projectsWithSnapshotsIn(folder)) {
      layoutsLogger.debug`snapshots folder deleted in project ${projectId}: ${folder.fsPath}`
      this.cache.delete(projectId)
      this.triggerUpdate.call({
        removed: folder,
        projectId,
      })
    }
  }

  /**
   * Handles changes of snapshot files on disk (made outside of this service)
   */
  protected async onSnapshotFileChange(change: FileEvent): Promise<void> {
    const uri = URI.parse(change.uri)
    let viewId = viewIdFromURI(uri) ?? undefined
    const projectId = this.services.workspace.ProjectsManager.ownerProjectId(uri)
    this.cache.delete(projectId)
    if (change.type === FileChangeType.Deleted) {
      this.triggerUpdate.call(exact({
        removed: uri,
        projectId,
        viewId,
      }))
      return
    }

    if (!viewId) {
      const project = this.services.workspace.ProjectsManager.getProject(projectId)
      const snapshot = await this.readSnapshot(uri, project)
      if (snapshot) {
        viewId = snapshot.id
      } else {
        layoutsLogger.warn(`Snapshot ${uri.fsPath} does not exist or is invalid`)
        viewId = 'index' as ViewId
      }
    }
    this.triggerUpdate.call({
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
    let hash = stringHash(project.id)
    try {
      const files = await fs.scanDirectory(outDir, isManualLayoutFile)
      if (files.length === 0) {
        return null
      }
      logger.trace`found ${files.length} manual layouts in ${
        this.services.workspace.WorkspaceManager.relativePath(outDir)
      }`

      // Guarantee consistent order (for hash calculation)
      files.sort(compareByUri)

      for (const file of files) {
        const relativePath = UriUtils.relative(project.folderUri, file.uri)
        try {
          logger.trace`read snapshot ${relativePath}`
          const content = await fs.readFile(file.uri)
          const parsed = JSON5.parse<LayoutedView>(content)
          hash = objectHash({
            basename: basename(file.uri.path),
            content,
            hash,
          })
          const resolved = this.resolveIconPathsAfterRead(parsed, project.folderUri)
          manualLayouts.push({
            ...resolved,
            _layout: 'manual',
          })
        } catch (err) {
          logger.warn(`Failed to read snapshot {relativePath}`, { relativePath, err })
        }
      }
    } catch (err) {
      logger.warn(`Failed to read snapshots for ${project.folderUri.fsPath}`, { err })
    }
    if (manualLayouts.length === 0) {
      return null
    }
    logger.trace`loaded ${manualLayouts.length} manual layouts, hash: ${hash}`
    const views = indexBy(manualLayouts, prop('id'))
    return {
      hash,
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
    return await this.#limit(
      async () => {
        const cached = this.cache.get(project.id)
        if (cached !== undefined) {
          layoutsLogger.trace`cache hit project ${project.id}`
          return cached
        }
        const result = await this.readManualLayouts(project)
        this.cache.set(project.id, result)
        return result
      },
    )
  }

  async write(project: Project, layouted: LayoutedView): Promise<Location> {
    return await this.#limit(
      async () => {
        const logger = layoutsLogger.getChild(project.id)
        const outDir = getManualLayoutsOutDir(project)
        const file = UriUtils.joinPath(outDir, fileName(layouted.id))
        const workspaceRelativePath = this.services.workspace.WorkspaceManager.relativePath(file)

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
        logger.debug`write snapshot of ${layouted.id} to ${workspaceRelativePath}`
        const fs = this.services.workspace.FileSystemProvider
        try {
          await fs.writeFile(file, content + '\n')
          // Clean cache after successful write
          this.cache.delete(project.id)
          this.triggerUpdate.call({
            updated: file,
            projectId: project.id,
            viewId: layouted.id,
          })
        } catch (err) {
          logger.warn(`Failed to write snapshot {viewId} to {workspaceRelativePath}`, {
            viewId: layouted.id,
            workspaceRelativePath,
            err,
          })
        }
        return location
      },
    )
  }

  async remove(project: Project, view: ViewId): Promise<Location | null> {
    return await this.#limit(() => this.removeSnapshot(project, view))
  }

  private async removeSnapshot(project: Project, view: ViewId): Promise<Location | null> {
    const logger = layoutsLogger.getChild(project.id)
    const outDir = getManualLayoutsOutDir(project)
    const file = UriUtils.joinPath(outDir, fileName(view))
    const workspaceRelativePath = this.services.workspace.WorkspaceManager.relativePath(file)

    logger.debug`delete snapshot of ${view} in project ${project.id}. File: ${workspaceRelativePath}`

    const location = {
      uri: file.toString(),
      range: Range.create(0, 0, 0, 0),
    }

    try {
      const fs = this.services.workspace.FileSystemProvider
      if (!(await fs.deleteFile(file))) {
        logger.warn`Snapshot ${view} did not exist at ${workspaceRelativePath}`
        return null
      }
      // Clean cache after successful deletion
      this.cache.delete(project.id)
      this.triggerUpdate.call({
        removed: file,
        projectId: project.id,
        viewId: view,
      })
    } catch (err) {
      logger.warn(`Failed to delete snapshot {viewId} from {workspaceRelativePath}`, {
        viewId: view,
        workspaceRelativePath,
        err,
      })
    }
    return location
  }

  clearCaches(): void {
    layoutsLogger.trace`clear caches`
    this.cache.clear()
  }

  /**
   * Triggers updates to all listeners with the given events.
   * Events are deduplicated and grouped by URI.
   */
  private triggerUpdate = funnel(
    (events) => {
      // Copy to avoid modification during iteration
      const listeners = [...this.listeners]
      for (const listener of listeners) {
        for (const e of events.values()) {
          safeCall(() => listener(e))
        }
      }
    },
    {
      maxBurstDurationMs: 100,
      minQuietPeriodMs: 30,
      reducer(
        accumulator: Map<string, ManualLayoutUpdateEvent> | undefined,
        current: ManualLayoutUpdateEvent,
      ) {
        const uri = 'updated' in current ? current.updated.toString() : current.removed.toString()
        accumulator ??= new Map<string, ManualLayoutUpdateEvent>()
        // Same folder may contain snapshots of different projects
        accumulator.set(`${current.projectId}|${uri}`, current)
        return accumulator
      },
    },
  )

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
