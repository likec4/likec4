import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
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

export const iconPropertyRuleChecks = (
  _: LikeC4Services
): ValidationCheck<ast.IconProperty> => {
  return (node, accept) => {
    const container = node.$container
    const anotherIcon = container.props.some(p => ast.isIconProperty(p) && p !== node)
    if (anotherIcon) {
      accept('error', `Icon must be defined once`, {
        node
      })
    }
    if (
      ast.isStyleProperties(container) && ast.isElementBody(container.$container)
      && container.$container.props.some(p => ast.isIconProperty(p))
    ) {
      accept('warning', `Redundant as icon defined on element`, {
        node
      })
    }
  }
}
