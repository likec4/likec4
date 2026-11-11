import { type ProjectId, invariant } from '@likec4/core'
import { type AstNode, type LangiumDocument, AstUtils, isAstNode } from 'langium'
import { ast } from '../ast'
import { logger } from '../logger'
import { ProjectsManager } from '../workspace'

/**
 * Resolve ProjectId from an AST node, document, or import node.
 * For Imported nodes walks up to ImportsFromPoject; for documents uses likec4ProjectId or default.
 *
 * For import nodes returns the import name as written in `from '…'`:
 * this is the project id used in the consumer model (key of `imports`, `@name.` prefix),
 * not the id of the imported project. To get the imported project, resolve the name
 * with `DependencyResolver` in the context of the consumer project (`projectIdFrom(document)`).
 *
 * @param value - AST node, Langium document, or import-related node
 * @returns Resolved project ID (or DefaultProjectId when document has none)
 */
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
  if (!doc.likec4ProjectId) {
    logger.warn`Document ${doc.uri.fsPath} does not have a project ID assigned, this may lead to unexpected behavior.`
    return ProjectsManager.DefaultProjectId
  }
  return doc.likec4ProjectId
}
