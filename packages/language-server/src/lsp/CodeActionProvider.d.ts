import type { LangiumDocument } from 'langium';
import type { CodeActionProvider } from 'langium/lsp';
import { type CodeActionParams, CodeAction, Command } from 'vscode-languageserver-protocol';
type CommandOrCodeAction = Command | CodeAction;
export declare class LikeC4CodeActionProvider implements CodeActionProvider {
    /**
     * Handle a code action request.
     *
     * @throws `OperationCancelled` if cancellation is detected during execution
     * @throws `ResponseError` if an error is detected that should be sent as response to the client
     */
    getCodeActions(document: LangiumDocument, params: CodeActionParams): CommandOrCodeAction[] | undefined;
}
export {};
