import { type ProjectId, type ViewChange, invariant, nonexhaustive } from '@likec4/core'
import { Location, Range, TextEdit } from 'vscode-languageserver-types'
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

  public async applyChange(changeView: ChangeView.Params): Promise<Location | null> {
    const lspConnection = this.services.shared.lsp.Connection
    invariant(lspConnection, 'LSP Connection not available')
    let result: Location | null = null
    try {
      await this.services.shared.workspace.WorkspaceLock.write(async () => {
        let { viewId, projectId: _projectId, change } = changeView
        const project = this.services.shared.workspace.ProjectsManager.ensureProject(_projectId as ProjectId)
        logger.debug`Applying model change ${change.op} to view ${viewId} in project ${project.id}`

        const lookup = this.locator.locateViewAst(viewId, project.id)
        if (!lookup) {
          throw new Error(`LikeC4ModelChanges: view not found: ${viewId}`)
        }
        const textDocument = {
          uri: lookup.doc.textDocument.uri,
          version: lookup.doc.textDocument.version,
        }

        // TODO refactor to use separate methods for save/reset operations
        if (change.op === 'save-view-snapshot') {
          invariant(viewId === change.layout.id, 'View ID does not match')
          // If there is an existing manual layout v1
          if (lookup.view.manualLayout) {
            // We clean it up
            await removeManualLayoutV1(this.services, { lookup }).catch(err => {
              logger.warn(`Failed to remove manual layout v1 for view ${viewId} in project ${project.id}`, { err })
            })
          }
          result = await this.services.likec4.ManualLayouts.write(project, change.layout)
          return
        }

        if (change.op === 'reset-manual-layout') {
          result = await this.services.likec4.ManualLayouts.remove(project, viewId)
          return
        }

        const { edits, modifiedRange } = this.convertToTextEdit({
          lookup,
          change,
        })
        if (!edits.length) {
          return
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
          return
        }
        result = {
          uri: textDocument.uri,
          range: modifiedRange,
        }
      })
    } catch (error) {
      logger.error(`Failed to apply change ${changeView.change.op} ${changeView.viewId}`, { error })
    }
    return result
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
