import { isEmpty, isNullish, omitBy } from 'remeda'
import {
  type AnyAux,
  type ComputedNode,
  type ComputedNodeStyle,
  type ElementViewRule,
  type ModelExpression,
  exact,
  isGroupElementKind,
  isViewRuleGroup,
  isViewRulePredicate,
  ModelFqnExpr,
} from '../../types'
import { elementExprToPredicate } from './elementExpressionToPredicate'

export function flattenGroupRules<A extends AnyAux, T extends ModelExpression<A>>(
  guard: (expr: ModelExpression<A>) => expr is T,
) {
  return (rule: ElementViewRule<A>): Array<T> => {
    if (isViewRuleGroup(rule)) {
      return rule.groupRules.flatMap(flattenGroupRules(guard))
    }
    if (isViewRulePredicate(rule)) {
      return 'include' in rule ? rule.include.filter(guard) : []
    }

    return []
  }
}

export function applyCustomElementProperties<A extends AnyAux>(
  _rules: ElementViewRule<A>[],
  _nodes: ComputedNode<A>[],
) {
  const rules = _rules.flatMap(flattenGroupRules(ModelFqnExpr.isCustom))
  if (rules.length === 0) {
    return _nodes
  }
  const nodes = [..._nodes]
  for (
    const {
      custom: { expr, ...props },
    } of rules
  ) {
    const {
      border,
      opacity,
      multiple,
      padding,
      size,
      textSize,
      description,
      ...rest
    } = omitBy(props, isNullish)
    const style: ComputedNodeStyle = exact({
      border,
      opacity,
      multiple,
      padding,
      size,
      textSize,
    })
    const styleNotEmpty = !isEmpty(style)
    const propsNotEmpty = !isEmpty(rest)
    const satisfies = elementExprToPredicate(expr)
    nodes.forEach((node, i) => {
      if (isGroupElementKind(node) || !satisfies(node)) {
        return
      }
      if (propsNotEmpty) {
        node = {
          ...node,
          isCustomized: true,
          ...rest,
        }
      }
      if (description !== undefined) {
        node = {
          ...node,
          isCustomized: true,
          description,
        }
      }
      if (styleNotEmpty) {
        node = {
          ...node,
          isCustomized: true,
          style: {
            ...node.style,
            ...style,
          },
        }
      }
      nodes[i] = node
    })
  }
  return nodes
}
