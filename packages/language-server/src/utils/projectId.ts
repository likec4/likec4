import { type ProjectId, invariant } from '@likec4/core'
import { type AstNode, type LangiumDocument, AstUtils, isAstNode } from 'langium'
import { ast } from '../ast'
import { logger } from '../logger'
import { ProjectsManager } from '../workspace'

/**
 * Resolve ProjectId from an AST node, document, or import node.
 * For Imported nodes walks up to ImportsFromProject; for documents uses likec4ProjectId or default.
 * @param value - AST node, Langium document, or import-related node
 * @returns Resolved project ID (or DefaultProjectId when document has none)
 */
export function projectIdFrom(value: AstNode | LangiumDocument | ast.ImportsFromProject | ast.Imported): ProjectId {
  if (ast.isImported(value)) {
    while (value.$type === 'Imported' && value.$container) {
      value = value.$container
    }
    invariant(ast.isImportsFromProject(value))
  }
  if (ast.isImportsFromProject(value)) {
    return value.project as ProjectId
  }
  const doc = isAstNode(value) ? AstUtils.getDocument(value) : value
  if (!doc.likec4ProjectId) {
    logger.warn`Document ${doc.uri.fsPath} does not have a project ID assigned, this may lead to unexpected behavior.`
    return ProjectsManager.DefaultProjectId
  }
  return doc.likec4ProjectId
}
