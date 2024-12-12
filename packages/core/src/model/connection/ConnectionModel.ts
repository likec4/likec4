import { invariant } from '../../errors'
import { difference, equals, union } from '../../utils/set'
import { stringHash } from '../../utils/string-hash'
import type { ElementModel } from '../ElementModel'
import type { RelationshipModel } from '../RelationModel'
import type { AnyAux } from '../types'

export interface Connection<Elem = any, Id = any> {
  readonly id: Id
  readonly source: Elem
  readonly target: Elem

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  readonly boundary: Elem | null

  /**
   * Human readable expression of the connection
   * Mostly used for testing and debugging
   */
  readonly expression: string

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
    this.id = stringHash(`model:${source.id}:${target.id}`) as M['EdgeId']
    this.boundary = source.commonAncestor(target)
  }

  /**
   * Human readable expression of the connection
   * Mostly used for testing and debugging
   */
  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
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
      union(this.relations, other.relations)
    )
  }

  difference(other: ConnectionModel<M>): ConnectionModel<M> {
    invariant(this.source.id === other.source.id, 'Cannot difference connection with different sources')
    invariant(this.target.id === other.target.id, 'Cannot difference connection with different targets')
    return new ConnectionModel(
      this.source,
      this.target,
      difference(this.relations, other.relations)
    )
  }

  equals(other: ConnectionModel<M>): boolean {
    return this.id === other.id
      && this.source.id === other.source.id
      && this.target.id === other.target.id
      && equals(this.relations, other.relations)
  }
}
