import type { ValidationCheck } from 'langium'
import type { LikeC4Services } from '../../module'
import { ast, getViewRulePredicateContainer } from '../../ast'
import { tryOrLog } from '../_shared'

export const checkRelationExprWith = (
  _services: LikeC4Services,
): ValidationCheck<ast.RelationExprWith> => {
  return tryOrLog((el, accept) => {
    const container = getViewRulePredicateContainer(el)
    if (!container || container.$type == 'DynamicViewIncludePredicate') {
      return
    }
    if (!container.isInclude) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el,
      })
      return
    }
  })
}
