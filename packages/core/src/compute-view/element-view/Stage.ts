import { filter, forEach, isArray, map, pipe } from 'remeda'
import { findConnection, findConnectionsBetween } from '../../model/connection/model'
import { ElementModel } from '../../model/ElementModel'
import { RelationshipModel } from '../../model/RelationModel'
import { difference, hasIntersection, intersection } from '../../utils'
import { Stage as GenericStage } from '../Stage'
import type { Connection, Elem } from './_types'
import type { Memory } from './Memory'

const asArray = <T>(value: T | ReadonlyArray<T>): ReadonlyArray<T> => isArray(value) ? value : [value]

type Connections<C> = ReadonlyArray<C>

/**
 * Stage is a single step in the computation of the view
 */
export class Stage extends GenericStage<Elem, Connection> {
  constructor(
    public override readonly previous: Stage | null = null,
    public readonly memory: Memory
  ) {
    super(previous)
  }

  public excludeRelations(relations: Iterable<Connection>): this {
    let toExclude = new Set<RelationshipModel>()
    for (const r of relations) {
      toExclude = new Set([
        ...toExclude,
        ...r.relations
      ])
    }
    pipe(
      this.memory.connections,
      filter(c => hasIntersection(c.relations, toExclude)),
      map(c => c.updateRelations(intersection(c.relations, toExclude))),
      forEach(c => this.excludedConnections.push(c))
    )
    return this
  }

  /**
   * Connects elements with existing ones in the memory
   */
  public connectWithExisting(
    elements: ElementModel | Iterable<ElementModel>,
    direction: 'in' | 'out' | 'both' = 'both'
  ): boolean {
    const before = this._connections.length
    const hasChanged = () => this._connections.length > before
    if (elements instanceof ElementModel) {
      if (direction === 'in') {
        for (const el of this.memory.elements) {
          this.addConnections(findConnection(el, elements, 'directed'))
        }
        return hasChanged()
      }
      const dir = direction === 'out' ? 'directed' : 'both'
      this.addConnections(findConnectionsBetween(elements, this.memory.elements, dir))
      return hasChanged()
    }
    if (direction === 'in') {
      const targets = [...elements]
      for (const el of this.memory.elements) {
        this.addConnections(findConnectionsBetween(el, targets, 'directed'))
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
