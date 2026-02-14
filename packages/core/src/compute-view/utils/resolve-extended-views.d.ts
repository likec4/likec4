import { type LikeC4View } from '../../types/view';
import type { AnyAux } from '../../types';
/**
 * Resolve rules of extended views
 * (Removes invalid views)
 */
export declare function resolveRulesExtendedViews<A extends AnyAux, V extends Record<any, LikeC4View<A>>>(unresolvedViews: V): V;
