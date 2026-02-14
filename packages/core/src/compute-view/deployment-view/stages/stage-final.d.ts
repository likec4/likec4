import type { Memory } from '../memory';
/**
 * This patch:
 * 1. Keeps connections between leafs or having direct deployment relations
 * 2. Removes cross-boundary model relations, that already exist inside boundaries
 *    (e.g. prefer relations inside same deployment node over relations between nodes)
 * 3. Removes implicit connections between elements, if their descendants have same connection
 */
export declare class StageFinal {
    protected readonly memory: Memory;
    static for(memory: Memory): StageFinal;
    private constructor();
    step1CleanConnections(memory: Memory): Memory;
    step2ProcessImplicits(memory: Memory): Memory;
    step3ProcessBoundaries(memory: Memory): Memory;
    commit(): Memory;
}
