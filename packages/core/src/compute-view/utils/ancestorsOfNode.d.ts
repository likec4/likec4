import type { AnyAux, ComputedNode } from '../../types';
/**
 * Returns the ancestors of given computed node, starting with the direct parent and ending with the root node.
 */
export declare function ancestorsOfNode<A extends AnyAux, N extends ComputedNode<A> = ComputedNode<A>>(node: N, nodes: ReadonlyMap<string, N>): ReadonlyArray<N>;
