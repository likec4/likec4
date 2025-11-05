import type { LayoutedView, ViewId } from '@likec4/core'
import { getOrCreate } from '@likec4/core/utils'
import JSON5 from 'json5'
import { type URI, UriUtils } from 'langium'
import { indexBy, prop } from 'remeda'
import {
  type Location,
  Position,
  Range,
} from 'vscode-languageserver-types'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services } from '../module'
import type { Project } from '../workspace/ProjectsManager'

const logger = rootLogger.getChild('manual-layouts')

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

export interface LikeC4ManualLayouts {
  read(project: Project): Promise<Record<ViewId, LayoutedView> | null>
  write(project: Project, layouted: LayoutedView): Promise<Location>
  remove(project: Project, view: ViewId): Promise<Location | null>
  clearCaches(): void
}

export interface LikeC4ManualLayoutsModuleContext {
  manualLayouts: (services: LikeC4Services) => LikeC4ManualLayouts
}

export const WithLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext = {
  manualLayouts: (services: LikeC4Services) => new DefaultLikeC4ManualLayouts(services),
}

export class DefaultLikeC4ManualLayouts implements LikeC4ManualLayouts {
  private manualLayouts = new WeakMap<URI, Promise<Record<ViewId, LayoutedView> | null>>()

  constructor(private services: LikeC4Services) {
  }

  async read(project: Project): Promise<Record<ViewId, LayoutedView> | null> {
    return await getOrCreate(this.manualLayouts, project.folderUri, async _ => {
      const fs = this.services.shared.workspace.FileSystemProvider
      const outDir = getManualLayoutsOutDir(project)
      const manualLayouts = [] as LayoutedView[]
      try {
        const files = await fs.scanDirectory(outDir, isManualLayoutFile)
        if (files.length === 0) {
          return null
        }
        for (const file of files) {
          if (file.isFile) {
            try {
              const content = await fs.readFile(file.uri)
              manualLayouts.push({
                ...JSON5.parse<LayoutedView>(content),
                _layout: 'manual',
              })
            } catch (err) {
              logger.warn(`Failed to read view snapshot ${file.uri.fsPath}`, { err })
            }
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
      return indexBy(manualLayouts, prop('id'))
    })
  }

  async write(project: Project, layouted: LayoutedView): Promise<Location> {
    const outDir = getManualLayoutsOutDir(project)
    const file = UriUtils.joinPath(outDir, fileName(layouted.id))
    // Ensure the manualLayout field is omitted (may exist in migration)
    if ('manualLayout' in layouted) {
      const { manualLayout: _, ...rest } = layouted
      layouted = rest
    }
    const content = JSON5.stringify(layouted, {
      space: 2,
      quote: '\'',
    })
    const location = {
      uri: file.toString(),
      range: Range.create(
        Position.create(0, 0),
        Position.create(content.split('\n').length - 1, 1),
      ),
    }
    logger.debug`write snapshot of ${layouted.id} in project ${project.id} to ${file.fsPath}`
    const fs = this.services.shared.workspace.FileSystemProvider
    try {
      await fs.writeFile(file, content)
    } catch (err) {
      logger.warn(`Failed to write snapshot ${layouted.id} to ${file.fsPath}`, { err })
    }

    const projectCaches = await this.read(project)
    if (projectCaches) {
      logger.debug`update snapshot cache of ${layouted.id} in project ${project.id}`
      projectCaches[layouted.id] = layouted
    } else {
      this.manualLayouts.delete(project.folderUri)
    }
    this.services.likec4.ModelBuilder.clearCache()
    return location
  }

  async remove(project: Project, view: ViewId): Promise<Location | null> {
    const outDir = getManualLayoutsOutDir(project)
    const file = UriUtils.joinPath(outDir, fileName(view))

    logger.debug`delete snapshot of ${view} in project ${project.id}. File: ${file.fsPath}`

    const location = {
      uri: file.toString(),
      range: Range.create(0, 0, 0, 0),
    }

    try {
      const fs = this.services.shared.workspace.FileSystemProvider
      if (!(await fs.deleteFile(file))) {
        logger.warn`Snapshot ${view} did not exist at ${file.fsPath}`
        return null
      }
    } catch (err) {
      logger.warn(`Failed to delete snapshot ${view} from ${file.fsPath}`, { err })
    }

    const projectCaches = await this.read(project)
    if (projectCaches) {
      logger.debug`clean cache of ${view} in project ${project.id}`
      delete projectCaches[view]
    } else {
      this.manualLayouts.delete(project.folderUri)
    }

    this.services.likec4.ModelBuilder.clearCache()
    return location
  }

  clearCaches(): void {
    this.manualLayouts = new WeakMap()
  }
}
