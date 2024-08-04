import { invariant, nonexhaustive } from '@likec4/core'
import { Location, Range, TextEdit } from 'vscode-languageserver-protocol'
import { type ParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4ModelLocator } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeViewRequestParams } from '../protocol'
import { changeElementStyle } from './changeElementStyle'
import { changeViewLayout } from './changeViewLayout'
import { saveManualLayout } from './saveManualLayout'

// function unionRangeOfAllEdits(ranges: Range[]): Range {
//   let startLine = Number.MAX_SAFE_INTEGER
//   let endLine = Number.MIN_SAFE_INTEGER

//   let startCharacter = Number.MAX_SAFE_INTEGER
//   let endCharacter = Number.MIN_SAFE_INTEGER

//   for (const { start, end } of ranges) {
//     if (start.line <= startLine) {
//       if (startLine == start.line) {
//         startCharacter = Math.min(start.character, startCharacter)
//       } else {
//         startLine = start.line
//         startCharacter = start.character
//       }
//     }
//     if (endLine <= end.line) {
//       if (endLine == end.line) {
//         endCharacter = Math.max(end.character, endCharacter)
//       } else {
//         endLine = end.line
//         endCharacter = end.character
//       }
//     }
//   }
//   return Range.create(startLine, startCharacter, endLine, endCharacter)
// }

export class LikeC4ModelChanges {
  private locator: LikeC4ModelLocator

  constructor(private services: LikeC4Services) {
    this.locator = services.likec4.ModelLocator
  }

  public async applyChange(changeView: ChangeViewRequestParams): Promise<Location | null> {
    const lspConnection = this.services.shared.lsp.Connection
    invariant(lspConnection, 'LSP Connection not available')
    let result: Location | null = null
    await this.services.shared.workspace.WorkspaceLock.write(async () => {
      const { doc, edits, modifiedRange } = this.convertToTextEdit(changeView)
      const textDocument = {
        uri: doc.textDocument.uri,
        version: doc.textDocument.version
      }
      if (!edits.length) {
        return
      }
      const applyResult = await lspConnection.workspace.applyEdit({
        label: `LikeC4 - change view ${changeView.viewId}`,
        edit: {
          changes: {
            [textDocument.uri]: edits
          }
        }
      })
      if (!applyResult.applied) {
        lspConnection.window.showErrorMessage(`Failed to apply changes ${applyResult.failureReason}`)
        return
      }
      result = {
        uri: textDocument.uri,
        range: modifiedRange
      }
    })
    return result
  }

  protected convertToTextEdit({ viewId, change }: ChangeViewRequestParams): {
    doc: ParsedLikeC4LangiumDocument
    modifiedRange: Range
    edits: TextEdit[]
  } {
    const lookup = this.locator.locateViewAst(viewId)
    if (!lookup) {
      throw new Error(`View not found: ${viewId}`)
    }
    switch (change.op) {
      case 'change-element-style': {
        return {
          doc: lookup.doc,
          ...changeElementStyle(this.services, {
            ...lookup,
            targets: change.targets,
            style: change.style
          })
        }
      }
      case 'change-autolayout': {
        const edit = changeViewLayout(this.services, {
          ...lookup,
          layout: change.layout
        })
        return {
          doc: lookup.doc,
          modifiedRange: edit.range,
          edits: [edit]
        }
      }
      case 'save-manual-layout':
        const edit = saveManualLayout(this.services, {
          ...lookup,
          layout: change.layout
        })
        return {
          doc: lookup.doc,
          modifiedRange: edit.range,
          edits: [edit]
        }
      default:
        nonexhaustive(change)
    }
  }
}
