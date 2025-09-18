import { isNullish, omitBy, pick } from 'remeda'
import { type AnyAux, type ComputedEdge, type ComputedNode, type ElementViewRule, ModelRelationExpr } from '../../types'
import { flattenGroupRules } from './applyCustomElementProperties'
import { relationExpressionToPredicates } from './relationExpressionToPredicates'

export function applyCustomRelationProperties<A extends AnyAux>(
  _rules: ElementViewRule<A>[],
  nodes: ComputedNode<A>[],
  _edges: Iterable<ComputedEdge<A>>,
): ComputedEdge<A>[] {
  const rules = _rules.flatMap(flattenGroupRules(ModelRelationExpr.isCustom))
  const edges = Array.from(_edges)
  if (rules.length === 0 || edges.length === 0) {
    return edges
  }
  for (
    const {
      customRelation: {
        expr,
        title,
        description: _description,
        notes: _notes,
        ...customprops
      },
    } of rules
  ) {
    const description = _description ? { description: { txt: _description } } : {}
    const notes = _notes ? { notes: { txt: _notes } } : {}
    const props = omitBy(customprops, isNullish)
    const satisfies = relationExpressionToPredicates(expr)
    edges.forEach((edge, i) => {
      let source, target
      for (const node of nodes) {
        if (node.id === edge.source) {
          source = node
        }
        if (node.id === edge.target) {
          target = node
        }
        if (source && target) {
          break
        }
      }
      if (!source || !target) {
        return
      }
      if (satisfies({ source, target, ...pick(edge, ['kind', 'tags']) })) {
        edges[i] = {
          ...edge,
          ...props,
          ...description,
          ...notes,
          label: title ?? edge.label,
          isCustomized: true,
        }
      }
    })
  }
  return edges
}
