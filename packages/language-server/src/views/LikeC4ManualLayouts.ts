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

function fileName(view: LayoutedView): string {
  return `${view.id}.${view._type}-view.json5`
}

export interface LikeC4ManualLayouts {
  read(project: Project): Promise<Record<ViewId, LayoutedView> | null>
  write(project: Project, layouted: LayoutedView): Promise<Location>
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
      const outDir = UriUtils.resolvePath(
        project.folderUri,
        project.config.manualLayouts?.outDir ?? '.likec4',
      )
      const manualLayouts = [] as LayoutedView[]
      try {
        const files = await fs.readDirectory(outDir, { onlyLikeC4Files: false })
        for (const file of files) {
          if (file.isFile && file.uri.path.endsWith('c4-view.json5')) {
            try {
              const content = await fs.readFile(file.uri)
              manualLayouts.push(JSON5.parse<LayoutedView>(content))
            } catch (e) {
              logger.warn(`Failed to read manual layout ${file.uri.fsPath}`)
              logger.warn(loggable(e))
            }
          }
        }
      } catch (e) {
        logger.warn(`Failed to read manual layouts for ${project.folderUri.fsPath}`)
        logger.warn(loggable(e))
      }
      if (manualLayouts.length === 0) {
        return null
      }
      return indexBy(manualLayouts, prop('id'))
    })
  }

  async write(project: Project, layouted: LayoutedView): Promise<Location> {
    const outDir = UriUtils.resolvePath(
      project.folderUri,
      project.config.manualLayouts?.outDir ?? '.likec4',
    )
    const file = UriUtils.joinPath(outDir, fileName(layouted))
    const content = JSON5.stringify(layouted, null, 2)
    // from vscode-languageserver-types
    const MAX_VALUE = 2147483647

    const range = Range.create(
      Position.create(0, 0),
      Position.create(MAX_VALUE, 1),
    )

    let applied = false
    const lspConnection = this.services.shared.lsp.Connection
    // Apply edits if possible
    // Otherwise, write the file
    if (lspConnection) {
      const applyResult = await lspConnection.workspace.applyEdit({
        label: `LikeC4 - write manual layout ${layouted.id}`,
        edit: {
          changes: {
            [file.toString()]: [
              TextEdit.replace(
                range,
                content,
              ),
            ],
          },
          documentChanges: [
            {
              kind: 'create',
              uri: file.toString(),
              options: {
                ignoreIfExists: true,
              },
            },
            {
              textDocument: {
                uri: file.toString(),
                version: null,
              },
              edits: [
                TextEdit.replace(
                  range,
                  content,
                ),
              ],
            },
          ],
        },
      })
      applied = applyResult.applied
      if (!applyResult.applied) {
        logger.warn(loggable(applyResult))
      } else {
        logger.debug(`Manual layout ${layouted.id} saved to ${file.toString()}`)
      }
    }

    // If not applied, force write the file
    if (!applied) {
      logger.debug(`force write manual layout ${layouted.id} to ${file.toString()}`)
      const fs = this.services.shared.workspace.FileSystemProvider
      await fs.writeFile(file, content)
    }

    this.manualLayouts.delete(project.folderUri)
    this.services.likec4.ModelBuilder.clearCache()
    return {
      uri: file.toString(),
      range,
    }
  }
}
