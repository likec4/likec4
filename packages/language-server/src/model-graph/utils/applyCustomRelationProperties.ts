import type { ComputedEdge, ComputedNode, Element, Relation, ViewRule } from '@likec4/core'
import { Expr, nonexhaustive, whereOperatorAsPredicate } from '@likec4/core'
import { isNullish, omitBy, pick } from 'remeda'
import { flattenGroupRules } from './applyCustomElementProperties'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean
type FilterableEdge = Pick<Relation, 'kind' | 'tags'> & {
  source: Element
  target: Element
}

function relationExpressionToPredicates<T extends FilterableEdge>(
  expr: Expr.RelationExpression | Expr.RelationWhereExpr
): Predicate<T> {
  switch (true) {
    case Expr.isRelationWhere(expr):
      const predicate = relationExpressionToPredicates(expr.where.expr)
      const where = whereOperatorAsPredicate(expr.where.condition)

      return e => predicate(e) && where(e)
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
