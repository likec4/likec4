import type { BaseEdge } from './types';
export declare function updateEdges<E extends BaseEdge>(current: E[], update: E[]): E[];
export declare function updateEdges<E extends BaseEdge>(update: E[]): (current: E[]) => E[];
