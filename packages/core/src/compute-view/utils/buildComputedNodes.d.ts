import type { Except } from 'type-fest';
import type { ElementModel } from '../../model';
import { type AnyAux, type ComputedNode, type LikeC4StylesConfig, type scalar, type Unknown } from '../../types';
import { NodesGroup } from '../element-view/memory';
export type ComputedNodeSource<A extends AnyAux = Unknown> = Except<ComputedNode<A>, 'parent' | 'children' | 'inEdges' | 'outEdges' | 'level' | 'depth', {
    requireExactProps: true;
}>;
export declare function elementModelToNodeSource<A extends AnyAux>(el: ElementModel<A>): ComputedNodeSource<A>;
export declare function buildComputedNodes<A extends AnyAux>({ defaults }: LikeC4StylesConfig, elements: ReadonlyArray<ComputedNodeSource<A>>, groups?: ReadonlyArray<NodesGroup<A>>): ReadonlyMap<scalar.NodeId, ComputedNode<A>>;
