import type { AnyCtx, ComputeMemory, GenericCtx, MutableState, StageExpression } from './_types'

export abstract class AbstractMemory<T extends AnyCtx = GenericCtx> implements ComputeMemory<T> {
  /**
   * Provides access to context types
   * !IMPORTANT: Should not be called in runtime
   *
   * @example
   * ```ts
   *   type State = SomeMemory['Ctx']['MutableState']
   * ```
   */
  public get Ctx(): T {
    throw new Error('Should not be called in runtime')
  }

  protected constructor(protected state: MutableState<T>) {
  }

  public get elements(): ReadonlySet<T['Element']> {
    return this.state.elements
  }
  public get explicits(): ReadonlySet<T['Element']> {
    return this.state.explicits
  }
  public get final(): ReadonlySet<T['Element']> {
    return this.state.final
  }
  public get connections(): ReadonlyArray<T['Connection']> {
    return this.state.connections
  }

  public isEmpty(): boolean {
    return this.elements.size === 0 && this.connections.length === 0
      && this.explicits.size === 0 && this.final.size === 0
  }

  abstract mutableState(): MutableState<T>

  abstract stageInclude(expr: StageExpression<T>): T['StageInclude']

  abstract stageExclude(expr: StageExpression<T>): T['StageExclude']

  abstract update(newstate: Partial<MutableState<T>>): T['Memory']
}
