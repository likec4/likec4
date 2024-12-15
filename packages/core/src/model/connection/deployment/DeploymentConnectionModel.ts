import { invariant } from '../../../errors'
import { stringHash } from '../../../utils'
import { equals } from '../../../utils/set'
import {
  type DeploymentElementModel,
  DeploymentNodeModel,
  type DeploymentRelationModel,
  RelationshipsAccum
} from '../../DeploymentElementModel'
import type { ElementModel } from '../../ElementModel'
import type { RelationshipModel } from '../../RelationModel'
import type { AnyAux, IteratorLike } from '../../types'
import type { Connection } from '../Connection'

/**
 * Connection is ephemeral entity, result of a resolving relationships between source and target.
 * Includes direct relationships and/or between their nested elements.
 */
export class DeploymentConnectionModel<M extends AnyAux = AnyAux>
  implements Connection<DeploymentElementModel<M>, M['EdgeId']>
{
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
    this.id = stringHash(`deployment:${source.id}:${target.id}`) as M['EdgeId']
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

  nonEmpty(): boolean {
    return this.relations.nonEmpty
  }

  /**
   * Check if connection contains deployment relation,
   * that is directly connected to source or target.
   */
  public hasDirectDeploymentRelation(): boolean {
    for (const relation of this.relations.deployment) {
      if (relation.source.id === this.source.id || relation.target.id === this.target.id) {
        return true
      }
    }
    return false
  }

  public *values(): IteratorLike<RelationshipModel<M> | DeploymentRelationModel<M>> {
    yield* this.relations.model
    yield* this.relations.deployment
  }

  /**
   * Merge with another connection, if it has the same source and target.
   * Returns new connection with union of relationships.
   */
  public mergeWith(other: DeploymentConnectionModel<M>) {
    invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources')
    invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets')
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.union(other.relations)
    )
  }

  public difference(other: DeploymentConnectionModel<M>) {
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.difference(other.relations)
    )
  }

  public intersect(other: DeploymentConnectionModel<M>) {
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.intersect(other.relations)
    )
  }

  public equals(other: Connection): boolean {
    invariant(other instanceof DeploymentConnectionModel, 'Other should ne DeploymentConnectionModel')
    return this.id === other.id
      && this.source.id === other.source.id
      && this.target.id === other.target.id
      && equals(this.relations.model, other.relations.model)
      && equals(this.relations.deployment, other.relations.deployment)
  }

  /**
   * Creates a clone of the current `DeploymentConnectionModel` instance with optional overrides.
   * if `null` is provided in overrides, the corresponding relation set will be empty.
   */
  public clone(overrides?: {
    model?: ReadonlySet<RelationshipModel<M>> | null
    deployment?: ReadonlySet<DeploymentRelationModel<M>> | null
  }): DeploymentConnectionModel<M> {
    if (overrides) {
      overrides = {
        model: this.relations.model,
        deployment: this.relations.deployment,
        ...overrides
      }
    }
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      overrides
        ? new RelationshipsAccum(
          overrides.model ?? new Set(),
          overrides.deployment ?? new Set()
        )
        : this.relations
    )
  }
}
