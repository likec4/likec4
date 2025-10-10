import { type ProjectId, type ViewChange, type ViewId, invariant, nonexhaustive } from '@likec4/core'
import { logger } from '@likec4/log'
import { Location, Range, TextEdit } from 'vscode-languageserver-types'
import type { ParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4ModelLocator } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'
import { changeElementStyle } from './changeElementStyle'
import { changeViewLayout } from './changeViewLayout'
import { saveManualLayout } from './saveManualLayout'

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
        let { viewId, projectId: projectId_, change } = changeView
        if (change.op === 'save-view-snapshot') {
          invariant(viewId === change.layout.id, 'View ID does not match')
          const project = this.services.shared.workspace.ProjectsManager.ensureProject(projectId_ as ProjectId)
          result = await this.services.likec4.ManualLayouts.write(project, change.layout)
          return
        }
        const projectId = this.services.shared.workspace.ProjectsManager.ensureProjectId(projectId_ as ProjectId)
        const { doc, edits, modifiedRange } = this.convertToTextEdit({
          viewId,
          projectId,
          change,
        })
        const textDocument = {
          uri: doc.textDocument.uri,
          version: doc.textDocument.version,
        }
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

  protected convertToTextEdit({ viewId, projectId, change }: {
    viewId: ViewId
    projectId: ProjectId
    change: Exclude<ViewChange, ViewChange.SaveViewSnapshot>
  }): {
    doc: ParsedLikeC4LangiumDocument
    modifiedRange: Range
    edits: TextEdit[]
  } {
    const lookup = this.locator.locateViewAst(viewId, projectId)
    if (!lookup) {
      throw new Error(`LikeC4ModelChanges: view not found: ${viewId}`)
    }
    switch (change.op) {
      case 'change-element-style': {
        return {
          doc: lookup.doc,
          ...changeElementStyle(this.services, {
            ...lookup,
            targets: change.targets,
            style: change.style,
          }),
        }
      }
      case 'change-autolayout': {
        const edit = changeViewLayout(this.services, {
          ...lookup,
          layout: change.layout,
        })
        return {
          doc: lookup.doc,
          modifiedRange: edit.range,
          edits: [edit],
        }
      }
      case 'save-manual-layout':
        const edit = saveManualLayout(this.services, {
          ...lookup,
          layout: change.layout,
        })
        return {
          doc: lookup.doc,
          modifiedRange: edit.range,
          edits: [edit],
        }
      default:
        nonexhaustive(change)
    }
  }
}
