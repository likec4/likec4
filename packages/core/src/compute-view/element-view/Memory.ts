import type { Memory as GenericMemory } from '../Memory'
import { MutableMemory as GenericMutableMemory } from '../Memory'

import type { Connection, Elem } from './_types'

type Connections<C> = ReadonlyArray<C>

export interface Memory extends GenericMemory<Elem, Connection> {
  clone(): MutableMemory
}

export type Patch = (memory: Memory) => Memory

export const emptyMemory = (): Memory => new MutableMemory(new Set(), new Set(), [], new Set())

export class MutableMemory extends GenericMutableMemory<Elem, Connection> implements Memory {
  constructor(
    public override elements: Set<Elem>,
    public override explicits: Set<Elem>,
    public override connections: Connections<Connection>,
    /**
     * Final set of elements to be included in the view
     * (`elements` excluding implicits)
     * Keeps order in which elements were added
     */
    public override finalElements: Set<Elem>
  ) {
    super(elements, explicits, connections, finalElements)
  }

  public override clone(): MutableMemory {
    return new MutableMemory(
      new Set(this.elements),
      new Set(this.explicits),
      [...this.connections],
      new Set(this.finalElements)
    )
  }
}
