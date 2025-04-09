import { type ProjectId, invariant, nonNullable } from '@likec4/core'
import { type AstNode, type LangiumDocument, AstUtils, isAstNode } from 'langium'
import { ast } from '../ast'

export function projectIdFrom(value: AstNode | LangiumDocument | ast.ImportsFromPoject | ast.Imported): ProjectId {
  if (ast.isImported(value)) {
    while (value.$type === 'Imported' && value.$container) {
      value = value.$container
    }
    invariant(ast.isImportsFromPoject(value))
  }
  if (ast.isImportsFromPoject(value)) {
    return value.project as ProjectId
  }
  const doc = isAstNode(value) ? AstUtils.getDocument(value) : value
  return nonNullable(doc.likec4ProjectId, () => `Invalid state, document ${doc.uri} has no project ID assigned`)
}
