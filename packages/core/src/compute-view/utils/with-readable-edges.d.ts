import type { AnyAux, ComputedLikeC4ModelData, ComputedView } from '../../types';
/**
 * Convert hashed edge ids to human-readable
 * Mostly for testing purposes
 */
export declare function withReadableEdges<V extends ComputedView<any>>({ edges, nodes, ...view }: V, separator?: string): V & {
    nodeIds: string[];
    edgeIds: string[];
};
export declare function viewsWithReadableEdges<A extends AnyAux>({ views, ...model }: ComputedLikeC4ModelData<A>): ComputedLikeC4ModelData<A>;
