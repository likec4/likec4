import { invariant } from '../errors'
import { stringHash } from '../utils'
import {
  type DeploymentElementModel,
  DeploymentNodeModel,
  type DeploymentRelationModel,
  RelationshipsAccum
} from './DeploymentElementModel'
import type { RelationshipModel } from './RelationModel'
import type { AnyAux, IteratorLike } from './types'

/**
 * Connection is ephemeral entity, result of a resolving relationships between source and target.
 * Includes direct relationships and/or between their nested elements.
 */
export class DeploymentConnectionModel<M extends AnyAux = AnyAux> {
  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  readonly boundary: DeploymentNodeModel<M> | null

  constructor(
    public readonly source: DeploymentElementModel<M>,
    public readonly target: DeploymentElementModel<M>,
    public readonly relations: RelationshipsAccum<M>
  ) {
    this.id = stringHash(`${source.id}:${target.id}`) as M['EdgeId']
    this.boundary = source.commonAncestor(target)
  }

  readonly id: M['EdgeId']

  /**
   * Human readable expression of the connection
   * Mostly used for testing and debugging
   */
  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  get size(): number {
    return this.relations.size
  }

  public *values(): IteratorLike<RelationshipModel<M> | DeploymentRelationModel<M>> {
    yield* this.relations.model
    yield* this.relations.deployment
  }

  /**
   * Merge with another connection, if it has the same source and target.
   * Returns new connection with union of relationships.
   */
  public mergeWith(other: DeploymentConnectionModel<M>): DeploymentConnectionModel<M> {
    invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources')
    invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets')
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.union(other.relations)
    )
  }
}
