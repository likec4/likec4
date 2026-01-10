import type { ViewPredicate } from '../../builder/Builder.view-common'
import { $expr } from '../../builder/Builder.view-element'
import type { LikeC4Model } from '../../model'
import type { AnyAux } from '../../types'
import { type AdhocViewPredicate, type ComputedAdhocView, computeAdhocView } from './compute'

/**
 * Allows you to define type-safe adhoc views using types from the model.
 */
export class AdhocView<A extends AnyAux> {
  /**
   * Creates a new adhoc view builder.
   */
  static use<A extends AnyAux>(model: LikeC4Model<A>) {
    return new AdhocView(model)
  }

  #predicates = [] as Array<AdhocViewPredicate<A>>
  private constructor(
    private readonly model: LikeC4Model<A>,
  ) {}

  /**
   * Used to cache the type of the predicates.
   */
  readonly Expr!: ViewPredicate.AllExpression<ViewPredicate.ElementExpr<A['ElementId']>>

  include(...predicates: this['Expr'][]): this {
    this.#predicates.push({
      // @ts-ignore types mismatch, ok for internal use
      include: predicates.map(predicate => $expr(predicate)),
    })
    return this
  }

  exclude(...predicates: this['Expr'][]): this {
    this.#predicates.push({
      // @ts-ignore types mismatch, ok for internal use
      exclude: predicates.map(predicate => $expr(predicate)),
    })
    return this
  }

  compute(): ComputedAdhocView {
    return computeAdhocView(this.model, this.#predicates)
  }
}
