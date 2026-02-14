import type { ViewPredicate } from '../../builder/Builder.view-common';
import type { LikeC4Model } from '../../model';
import type { AnyAux } from '../../types';
import { type ComputedAdhocView } from './compute';
/**
 * Allows you to define type-safe adhoc views using types from the model.
 */
export declare class AdhocView<A extends AnyAux> {
    #private;
    private readonly model;
    /**
     * Creates a new adhoc view builder.
     */
    static use<A extends AnyAux>(model: LikeC4Model<A>): AdhocView<AnyAux>;
    private constructor();
    /**
     * Used to cache the type of the predicates.
     */
    readonly Expr: ViewPredicate.AllExpression<ViewPredicate.ElementExpr<A['ElementId']>>;
    include(...predicates: this['Expr'][]): this;
    exclude(...predicates: this['Expr'][]): this;
    compute(): ComputedAdhocView;
}
