import type { DiagramNode } from '@likec4/core/types';
import type { Compound, ParallelRect, Step } from './_types';
/**
 * From steps find boxes that must be marked as parallel on the layout
 */
export declare function findParallelRects(steps: Array<Step>): Array<ParallelRect>;
/**
 * Builds a tree of compounds from actors and nodes.
 * @param actors the actors in the sequence view
 * @param nodes the nodes in likec4 diagram
 * @returns an array of compounds where each compound is a node in the sequence view
 * that is an ancestor of one of the actors
 */
export declare function buildCompounds(actors: ReadonlyArray<DiagramNode>, nodes: ReadonlyArray<DiagramNode>): Array<Compound>;
