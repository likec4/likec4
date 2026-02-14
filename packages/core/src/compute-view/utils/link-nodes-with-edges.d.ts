import type { AnyAux, ComputedEdge, ComputedNode } from '../../types';
/**
 * Update `inEdges` and `outEdges` props of nodes based on the edges
 * Mutates nodes and updates their in/out edges
 */
export declare function linkNodesWithEdges<A extends AnyAux, N extends ComputedNode<A> = ComputedNode<A>, E extends ComputedEdge<A> = ComputedEdge<A>>(nodesMap: ReadonlyMap<any, N>, edges: E[]): void;
