import type { Memory } from './memory';
export declare class StageFinal {
    protected readonly memory: Memory;
    static for(memory: Memory): StageFinal;
    private constructor();
    step1CleanConnections(memory: Memory): Memory;
    step2ProcessImplicits(memory: Memory): Memory;
    step3ProcessBoundaries(memory: Memory): Memory;
    commit(): Memory;
}
