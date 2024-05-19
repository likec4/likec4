import type { ValidationCheck } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'

export const opacityPropertyRuleChecks = (
  _: LikeC4Services
): ValidationCheck<ast.OpacityProperty> => {
  return (node, accept) => {
    const opacity = parseFloat(node.value)
    if (isNaN(opacity) || opacity < 0 || opacity > 100) {
      accept('warning', `Value ignored, must be between 0% and 100%`, {
        node,
        property: 'value'
      })
    }
  }
}
