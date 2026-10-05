import type { LangiumDocument, MaybePromise } from 'langium'
import { AstUtils, CstUtils } from 'langium'
import type { CodeActionProvider } from 'langium/lsp'
import { dedent } from 'strip-indent'
import {
  type CancellationToken,
  type CodeActionParams,
  CodeAction,
  CodeActionKind,
  CodeActionTriggerKind,
  Command,
  TextEdit,
} from 'vscode-languageserver-protocol'
import { ast } from '../ast'
import { clientPreviewsRemovalImpact } from '../model-diff'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { LikeC4Commands } from './ExecuteCommandHandler'

type CommandOrCodeAction = Command | CodeAction

function refactor(title: string, command: Command): CodeAction {
  return CodeAction.create(title, command, CodeActionKind.Refactor)
}

const { findLeafNodeAtOffset, getStartlineNode } = CstUtils

export class LikeC4CodeActionProvider implements CodeActionProvider {
  constructor(private services: LikeC4Services) {}

  /**
   * Offers safe delete on element headers, apply or discard on diff headers,
   * and conversion of a plain string to Markdown.
   * The removal impact preview is offered only to clients that show it.
   *
   * @throws `OperationCancelled` if cancellation is detected during execution
   * @throws `ResponseError` if an error is detected that should be sent as response to the client
   */
  getCodeActions(
    document: LangiumDocument,
    params: CodeActionParams,
    _cancelToken?: CancellationToken,
  ): MaybePromise<CommandOrCodeAction[] | undefined> {
    const root = document.parseResult.value.$cstNode
    if (!root) {
      return undefined
    }
    const startOffset = document.textDocument.offsetAt(params.range.start)
    const node = findLeafNodeAtOffset(root, startOffset)?.astNode
    const projectId = projectIdFrom(document)

    if (ast.isElement(node) && !AstUtils.hasContainerOfType(node, ast.isModelDiff)) {
      const fqn = this.services.likec4.FqnIndex.getFqn(node)
      const preview = refactor(
        `Preview removal impact of '${fqn}'`,
        Command.create('Preview removal impact', LikeC4Commands.PreviewRemovalImpact, projectId, fqn),
      )
      return [
        ...(clientPreviewsRemovalImpact(this.services.shared) ? [preview] : []),
        refactor(`Safe delete '${fqn}'`, Command.create('Safe delete', LikeC4Commands.SafeDelete, projectId, fqn)),
      ]
    }

    if (ast.isModelDiff(node)) {
      return [
        refactor(
          `Apply diff '${node.name}' to the model`,
          Command.create('Apply diff', LikeC4Commands.ApplyDiff, projectId, node.name),
        ),
        refactor(
          `Discard diff '${node.name}'`,
          Command.create('Discard diff', LikeC4Commands.DiscardDiff, projectId, node.name),
        ),
      ]
    }

    if (params.context.triggerKind !== CodeActionTriggerKind.Invoked) {
      return undefined
    }
    const endOffset = document.textDocument.offsetAt(params.range.end)
    const selectedNode = findLeafNodeAtOffset(root, endOffset)
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
