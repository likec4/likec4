import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const expandElementExprChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.ExpandElementExpression> => {
  return tryOrLog((el, accept) => {
    if (AstUtils.hasContainerOfType(el, ast.isRelationExpression)) {
      accept('warning', `Redundant usage, expand predicate resolves parent element only when used in relations`, {
        node: el,
      })
    }
  })
}
