import { isEmpty, isNullish, omitBy } from 'remeda'
import { type ViewRule, ComputedNode, isCustomElement, isViewRuleGroup, isViewRulePredicate } from '../../types'
import type { Expression } from '../../types/expression'
import { elementExprToPredicate } from './elementExpressionToPredicate'

export function flattenGroupRules<T extends Expression>(guard: (expr: Expression) => expr is T) {
  return (rule: ViewRule): Array<T> => {
    if (isViewRuleGroup(rule)) {
      return rule.groupRules.flatMap(flattenGroupRules(guard))
    }
    if (isViewRulePredicate(rule)) {
      return 'include' in rule ? rule.include.filter(guard) : []
    }

    return []
  }
}

export function applyCustomElementProperties(_rules: ViewRule[], _nodes: ComputedNode[]) {
  const rules = _rules.flatMap(flattenGroupRules(isCustomElement))
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
      if (ComputedNode.isNodesGroup(node) || !satisfies(node)) {
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
