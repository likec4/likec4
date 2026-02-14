import type { AnyAux, aux, ComputedNode } from '../../types';
import { ModelRelationExpr } from '../../types';
type Predicate<T> = (x: T) => boolean;
export type FilterableEdge<A extends AnyAux> = {
    tags?: aux.Tags<A> | null | undefined;
    kind?: string;
    source: ComputedNode<A>;
    target: ComputedNode<A>;
};
export declare function relationExpressionToPredicates<A extends AnyAux, T extends FilterableEdge<A>>(expr: ModelRelationExpr.Any<A>): Predicate<T>;
export {};
