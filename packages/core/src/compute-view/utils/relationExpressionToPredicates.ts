import { nonexhaustive } from '../../errors'
import { ModelLayer } from '../../types'
import { whereOperatorAsPredicate } from '../../types/operators'
import type { ModelRelation } from '../../types/relation'
import type { ComputedNode } from '../../types/view'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean
export type FilterableEdge = Pick<ModelRelation, 'kind' | 'tags'> & {
  source: ComputedNode
  target: ComputedNode
}

export function relationExpressionToPredicates<T extends FilterableEdge>(
  expr: ModelLayer.AnyRelationExpr,
): Predicate<T> {
  switch (true) {
    case ModelLayer.RelationExpr.isCustom(expr): {
      return relationExpressionToPredicates(expr.customRelation.expr)
    }
    case ModelLayer.RelationExpr.isWhere(expr): {
      const predicate = relationExpressionToPredicates(expr.where.expr)
      const where = whereOperatorAsPredicate(expr.where.condition)
      return e =>
        predicate(e) && where({
          source: { tags: e.source.tags, kind: e.source.kind },
          target: { tags: e.target.tags, kind: e.target.kind },
          ...(e.tags && { tags: e.tags }),
          ...(e.kind && { kind: e.kind }),
        })
    }
    case ModelLayer.RelationExpr.isDirect(expr): {
      const isSource = elementExprToPredicate(expr.source)
      const isTarget = elementExprToPredicate(expr.target)
      return edge => {
        return (isSource(edge.source) && isTarget(edge.target))
          || (!!expr.isBidirectional && isSource(edge.target) && isTarget(edge.source))
      }
    }
    case ModelLayer.RelationExpr.isInOut(expr): {
      const isInOut = elementExprToPredicate(expr.inout)
      return edge => isInOut(edge.source) || isInOut(edge.target)
    }
    case ModelLayer.RelationExpr.isIncoming(expr): {
      const isTarget = elementExprToPredicate(expr.incoming)
      return edge => isTarget(edge.target)
    }
    case ModelLayer.RelationExpr.isOutgoing(expr): {
      const isSource = elementExprToPredicate(expr.outgoing)
      return edge => isSource(edge.source)
    }
    default:
      nonexhaustive(expr)
  }
}
