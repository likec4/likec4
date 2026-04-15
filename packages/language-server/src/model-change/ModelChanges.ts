import { type ProjectId, type ViewChange, invariant, nonexhaustive } from '@likec4/core'
import { loggable, wrapError } from '@likec4/log'
import { TextDocument } from 'langium'
import { Range, TextEdit } from 'vscode-languageserver-types'
import type { ParsedLikeC4LangiumDocument } from '../ast'
import { logger as mainLogger } from '../logger'
import type { LikeC4ModelLocator, ViewLocateResult } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'
import { changeElementStyle } from './changeElementStyle'
import { changeViewLayout } from './changeViewLayout'

const logger = mainLogger.getChild('model-changes')

export class LikeC4ModelChanges {
  private locator: LikeC4ModelLocator

  constructor(private services: LikeC4Services) {
    this.locator = services.likec4.ModelLocator
  }

  public async applyChange(changeView: ChangeView.Params): Promise<ChangeView.Res> {
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
        const location = await workspace.ManualLayouts.write(project, change.layout)
        return {
          success: true,
          location,
        }
      }

      if (change.op === 'reset-manual-layout') {
        const location = await workspace.ManualLayouts.remove(project, viewId)
        return {
          success: true,
          location,
        }
      }

      // Convert the view change to text edits
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

      // Apply the text edits to the document
      const applyResult = await this.applyTextEdits(lookup.doc, edits)
      if (!applyResult) {
        return {
          success: false,
          error: `Failed to apply changes`,
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
      logger.warn(error)
      return {
        success: false,
        error,
      }
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

  protected async applyTextEdits(doc: ParsedLikeC4LangiumDocument, edits: TextEdit[]): Promise<boolean> {
    const lsp = this.services.shared.lsp.Connection
    const workspace = this.services.shared.workspace
    if (!lsp) {
      // fallback to direct text document edit if LSP connection is not available (e.g. wdhen running in MCP/CLI)
      const updateTextDocument = TextDocument.applyEdits(doc.textDocument, edits)
      await workspace.FileSystemProvider.writeFile(doc.uri, updateTextDocument)
      return true
    }
    const applyResult = await lsp.workspace.applyEdit({
      label: `LikeC4 - change view`,
      edit: {
        changes: {
          [doc.textDocument.uri]: edits,
        },
      },
    })
    if (!applyResult.applied) {
      logger.warn`Failed to apply text edits to document ${doc.textDocument.uri}: ${applyResult.failureReason}`
      lsp.window.showErrorMessage(`Failed to apply changes: ${applyResult.failureReason}`)
      return false
    }
    await workspace.DocumentBuilder.update([doc.uri], [])
    return applyResult.applied
  }
}
