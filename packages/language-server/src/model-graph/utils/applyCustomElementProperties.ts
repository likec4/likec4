import type { ComputedNode, ViewRule } from '@likec4/core'
import { Expr, nonNullable } from '@likec4/core'
import { isEmpty, isNonNullish, pickBy } from 'remeda'
import { elementExprToPredicate } from './elementExpressionToPredicate'

export function applyCustomElementProperties(_rules: ViewRule[], _nodes: ComputedNode[]) {
  const rules = _rules.flatMap(r => ('include' in r ? r.include.filter(Expr.isCustomElement) : []))
  if (rules.length === 0) {
    return _nodes
  }
  const nodes = [..._nodes]
  for (
    const {
      custom: { expr, ...props }
    } of rules
  ) {
    const satisfies = elementExprToPredicate(expr)
    nodes.forEach((node, i) => {
      if (!satisfies(node)) {
        return
      }

      const { border, opacity, ...rest } = pickBy(props, isNonNullish)
      if (!isEmpty(rest)) {
        node = {
          ...node,
          isCustomized: true,
          ...rest
        }
      }

      let styleOverride: ComputedNode['style'] | undefined
      if (border !== undefined) {
        styleOverride = { border }
      }
      if (opacity !== undefined) {
        styleOverride = { ...styleOverride, opacity }
      }
      if (styleOverride) {
        node = {
          ...node,
          isCustomized: true,
          style: {
            ...node.style,
            ...styleOverride
          }
        }
      }
      nodes[i] = node
    })
  }
  return nodes
}
