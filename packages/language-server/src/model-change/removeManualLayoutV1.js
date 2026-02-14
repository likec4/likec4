import { invariant } from '@likec4/core';
import { CstUtils } from 'langium';
import { TextEdit } from 'vscode-languageserver-types';
import { hasManualLayout } from '../view-utils/manual-layout';
export async function removeManualLayoutV1(services, { lookup, }) {
    // No manual layout v1 present
    if (!lookup.view.manualLayout) {
        return false;
    }
    const cstnode = lookup.viewAst.$cstNode;
    invariant(cstnode, 'invalid view.$cstNode');
    const lspConnection = services.shared.lsp.Connection;
    invariant(lspConnection, 'LSP Connection not available');
    const commentCst = CstUtils.findCommentNode(cstnode, ['BLOCK_COMMENT']);
    if (commentCst && hasManualLayout(commentCst.text)) {
        const edit = await lspConnection.workspace.applyEdit({
            label: `LikeC4 - remove manual layout v1 for ${lookup.view.id}`,
            edit: {
                changes: {
                    [lookup.doc.textDocument.uri]: [TextEdit.del(commentCst.range)],
                },
            },
        });
        return edit.applied;
    }
    return false;
}
