import type { AnyCtx, ComputeMemory, GenericCtx } from './_types'

export abstract class AbstractMemory<T extends AnyCtx = GenericCtx> implements ComputeMemory<T> {
  protected constructor(protected state: T['MutableState']) {
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

  abstract mutableState(): T['MutableState']

  abstract stageInclude(): T['StageInclude']

  abstract stageExclude(): T['StageExclude']

  abstract update(newstate: Partial<T['MutableState']>): T['Memory']
}
