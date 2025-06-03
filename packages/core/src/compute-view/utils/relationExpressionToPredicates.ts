import { nonexhaustive } from '../../errors'
import type { AnyAux, aux, ComputedNode } from '../../types'
import { ModelRelationExpr, whereOperatorAsPredicate } from '../../types'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean
export type FilterableEdge<A extends AnyAux> = {
  tags?: aux.Tags<A> | null | undefined
  kind?: string
  source: ComputedNode<A>
  target: ComputedNode<A>
}

export function relationExpressionToPredicates<A extends AnyAux, T extends FilterableEdge<A>>(
  expr: ModelRelationExpr.Any<A>,
): Predicate<T> {
  switch (true) {
    case ModelRelationExpr.isCustom(expr): {
      return relationExpressionToPredicates(expr.customRelation.expr)
    }
    case ModelRelationExpr.isWhere(expr): {
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
    case ModelRelationExpr.isDirect(expr): {
      const isSource = elementExprToPredicate(expr.source)
      const isTarget = elementExprToPredicate(expr.target)
      return edge => {
        return (isSource(edge.source) && isTarget(edge.target))
          || (!!expr.isBidirectional && isSource(edge.target) && isTarget(edge.source))
      }
    }
    case ModelRelationExpr.isInOut(expr): {
      const isInOut = elementExprToPredicate(expr.inout)
      return edge => isInOut(edge.source) || isInOut(edge.target)
    }
    case ModelRelationExpr.isIncoming(expr): {
      const isTarget = elementExprToPredicate(expr.incoming)
      return edge => isTarget(edge.target)
    }
    case ModelRelationExpr.isOutgoing(expr): {
      const isSource = elementExprToPredicate(expr.outgoing)
      return edge => isSource(edge.source)
    }
    default:
      nonexhaustive(expr)
  }
}
