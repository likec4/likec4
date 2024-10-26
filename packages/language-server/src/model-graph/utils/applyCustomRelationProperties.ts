import type { ComputedEdge, ComputedNode, Element, ViewRule } from '@likec4/core'
import { Expr, nonexhaustive } from '@likec4/core'
import { isNullish, omitBy } from 'remeda'
import { flattenGroupRules } from './applyCustomElementProperties'
import { elementExprToPredicate } from './elementExpressionToPredicate'

function relationExpressionToPredicates(
  expr: Expr.RelationExpression | Expr.RelationWhereExpr
): (edge: { source: Element; target: Element }) => boolean {
  switch (true) {
    case Expr.isRelationWhere(expr):
      return relationExpressionToPredicates(expr.where.expr)
    case Expr.isRelation(expr): {
      const isSource = elementExprToPredicate(expr.source)
      const isTarget = elementExprToPredicate(expr.target)
      return edge => {
        return (isSource(edge.source) && isTarget(edge.target))
          || (!!expr.isBidirectional && isSource(edge.target) && isTarget(edge.source))
      }
    }
    case Expr.isInOut(expr): {
      const isInOut = elementExprToPredicate(expr.inout)
      return edge => isInOut(edge.source) || isInOut(edge.target)
    }
    case Expr.isIncoming(expr): {
      const isTarget = elementExprToPredicate(expr.incoming)
      return edge => isTarget(edge.target)
    }
    case Expr.isOutgoing(expr): {
      const isSource = elementExprToPredicate(expr.outgoing)
      return edge => isSource(edge.source)
    }
    default:
      nonexhaustive(expr)
  }
}

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
      if (satisfies({ source, target })) {
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
