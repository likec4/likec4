import { findConnection, findConnectionsBetween } from '../../../model/connection/model'
import { difference, isIterable } from '../../../utils'
import { AbstractStageInclude } from '../../memory'
import { type ActiveGroupCtx, type ActiveGroupMemory, type Ctx } from './memory'
import { NodesGroup } from './NodeGroup'

type Elem = Ctx['Element']

export class StageInclude<C extends Ctx = Ctx> extends AbstractStageInclude<C> {
  /**
   * Connects elements with existing ones in the memory
   */
  public override connectWithExisting(
    elements: Elem | Iterable<Elem>,
    direction: 'in' | 'out' | 'both' = 'both'
  ): boolean {
    const before = this.connections.length
    const hasChanged = () => this.connections.length > before
    if (!isIterable(elements)) {
      if (direction === 'in') {
        for (const el of this.memory.elements) {
          this.addConnections(
            findConnection(el, elements, 'directed')
          )
        }
        return hasChanged()
      }
      const dir = direction === 'out' ? 'directed' : 'both'
      this.addConnections(
        findConnectionsBetween(elements, this.memory.elements, dir)
      )
      return hasChanged()
    }
    if (direction === 'in') {
      const targets = [...elements]
      for (const el of this.memory.elements) {
        this.addConnections(
          findConnectionsBetween(el, targets, 'directed')
        )
      }
    } else {
      const dir = direction === 'out' ? 'directed' : 'both'
      for (const el of elements) {
        this.addConnections(
          findConnectionsBetween(el, this.memory.elements, dir)
        )
      }
    }
    return hasChanged()
  }
}

export class ActiveGroupStageInclude extends StageInclude<ActiveGroupCtx> {
  constructor(
    public override readonly memory: ActiveGroupMemory
  ) {
    super(memory)
  }

  protected override postcommit(state: ActiveGroupCtx['MutableState']) {
    const newExplicits = difference(state.explicits, this.memory.explicits)
    for (const explicit of newExplicits) {
      state.explicitFirstSeenIn.set(explicit.id, this.memory.activeGroupId)
    }

    for (const implicit of [...this.explicits, ...this.implicits]) {
      state.lastSeenIn.set(implicit.id, this.memory.activeGroupId)
    }

    return state
  }
}