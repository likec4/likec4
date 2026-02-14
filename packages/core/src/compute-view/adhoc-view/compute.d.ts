import { LikeC4Model } from '../../model/LikeC4Model';
import type { AnyAux, AnyExcludePredicate, AnyIncludePredicate, BaseViewProperties, ComputedEdge, ComputedNode, ModelExpression, ViewAutoLayout } from '../../types';
export interface AdhocViewIncludePredicate<A extends AnyAux> extends AnyIncludePredicate<ModelExpression<A>> {
}
export interface AdhocViewExcludePredicate<A extends AnyAux> extends AnyExcludePredicate<ModelExpression<A>> {
}
export type AdhocViewPredicate<A extends AnyAux = AnyAux> = AdhocViewIncludePredicate<A> | AdhocViewExcludePredicate<A>;
export interface ComputedAdhocView extends BaseViewProperties<AnyAux> {
    readonly nodes: ReadonlyArray<ComputedNode>;
    readonly edges: ReadonlyArray<ComputedEdge>;
    readonly autoLayout: ViewAutoLayout;
}
/**
 * Computes an adhoc view based on the given predicates.
 * Adhoc views are not defined in the model, but computed on demand.
 * Available for logical model only.
 *
 * @param predicates accepts the same predicates as element view.
 * @param likec4model The LikeC4 model to compute view.
 * @returns The computed adhoc view.
 */
export declare function computeAdhocView<A extends AnyAux>(likec4model: LikeC4Model<A>, predicates: AdhocViewPredicate<NoInfer<A>>[]): ComputedAdhocView;
