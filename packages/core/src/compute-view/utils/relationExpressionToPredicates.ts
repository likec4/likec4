import type { AnyAux, aux, ComputedNode } from '../../types'
import { ModelRelationExpr, whereOperatorAsPredicate } from '../../types'
import { nonexhaustive } from '../../utils'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean
export type FilterableEdge<A extends AnyAux> = {
  tags?: aux.Tags<A> | null | undefined
  kind?: string
  metadata?: Readonly<Record<string, string | string[] | undefined>> | null | undefined
  source: ComputedNode<A>
  target: ComputedNode<A>
}

/**
 * Minimal relation shape checked when deciding whether to expand a connection into
 * multiple edges. Used by {@link ShouldExpandPredicate}.
 */
export interface ExpandableRelation {
  readonly source: { readonly id: string; readonly tags: unknown; readonly kind: string; readonly metadata: unknown }
  readonly target: { readonly id: string; readonly tags: unknown; readonly kind: string; readonly metadata: unknown }
  readonly kind: string | null
  readonly tags: unknown
  readonly metadata: unknown
}

/**
 * Predicate that returns `true` when a single relation should be expanded into its
 * own dedicated edge instead of being merged into the connection's default edge.
 *
 * Uses `any` because the concrete relation types passed to this predicate differ
 * between element views and deployment views, and their source/target endpoints
 * have incompatible interfaces (e.g. {@link NestedElementOfDeployedInstanceModel}
 * does not expose `tags`/`kind`/`metadata` unlike {@link ElementModel}).
 */
export type ShouldExpandPredicate = (rel: any) => boolean

/**
 * Factory that creates a predicate function for relation expressions.
 *
 * The {@link elementPredicateBuilder} and the returned function use `any` for expression
 * parameters because element views and deployment views have incompatible expression
 * and node types ({@link ModelFqnExpr} vs. {@link FqnExpr}). The calling code in
 * both compute paths is responsible for passing the correct types.
 */
export function createRelationExpressionToPredicates<A extends AnyAux, T extends FilterableEdge<A>>(
  elementPredicateBuilder: (expr: any) => (node: any) => boolean,
): (expr: any) => Predicate<T> {
  return function relationExpressionToPredicates(expr: any): Predicate<T> {
    switch (true) {
      case ModelRelationExpr.isCustom(expr): {
        return relationExpressionToPredicates(expr.customRelation.expr)
      }
      case ModelRelationExpr.isWhere(expr): {
        const predicate = relationExpressionToPredicates(expr.where.expr)
        const where = whereOperatorAsPredicate(expr.where.condition)
        return e =>
          predicate(e) && where({
            source: { tags: e.source.tags, kind: e.source.kind as aux.AllKinds<A>, metadata: e.source.metadata },
            target: { tags: e.target.tags, kind: e.target.kind as aux.AllKinds<A>, metadata: e.target.metadata },
            ...(e.tags && { tags: e.tags }),
            ...(e.kind && { kind: e.kind as aux.AllKinds<A> }),
            ...(e.metadata && { metadata: e.metadata }),
          })
      }
      case ModelRelationExpr.isDirect(expr): {
        const isSource = elementPredicateBuilder(expr.source)
        const isTarget = elementPredicateBuilder(expr.target)
        return edge => {
          return (isSource(edge.source) && isTarget(edge.target))
            || (!!expr.isBidirectional && isSource(edge.target) && isTarget(edge.source))
        }
      }
      case ModelRelationExpr.isInOut(expr): {
        const isInOut = elementPredicateBuilder(expr.inout)
        return edge => isInOut(edge.source) || isInOut(edge.target)
      }
      case ModelRelationExpr.isIncoming(expr): {
        const isTarget = elementPredicateBuilder(expr.incoming)
        return edge => isTarget(edge.target)
      }
      case ModelRelationExpr.isOutgoing(expr): {
        const isSource = elementPredicateBuilder(expr.outgoing)
        return edge => isSource(edge.source)
      }
      default:
        nonexhaustive(expr as never)
    }
  }
}

export const relationExpressionToPredicates = createRelationExpressionToPredicates(elementExprToPredicate)
