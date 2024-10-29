import type { Element, Relation } from '@likec4/core'
import { Expr, nonexhaustive, whereOperatorAsPredicate } from '@likec4/core'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean
export type FilterableEdge = Pick<Relation, 'kind' | 'tags'> & {
  source: Element
  target: Element
}

export function relationExpressionToPredicates<T extends FilterableEdge>(
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