import { nonexhaustive } from '@likec4/core'
import { type AstNode, AstUtils, type ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const expandElementExprChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.ExpandElementExpression> => {
  return (el, accept) => {
    const isInside = <T extends AstNode>(typePredicate: (n: AstNode) => n is T): boolean =>
      !!AstUtils.getContainerOfType(el, typePredicate)
    if (isInside(ast.isRelationExpression)) {
      accept('warning', `Redundant usage, expand predicate resolves parent element only when used in relations`, {
        node: el
      })
    }
    if (isInside(ast.isExcludePredicate)) {
      accept('warning', `Expand predicate is ignored in exclude`, {
        node: el
      })
    }
  }
}
