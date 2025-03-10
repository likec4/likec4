import { type ProjectId, nonNullable } from '@likec4/core'
import { type AstNode, type LangiumDocument, AstUtils, isAstNode } from 'langium'

export function projectIdFrom(value: AstNode | LangiumDocument): ProjectId {
  const doc = isAstNode(value) ? AstUtils.getDocument(value) : value
  return nonNullable(doc.likec4ProjectId, () => `Invalid state, document ${doc.uri} has no project ID assigned`)
}
