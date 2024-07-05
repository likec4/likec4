import type { ComputedNode, ViewRule } from '@likec4/core'
import { Expr, nonNullable } from '@likec4/core'
import { isDefined, isEmpty, isNonNullish, isNullish as isNil, isTruthy, omitBy, pickBy } from 'remeda'

export function applyElementCustomProperties(_rules: ViewRule[], _nodes: ComputedNode[]) {
  const rules = _rules.flatMap(r => ('include' in r ? r.include.filter(Expr.isCustomElement) : []))
  if (rules.length === 0) {
    return _nodes
  }
  const nodes = [..._nodes]
  for (
    const {
      custom: { element, ...props }
    } of rules
  ) {
    const nodeIdx = nodes.findIndex(n => n.id === element)
    if (nodeIdx === -1) {
      continue
    }
    let node = nonNullable(nodes[nodeIdx])
    const { border, opacity, ...rest } = pickBy(props, isNonNullish)
    if (!isEmpty(rest)) {
      node = {
        ...node,
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
        style: {
          ...node.style,
          ...styleOverride
        }
      }
    }

    nodes[nodeIdx] = node
  }
  return nodes
}
