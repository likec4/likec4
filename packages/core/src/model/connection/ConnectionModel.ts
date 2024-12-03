import { difference } from 'remeda'
import { invariant } from '../../errors'
import { stringHash } from '../../utils'
import type { ElementModel } from '../ElementModel'
import type { RelationshipModel } from '../RelationModel'
import type { AnyAux } from '../types'

export interface Connection<Elem = any, Id = any> {
  id: Id
  source: Elem
  target: Elem

  mergeWith(this: Connection<any, any>, other: typeof this): typeof this

  nonEmpty(): boolean

  difference(this: Connection<Elem, Id>, other: Connection<Elem, Id>): typeof this
}

/**
 * Connection refers to any relationships between two elements,
 * both direct and implicit ones (between their nested elements).
 *
 * Merges relationships together to an single edge on the diagram.
 */
export class ConnectionModel<M extends AnyAux = AnyAux> implements Connection<ElementModel<M>, M['EdgeId']> {
  public readonly id: M['EdgeId']

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  public readonly boundary: ElementModel<M> | null

  constructor(
    public readonly source: ElementModel<M>,
    public readonly target: ElementModel<M>,
    public readonly relations: ReadonlySet<RelationshipModel<M>>
  ) {
    this.id = stringHash(`${source.id}:${target.id}`) as M['EdgeId']
    this.boundary = source.commonAncestor(target)
  }

  nonEmpty(): boolean {
    return this.relations.size > 0
  }

  mergeWith(other: ConnectionModel<M>): ConnectionModel<M> {
    invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources')
    invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets')
    return new ConnectionModel(
      this.source,
      this.target,
      new Set([
        ...this.relations,
        ...other.relations
      ])
    )
  }

  difference(other: ConnectionModel<M>): ConnectionModel<M> {
    invariant(this.source.id === other.source.id, 'Cannot difference connection with different sources')
    invariant(this.target.id === other.target.id, 'Cannot difference connection with different targets')
    return new ConnectionModel(
      this.source,
      this.target,
      new Set(difference(
        [...this.relations],
        [...other.relations]
      ))
    )
  }
}
