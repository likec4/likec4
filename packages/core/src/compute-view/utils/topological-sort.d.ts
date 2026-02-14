import type { AnyAux, ComputedEdge, ComputedNode } from '../../types';
type TopologicalSortParam<A extends AnyAux, N extends ComputedNode<A> = ComputedNode<A>, E extends ComputedEdge<A> = ComputedEdge<A>> = {
    nodes: ReadonlyMap<string, N>;
    edges: Iterable<E>;
};
export declare function topologicalSort<A extends AnyAux, N extends ComputedNode<A> = ComputedNode<A>, E extends ComputedEdge<A> = ComputedEdge<A>>(param: TopologicalSortParam<A, N, E>): {
    nodes: N[];
    edges: E[];
};
export {};
