import { hasAtLeast, intersection } from 'remeda'
import { invariant } from '../errors'
import type { NonEmptyReadonlyArray } from '../types'
import { isSameHierarchy, stringHash } from '../utils'
import { RelationshipsAccum } from './DeploymentElementModel'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationshipModel } from './RelationModel'
import type { AnyAux } from './types'

// export type RelationshipsIterator<M extends AnyAux> = IteratorLike<RelationshipModel<M>>

export interface Connection<Impl = unknown, Elem = unknown, Id = unknown> {
  id: Id
  source: Elem
  target: Elem

  mergeWith(other: Impl): Impl

  nonEmpty(): boolean

  difference(other: Impl): Impl
}

/**
 * Connection refers to any relationships between two elements,
 * both direct and implicit ones (between their nested elements).
 *
 * Merges relationships together to an single edge on the diagram.
 */
export class ConnectionModel<M extends AnyAux = AnyAux>
  implements Connection<ConnectionModel<M>, ElementModel<M>, M['EdgeId']>
{
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
      this.relations.union(other.relations)
    )
  }

  difference(other: ConnectionModel<M>): ConnectionModel<M> {
    invariant(this.source.id === other.source.id, 'Cannot difference connection with different sources')
    invariant(this.target.id === other.target.id, 'Cannot difference connection with different targets')
    return new ConnectionModel(
      this.source,
      this.target,
      this.relations.difference(other.relations)
    )
  }
}
