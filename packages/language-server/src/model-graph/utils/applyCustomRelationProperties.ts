import type { ComputedEdge, ComputedNode, ViewRule } from '@likec4/core'
import { Expr } from '@likec4/core'
import { isEmpty } from 'remeda'
import { elementExprToPredicate } from './elementExpressionToPredicate'

export function applyCustomRelationProperties(
  _rules: ViewRule[],
  nodes: ComputedNode[],
  _edges: Iterable<ComputedEdge>
): ComputedEdge[] {
  const rules = _rules.flatMap(r => ('include' in r ? r.include.filter(Expr.isCustomRelationExpr) : []))
  const edges = Array.from(_edges)
  if (rules.length === 0 || edges.length === 0) {
    return edges
  }
  for (
    const {
      customRelation: { relation, title, ...props }
    } of rules
  ) {
    if (isEmpty(props) && !title) {
      continue
    }
    const isSource = elementExprToPredicate(relation.source)
    const isTarget = elementExprToPredicate(relation.target)
    const satisfies = (edge: ComputedEdge) => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) {
        return false
      }
      let result = isSource(source) && isTarget(target)
      if (!result && relation.isBidirectional) {
        result = isSource(target) && isTarget(source)
      }
      return result
    }
    edges.forEach((edge, i) => {
      if (satisfies(edge)) {
        edges[i] = {
          ...edge,
          label: title ?? edge.label,
          isCustomized: true,
          ...props
        }
      }
    })
  }
  return edges
}
