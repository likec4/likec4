import type { ComputedNode, ViewRule } from '@likec4/core'
import { Expr, nonNullable } from '@likec4/core'
import { isDefined, isNullish as isNil, omitBy } from 'remeda'

const omitNil = omitBy(isNil)

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
    const node = nonNullable(nodes[nodeIdx])
    const { border, opacity, ...rest } = omitBy(props, isNil)
    nodes[nodeIdx] = {
      ...node,
      ...rest,
      style: {
        ...node.style,
        ...(isDefined.strict(border) && { border }),
        ...(isDefined.strict(opacity) && { opacity })
      }
    }
  }
  return nodes
}
