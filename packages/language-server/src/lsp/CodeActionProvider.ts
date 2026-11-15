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
import { InstallDependencies } from '../protocol'
import { projectIdFrom } from '../utils'
import { DependencyDiagnosticCodes, isDependencyDiagnosticData } from '../validation/imports'
import { LikeC4Commands } from './ExecuteCommandHandler'

type CommandOrCodeAction = Command | CodeAction

function refactor(title: string, command: Command): CodeAction {
  return CodeAction.create(title, command, CodeActionKind.Refactor)
}

const { findLeafNodeAtOffset, getStartlineNode } = CstUtils

export class LikeC4CodeActionProvider implements CodeActionProvider {
  constructor(private services: LikeC4Services) {}

  /**
   * Offers the install of a git dependency on its "not installed" diagnostic (quick fix),
   * safe delete on element headers, apply or discard on diff headers,
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
    // Documents of external projects (dependencies) are read-only: no refactorings
    if (this.services.shared.workspace.ProjectsLookup.isExternalDocument(document)) {
      return undefined
    }
    const quickFixes = this.installDependencyQuickFixes(document, params)
    const actions = this.refactorings(document, params)
    if (quickFixes.length === 0) {
      return actions
    }
    return [...quickFixes, ...(actions ?? [])]
  }

  /**
   * Quick fixes for `likec4-dependency-not-installed` diagnostics: run the install command of the server
   */
  protected installDependencyQuickFixes(document: LangiumDocument, params: CodeActionParams): CodeAction[] {
    const fixes = [] as CodeAction[]
    // The client may ask only for some kinds of actions (`quickfix` covers `quickfix.*`, as in the LSP spec)
    const only = params.context.only
    if (only && !only.some(kind => kind === CodeActionKind.QuickFix || kind === CodeActionKind.Empty)) {
      return fixes
    }
    for (const diagnostic of params.context.diagnostics) {
      if (diagnostic.code !== DependencyDiagnosticCodes.NotInstalled) {
        continue
      }
      // Data of the diagnostic, or the import at the diagnostic (if the client did not keep the data)
      let args: InstallDependencies.Params | undefined
      if (isDependencyDiagnosticData(diagnostic.data)) {
        args = { projectId: diagnostic.data.projectId, name: diagnostic.data.name }
      } else {
        const root = document.parseResult.value.$cstNode
        const offset = document.textDocument.offsetAt(diagnostic.range.start)
        const node = root ? findLeafNodeAtOffset(root, offset)?.astNode : undefined
        const imports = node ? AstUtils.getContainerOfType(node, ast.isImportsFromPoject) : undefined
        if (imports) {
          args = { projectId: projectIdFrom(document), name: imports.project }
        }
      }
      if (!args) {
        continue
      }
      const action = CodeAction.create(
        `Install dependency '${args.name}'`,
        Command.create(`Install dependency '${args.name}'`, InstallDependencies.command, args),
        CodeActionKind.QuickFix,
      )
      action.diagnostics = [diagnostic]
      action.isPreferred = true
      fixes.push(action)
    }
    return fixes
  }

  protected refactorings(
    document: LangiumDocument,
    params: CodeActionParams,
  ): CommandOrCodeAction[] | undefined {
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
