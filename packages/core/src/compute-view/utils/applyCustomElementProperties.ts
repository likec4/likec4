import { isEmpty, isNullish, omitBy } from 'remeda'
import {
  type AnyAux,
  type ComputedNode,
  type ElementViewRule,
  type ModelExpression,
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
      ...rest
    } = omitBy(props, isNullish)
    const notEmpty = !isEmpty(rest)
    const satisfies = elementExprToPredicate(expr)
    nodes.forEach((node, i) => {
      if (isGroupElementKind(node) || !satisfies(node)) {
        return
      }
      if (notEmpty) {
        node = {
          ...node,
          isCustomized: true,
          ...rest,
        }
      }

      let styleOverride: ComputedNode['style'] | undefined
      if (border !== undefined) {
        styleOverride = { border }
      }
      if (opacity !== undefined) {
        styleOverride = { ...styleOverride, opacity }
      }
      if (multiple !== undefined) {
        styleOverride = { ...styleOverride, multiple }
      }
      if (padding !== undefined) {
        styleOverride = { ...styleOverride, padding }
      }
      if (size !== undefined) {
        styleOverride = { ...styleOverride, size }
      }
      if (textSize !== undefined) {
        styleOverride = { ...styleOverride, textSize }
      }
      if (styleOverride) {
        node = {
          ...node,
          isCustomized: true,
          style: {
            ...node.style,
            ...styleOverride,
          },
        }
      }
      nodes[i] = node
    })
  }
  return nodes
}
