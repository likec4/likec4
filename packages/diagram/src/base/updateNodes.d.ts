import type { BaseNode } from './types';
/**
 * Updates nodes by merging existing nodes with updated nodes based on their IDs.
 *
 * Can be used in two ways:
 * 1. By providing both current and updated node arrays:
 *    `const newNodes = updateNodes(currentNodes, updatedNodes);`
 * 2. By providing only the updated node array, returning a function that takes the current nodes:
 *    `const updater = updateNodes(updatedNodes);
 *     const newNodes = updater(currentNodes);`
 *
 * @param current - The current array of nodes.
 * @param update - The array of nodes with updates.
 * @returns The updated array of nodes.
 */
export declare function updateNodes<N extends BaseNode>(current: N[], update: N[]): N[];
export declare function updateNodes<N extends BaseNode>(update: N[]): (current: N[]) => N[];
