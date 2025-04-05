import { isNullish, omitBy, pick } from 'remeda'
import { type ComputedEdge, type ComputedNode, type ViewRule, ModelLayer } from '../../types'
import { flattenGroupRules } from './applyCustomElementProperties'
import { relationExpressionToPredicates } from './relationExpressionToPredicates'

export function applyCustomRelationProperties(
  _rules: ViewRule[],
  nodes: ComputedNode[],
  _edges: Iterable<ComputedEdge>,
): ComputedEdge[] {
  const rules = _rules.flatMap(flattenGroupRules(ModelLayer.RelationExpr.isCustom))
  const edges = Array.from(_edges)
  if (rules.length === 0 || edges.length === 0) {
    return edges
  }
  for (
    const {
      customRelation: {
        expr,
        title,
        ...customprops
      },
    } of rules
  ) {
    const props = omitBy(customprops, isNullish)
    const satisfies = relationExpressionToPredicates(expr)
    edges.forEach((edge, i) => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) {
        return
      }
      if (satisfies({ source, target, ...pick(edge, ['kind', 'tags']) })) {
        edges[i] = {
          ...edge,
          ...props,
          label: title ?? edge.label,
          isCustomized: true,
        }
      }
    })
  }
  return edges
}
