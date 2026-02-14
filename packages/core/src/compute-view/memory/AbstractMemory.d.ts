import type { AnyCtx, ComputeMemory, GenericCtx, MutableState, StageExpression } from './_types';
export declare abstract class AbstractMemory<T extends AnyCtx = GenericCtx> implements ComputeMemory<T> {
    protected state: MutableState<T>;
    /**
     * Provides access to context types
     * !IMPORTANT: Should not be called in runtime
     *
     * @example
     * ```ts
     *   type State = SomeMemory['Ctx']['MutableState']
     * ```
     */
    get Ctx(): T;
    protected constructor(state: MutableState<T>);
    get elements(): ReadonlySet<T['Element']>;
    get explicits(): ReadonlySet<T['Element']>;
    get final(): ReadonlySet<T['Element']>;
    get connections(): ReadonlyArray<T['Connection']>;
    isEmpty(): boolean;
    abstract mutableState(): MutableState<T>;
    abstract stageInclude(expr: StageExpression<T>): T['StageInclude'];
    abstract stageExclude(expr: StageExpression<T>): T['StageExclude'];
    abstract update(newstate: Partial<MutableState<T>>): T['Memory'];
}
