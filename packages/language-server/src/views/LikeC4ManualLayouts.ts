import type { LayoutedView, ViewId } from '@likec4/core'
import { getOrCreate } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import JSON5 from 'json5'
import { type URI, UriUtils } from 'langium'
import { indexBy, prop } from 'remeda'
import { type Location, Position, Range, TextEdit } from 'vscode-languageserver-types'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services } from '../module'
import type { Project } from '../workspace/ProjectsManager'

const logger = rootLogger.getChild('manual-layouts')

function fileName(view: ViewId): string {
  return `${view}.view.json5`
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
  remove(project: Project, view: ViewId): Promise<Pick<Location, 'uri'> | null>
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
        const files = await fs.readDirectory(outDir, { onlyLikeC4Files: false })
        if (files.length === 0) {
          return null
        }
        for (const file of files) {
          if (file.isFile && file.uri.path.endsWith('.view.json5')) {
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
        logger.debug`read manual layouts for ${project.id}, found ${manualLayouts.length}`
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
    const content = JSON5.stringify(layouted, null, 2)
    const manualLayouts = await this.read(project)
    const existing = !!manualLayouts?.[layouted.id]
    let applied = false

    // from vscode-languageserver-types
    const MAX_VALUE = 2147483647

    const range = Range.create(
      Position.create(0, 0),
      Position.create(MAX_VALUE, 1),
    )

    const lspConnection = this.services.shared.lsp.Connection
    // Apply edits if possible
    // Otherwise, write the file
    if (lspConnection && existing) {
      const uri = file.toString()
      const applyResult = await lspConnection.workspace.applyEdit({
        label: `LikeC4 - write manual layout ${layouted.id}`,
        edit: {
          changes: {
            [uri]: [
              TextEdit.replace(
                range,
                content,
              ),
            ],
          },
        },
      })
      applied = applyResult.applied
      if (!applyResult.applied) {
        logger.warn(loggable(applyResult))
      } else {
        logger.debug`Manual layout of ${layouted.id} in project ${project.id} saved to ${file.fsPath}`
      }
    }

    // If not applied, force write the file
    if (!applied) {
      logger.debug`force write manual layout of ${layouted.id} in project ${project.id} to ${file.fsPath}`
      const fs = this.services.shared.workspace.FileSystemProvider
      try {
        await fs.writeFile(file, content)
      } catch (err) {
        logger.warn(`Failed to write manual layout ${layouted.id} to ${file.fsPath}`, { err })
      }
    }

    this.clearCache(project)
    return {
      uri: file.toString(),
      range: Range.create(
        Position.create(0, 0),
        Position.create(content.split('\n').length - 1, 1),
      ),
    }
  }

  async remove(project: Project, view: ViewId): Promise<Pick<Location, 'uri'> | null> {
    const outDir = getManualLayoutsOutDir(project)

    const manualLayouts = await this.read(project)
    if (!manualLayouts?.[view]) {
      logger.debug(`Project ${project.id} does not have manual layout for ${view}`)
      return null
    }

    const file = UriUtils.joinPath(outDir, fileName(view))
    let applied = false
    const lspConnection = this.services.shared.lsp.Connection
    // Apply workspace edits if possible
    // Otherwise, delete the file
    if (lspConnection) {
      const applyResult = await lspConnection.workspace.applyEdit({
        label: `LikeC4 - remove manual layout ${view}`,
        edit: {
          documentChanges: [
            {
              kind: 'delete',
              uri: file.toString(),
            },
          ],
        },
      })
      applied = applyResult.applied
      if (!applyResult.applied) {
        logger.warn(loggable(applyResult))
      } else {
        logger.debug`manual layout of ${view} in project ${project.id} removed. File: ${file.toString()}`
      }
    }

    // If not applied, force delete the file
    if (!applied) {
      logger.debug`force delete manual layout of ${view} in project ${project.id}. File: ${file.toString()}`
      try {
        const fs = this.services.shared.workspace.FileSystemProvider
        applied = await fs.deleteFile(file)
      } catch (err) {
        logger.warn(`Failed to delete manual layout ${view} from ${file.toString()}`, { err })
      }
    }
    if (!applied) {
      return null
    }
    this.clearCache(project)
    return {
      uri: file.toString(),
    }
  }

  private clearCache(project: Project): void {
    this.manualLayouts.delete(project.folderUri)
    this.services.likec4.ModelBuilder.clearCache()
  }

  clearCaches(): void {
    this.manualLayouts = new WeakMap()
  }
}
