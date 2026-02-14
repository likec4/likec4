import { Command, TextEdit, } from 'vscode-languageserver-protocol';
export class LikeC4CodeActionProvider {
    /**
     * Handle a code action request.
     *
     * @throws `OperationCancelled` if cancellation is detected during execution
     * @throws `ResponseError` if an error is detected that should be sent as response to the client
     */
    getCodeActions(document, params) {
        const diagnostics = params.context.diagnostics;
        const actions = [];
        for (const diagnostic of diagnostics) {
            if (diagnostic.code === 'manual-layout-v1') {
                actions.push({
                    title: 'Migrate Manual Layouts',
                    command: Command.create('Migrate Manual Layouts', 'likec4.migrate-manual-layouts'),
                    edit: {
                        changes: {
                            // This is a dummy edit to make VSCode accept the code action as a quick fix.
                            [document.textDocument.uri]: [TextEdit.insert(params.range.start, '')],
                        },
                    },
                    kind: 'quickfix',
                    isPreferred: true,
                    diagnostics: [
                        diagnostic,
                    ],
                });
            }
        }
        return actions.length > 0 ? actions : undefined;
    }
}
