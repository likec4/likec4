import { invariant, nonNullable } from '@likec4/core';
import { AstUtils, isAstNode } from 'langium';
import { ast } from '../ast';
export function projectIdFrom(value) {
    if (ast.isImported(value)) {
        while (value.$type === 'Imported' && value.$container) {
            value = value.$container;
        }
        invariant(ast.isImportsFromPoject(value));
    }
    if (ast.isImportsFromPoject(value)) {
        return value.project;
    }
    const doc = isAstNode(value) ? AstUtils.getDocument(value) : value;
    return nonNullable(doc.likec4ProjectId, () => `Invalid state, document ${doc.uri.fsPath} has no project ID assigned`);
}
