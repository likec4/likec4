import type { DiagramNode, Icon, LayoutedView, ProjectId, ViewId } from '@likec4/core'
import { objectHash, onNextTick } from '@likec4/core/utils'
import JSON5 from 'json5'
import { SimpleCache, URI, UriUtils } from 'langium'
import { indexBy, prop } from 'remeda'
import {
  type Location,
  Position,
  Range,
} from 'vscode-languageserver-types'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import type { Project } from '../workspace/ProjectsManager'
import type { LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext, ManualLayoutsSnapshot } from './types'

const layoutsLogger = rootLogger.getChild('manual-layouts')

/**
 * @todo sync with vscode extension watchers
 *       (search for ".likec4.snap" references)
 */
export const isManualLayoutFile = (path: string) => path.endsWith('.likec4.snap')

function fileName(view: ViewId): string {
  return `${view}.likec4.snap`
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
  protected cache: SimpleCache<ProjectId, Promise<ManualLayoutsSnapshot | null>>

  constructor(private services: LikeC4SharedServices) {
    this.cache = new SimpleCache()

    onNextTick(() => {
      services.workspace.ProjectsManager.onProjectsUpdate(() => {
        this.clearCaches()
      })
    })
  }

  async read(project: Project): Promise<ManualLayoutsSnapshot | null> {
    return await this.cache.get(project.id, async () => {
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
          logger.debug`read manual layouts for ${project.id}, found ${manualLayouts.length}`
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
    })
  }

  async write(project: Project, layouted: LayoutedView): Promise<Location> {
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
    } catch (err) {
      logger.warn(`Failed to write snapshot ${layouted.id} to ${file.fsPath}`, { err })
    }
    this.cache.delete(project.id)
    return location
  }

  async remove(project: Project, view: ViewId): Promise<Location | null> {
    const logger = layoutsLogger.getChild(project.id)
    const outDir = getManualLayoutsOutDir(project)
    const file = UriUtils.joinPath(outDir, fileName(view))

    logger.debug`delete snapshot of ${view} in project ${project.id}. File: ${file.fsPath}`

    const location = {
      uri: file.toString(),
      range: Range.create(0, 0, 0, 0),
    }

    this.cache.delete(project.id)

    try {
      const fs = this.services.workspace.FileSystemProvider
      if (!(await fs.deleteFile(file))) {
        logger.warn`Snapshot ${view} did not exist at ${file.fsPath}`
        return null
      }
    } catch (err) {
      logger.warn(`Failed to delete snapshot ${view} from ${file.fsPath}`, { err })
    }
    return location
  }

  clearCaches(): void {
    layoutsLogger.trace`clear caches`
    this.cache.clear()
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
