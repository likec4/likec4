import type { ComputedEdge, ComputedNode, ViewRule } from '@likec4/core'
import { Expr } from '@likec4/core'
import { isNullish, omitBy, pick } from 'remeda'
import { flattenGroupRules } from './applyCustomElementProperties'
import { relationExpressionToPredicates } from './relationExpressionToPredicates'

export function applyCustomRelationProperties(
  _rules: ViewRule[],
  nodes: ComputedNode[],
  _edges: Iterable<ComputedEdge>
): ComputedEdge[] {
  const rules = _rules.flatMap(flattenGroupRules(Expr.isCustomRelationExpr))
  const edges = Array.from(_edges)
  if (rules.length === 0 || edges.length === 0) {
    return edges
  }
  for (
    const {
      customRelation: { relation, title, ...customprops }
    } of rules
  ) {
    const props = omitBy(customprops, isNullish)
    const satisfies = relationExpressionToPredicates(relation)
    edges.forEach((edge, i) => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) {
        return
      }
      if (satisfies({ source, target, ...pick(edge, ['kind', 'tags']) })) {
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
