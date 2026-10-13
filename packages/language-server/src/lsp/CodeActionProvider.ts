import type { LangiumDocument, MaybePromise } from 'langium'
import { CstUtils } from 'langium'
import type { CodeActionProvider } from 'langium/lsp'
import { dedent } from 'strip-indent'
import {
  type CancellationToken,
  type CodeActionParams,
  type Command,
  CodeAction,
  CodeActionKind,
  CodeActionTriggerKind,
  TextEdit,
} from 'vscode-languageserver-protocol'
import { ast } from '../ast'

type CommandOrCodeAction = Command | CodeAction

const { findLeafNodeAtOffset, getStartlineNode } = CstUtils

export class LikeC4CodeActionProvider implements CodeActionProvider {
  /**
   * Handle a code action request.
   *
   * @throws `OperationCancelled` if cancellation is detected during execution
   * @throws `ResponseError` if an error is detected that should be sent as response to the client
   */
  getCodeActions(
    document: LangiumDocument,
    params: CodeActionParams,
    _cancelToken?: CancellationToken,
  ): MaybePromise<CommandOrCodeAction[] | undefined> {
    const rootNode = document.parseResult.value.$cstNode
    if (!rootNode || params.context.triggerKind !== CodeActionTriggerKind.Invoked) {
      return undefined
    }
    const offset = document.textDocument.offsetAt(params.range.end)
    const selectedNode = findLeafNodeAtOffset(rootNode, offset)
    if (!selectedNode || selectedNode.hidden || !ast.isMarkdownOrString(selectedNode.astNode)) {
      return undefined
    }
    const astNode = selectedNode.astNode
    if (astNode.text !== undefined) {
      const startLine = getStartlineNode(selectedNode)
      const indent = ' '.repeat(startLine.range.start.character)

      const quotes = selectedNode.text.slice(0, 1).repeat(3)
      const lines = dedent(astNode.text).split('\n').map(line => indent + '  ' + line)
      return [
        CodeAction.create(
          'Convert to Markdown',
          {
            changes: {
              [document.textDocument.uri]: [
                TextEdit.replace(
                  selectedNode.range,
                  [
                    quotes,
                    ...lines,
                    indent + quotes,
                  ].join('\n'),
                ),
              ],
            },
          },
          CodeActionKind.QuickFix,
        ),
      ]
    }
    return []
  }
}
