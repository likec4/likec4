import type { ConnectionModel, LikeC4Model } from '../../model';
import { type AnyAux, type ComputedEdge, type ComputedNode, type scalar } from '../../types';
import type { Memory } from './_types';
export declare const NoWhere: () => boolean;
export declare const NoFilter: <T>(x: T[] | readonly T[]) => T[];
export declare function toComputedEdges<A extends AnyAux>(connections: ReadonlyArray<ConnectionModel<A>>): ComputedEdge<A>[];
export declare function buildNodes<A extends AnyAux>(model: LikeC4Model<A>, memory: Memory): ReadonlyMap<scalar.NodeId, ComputedNode<A>>;
