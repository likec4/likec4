import type { ComputedNode, NodeNotation } from '../../types';
/**
 * Build element notations from computed nodes:
 * 1. Group by notation
 * 2. Group by shape
 * 3. Group by color
 * 4. For each group get unique kinds
 * 5. Unwind the groups
 */
export declare function buildElementNotations(nodes: ReadonlyArray<ComputedNode<any>>): NodeNotation[];
