import { nonexhaustive } from '../../errors'
import type { Element } from '../../types/element'
import {
  isIncoming,
  isInOut,
  isOutgoing,
  isRelation,
  isRelationWhere,
  type RelationExpression,
  type RelationWhereExpr
} from '../../types/expression'
import { whereOperatorAsPredicate } from '../../types/operators'
import type { Relation } from '../../types/relation'
import type { ComputedNode } from '../../types/view'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean
export type FilterableEdge = Pick<Relation, 'kind' | 'tags'> & {
  source: ComputedNode
  target: ComputedNode
}

export function relationExpressionToPredicates<T extends FilterableEdge>(
  expr: RelationExpression | RelationWhereExpr
): Predicate<T> {
  switch (true) {
    case isRelationWhere(expr): {
      const predicate = relationExpressionToPredicates(expr.where.expr)
      const where = whereOperatorAsPredicate(expr.where.condition)
      return e => predicate(e) && where(e)
    }
    case isRelation(expr): {
      const isSource = elementExprToPredicate(expr.source)
      const isTarget = elementExprToPredicate(expr.target)
      return edge => {
        return (isSource(edge.source) && isTarget(edge.target))
          || (!!expr.isBidirectional && isSource(edge.target) && isTarget(edge.source))
      }
    }
    case isInOut(expr): {
      const isInOut = elementExprToPredicate(expr.inout)
      return edge => isInOut(edge.source) || isInOut(edge.target)
    }
    case isIncoming(expr): {
      const isTarget = elementExprToPredicate(expr.incoming)
      return edge => isTarget(edge.target)
    }
    case isOutgoing(expr): {
      const isSource = elementExprToPredicate(expr.outgoing)
      return edge => isSource(edge.source)
    }
    default:
      nonexhaustive(expr)
  }
}
