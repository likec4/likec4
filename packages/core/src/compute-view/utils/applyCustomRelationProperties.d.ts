import { type AnyAux, type ComputedEdge, type ComputedNode, type ElementViewRule } from '../../types';
export declare function applyCustomRelationProperties<A extends AnyAux>(_rules: ElementViewRule<A>[], nodes: ComputedNode<A>[], _edges: Iterable<ComputedEdge<A>>): ComputedEdge<A>[];
