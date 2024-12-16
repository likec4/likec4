import { findConnection, findConnectionsBetween } from '../../../model/connection/model'
import { isIterable } from '../../../utils'
import { AbstractStageInclude } from '../../memory'
import { type Ctx } from './memory'

type Elem = Ctx['Element']

export class StageInclude extends AbstractStageInclude<Ctx> {
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
