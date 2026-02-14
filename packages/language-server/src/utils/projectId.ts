import { type ProjectId, invariant } from '@likec4/core'
import { type AstNode, type LangiumDocument, AstUtils, isAstNode } from 'langium'
import { ast } from '../ast'
import { logger } from '../logger'
import { ProjectsManager } from '../workspace'

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
