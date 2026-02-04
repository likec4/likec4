import { type ProjectId, type ViewChange, invariant, nonexhaustive } from '@likec4/core'
import { loggable, wrapError } from '@likec4/log'
import { Range, TextEdit } from 'vscode-languageserver-types'
import { logger as mainLogger } from '../logger'
import type { LikeC4ModelLocator, ViewLocateResult } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'
import { changeElementStyle } from './changeElementStyle'
import { changeViewLayout } from './changeViewLayout'
import { removeManualLayoutV1 } from './removeManualLayoutV1'

const logger = mainLogger.getChild('model-changes')

export class LikeC4ModelChanges {
  private locator: LikeC4ModelLocator

  constructor(private services: LikeC4Services) {
    this.locator = services.likec4.ModelLocator
  }

  public async applyChange(
    changeView: ChangeView.Params,
  ): Promise<ChangeView.Res> {
    const lspConnection = this.services.shared.lsp.Connection
    const workspace = this.services.shared.workspace
    try {
      let { viewId, projectId: _projectId, change } = changeView
      const project = workspace.ProjectsManager.ensureProject(_projectId as ProjectId)
      logger.debug`Applying model change ${change.op} to view ${viewId} in project ${project.id}`

      const lookup = this.locator.locateViewAst(viewId, project.id)
      if (!lookup) {
        throw new Error(`View ${viewId} not found in project ${project.id}`)
      }
      const textDocument = {
        uri: lookup.doc.textDocument.uri,
        version: lookup.doc.textDocument.version,
      }

      // TODO refactor to use separate methods for save/reset operations
      if (change.op === 'save-view-snapshot') {
        invariant(
          viewId === change.layout.id,
          'View ID does not match, expected ' + viewId + ', got ' + change.layout.id,
        )
        // If there is an existing manual layout v1
        if (lookup.view.manualLayout && lspConnection) {
          // We clean it up
          await removeManualLayoutV1(this.services, { lookup }).catch(err => {
            logger.warn(`Failed to remove manual layout v1 for view ${viewId} in project ${project.id}`, { err })
          })
        }
        const location = await workspace.ManualLayouts.write(project, change.layout)
        return {
          success: true,
          location,
        }
      }

      if (change.op === 'reset-manual-layout') {
        // If there is an existing manual layout v1
        if (lookup.view.manualLayout) {
          // We clean it up
          await removeManualLayoutV1(this.services, { lookup }).catch(err => {
            logger.warn(`Failed to remove manual layout v1 for view ${viewId} in project ${project.id}`, { err })
          })
        }
        const location = await workspace.ManualLayouts.remove(project, viewId)
        return {
          success: true,
          location,
        }
      }

      invariant(lspConnection, 'This change only supported in IDE (running as Extension)')

      const { edits, modifiedRange } = this.convertToTextEdit({
        lookup,
        change,
      })
      if (!edits.length) {
        return {
          success: false,
          error: 'No changes to apply',
        }
      }
      const applyResult = await lspConnection.workspace.applyEdit({
        label: `LikeC4 - change view ${changeView.viewId}`,
        edit: {
          changes: {
            [textDocument.uri]: edits,
          },
        },
      })
      if (!applyResult.applied) {
        lspConnection.window.showErrorMessage(`Failed to apply changes ${applyResult.failureReason}`)
        return {
          success: false,
          error: `Failed to apply changes ${applyResult.failureReason}`,
        }
      }

      return {
        success: true,
        location: {
          uri: textDocument.uri,
          range: modifiedRange,
        },
      }
    } catch (err) {
      const error = loggable(
        wrapError(
          err,
          `Failed to apply change ${changeView.change.op} ${changeView.viewId}`,
        ),
      )
      logger.error(error)
      return {
        success: false,
        error,
      }
    } finally {
      this.services.likec4.ModelBuilder.clearCache()
    }
  }

  protected convertToTextEdit({ lookup, change }: {
    lookup: ViewLocateResult
    change: Exclude<ViewChange, ViewChange.SaveViewSnapshot | ViewChange.ResetManualLayout>
  }): {
    modifiedRange: Range
    edits: TextEdit[]
  } {
    switch (change.op) {
      case 'change-element-style': {
        return changeElementStyle(this.services, {
          ...lookup,
          targets: change.targets,
          style: change.style,
        })
      }
      case 'change-autolayout': {
        const edit = changeViewLayout(this.services, {
          ...lookup,
          layout: change.layout,
        })
        return {
          modifiedRange: edit.range,
          edits: [edit],
        }
      }
      default:
        nonexhaustive(change)
    }
  }
}
