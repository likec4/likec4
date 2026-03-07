import type { LangiumDocument } from 'langium'
import type { CodeActionProvider } from 'langium/lsp'
import {
  type CodeActionParams,
  type Command,
  CodeAction,
} from 'vscode-languageserver-protocol'

type CommandOrCodeAction = Command | CodeAction

export class LikeC4CodeActionProvider implements CodeActionProvider {
  /**
   * Handle a code action request.
   *
   * @throws `OperationCancelled` if cancellation is detected during execution
   * @throws `ResponseError` if an error is detected that should be sent as response to the client
   */
  getCodeActions(
    _document: LangiumDocument,
    _params: CodeActionParams,
  ): CommandOrCodeAction[] | undefined {
    return undefined
  }
}
