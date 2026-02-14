import type { ElementModel, LikeC4Model } from '../../../model';
import { type AnyAux, ModelFqnExpr } from '../../../types';
import type { Elem, Memory, PredicateCtx } from '../_types';
export declare const findConnection: any, findConnectionsBetween: any, findConnectionsWithin: any;
/**
 * Resolve elements from the model based on the given expression
 */
export declare function resolveElements<A extends AnyAux>(model: LikeC4Model<A>, expr: ModelFqnExpr.NonWildcard<A>): ElementModel<A>[];
/**
 * Include elements that are not in the given set but are descendants of the current set
 * Consider the following example:
 *    a1.* -> b1
 * If there are a1.a2.a3 and b1.b2 in the memory, but not connected yet - we connect them
 */
export declare function includeDescendantsFromMemory(elements: Elem[], memory: Memory): Elem[];
/**
 * Combination of `resolveElements` and `includeDescendantsFromMemory`
 */
export declare function resolveAndIncludeFromMemory(nonWildcard: ModelFqnExpr.NonWildcard, { memory, model }: Pick<PredicateCtx, 'model' | 'memory'>): Elem[];
