import type { AnyAux, aux, IteratorLike } from '../../../types'
import { invariant, stringHash } from '../../../utils'
import { customInspectSymbol } from '../../../utils/const'
import { equals } from '../../../utils/set'
import {
  type DeploymentElementModel,
  type DeploymentRelationModel,
  DeploymentNodeModel,
  RelationshipsAccum,
} from '../../DeploymentElementModel'
import type { RelationshipModel } from '../../RelationModel'
import type { Connection } from '../Connection'

/**
 * Connection is ephemeral entity, result of a resolving relationships between source and target.
 * Includes direct relationships and/or between their nested elements.
 */
export class DeploymentConnectionModel<A extends AnyAux = AnyAux>
  implements Connection<DeploymentElementModel<A>, aux.EdgeId>
{
  readonly id: aux.EdgeId

  constructor(
    public readonly source: DeploymentElementModel<A>,
    public readonly target: DeploymentElementModel<A>,
    public readonly relations: RelationshipsAccum<A>,
  ) {
    this.id = stringHash(`deployment:${source.id}:${target.id}`) as aux.EdgeId
  }

  /**
   * Human readable expression of the connection
   * Mostly used for testing and debugging
   */
  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  private _boundary: DeploymentNodeModel<A> | null | undefined
  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  get boundary(): DeploymentNodeModel<A> | null {
    this._boundary ??= this.source.commonAncestor(this.target)
    return this._boundary
  }

  nonEmpty(): boolean {
    return this.relations.nonEmpty
  }

  [customInspectSymbol](
    // @ts-ignore
    depth,
    // @ts-ignore
    inspectOptions,
    // @ts-ignore
    inspect,
  ) {
    const asString = this.toString()

    // Trick so that node displays the name of the constructor
    Object.defineProperty(asString, 'constructor', {
      value: DeploymentConnectionModel,
      enumerable: false,
    })

    return asString
  }

  toString() {
    const model = [...this.relations.model].map(c => '    ' + c.expression)
    if (model.length) {
      model.unshift('  model:')
    } else {
      model.unshift('  model: []')
    }
    const deployment = [...this.relations.deployment].map(c => '    ' + c.expression)
    if (deployment.length) {
      deployment.unshift('  deployment:')
    } else {
      deployment.unshift('  deployment: []')
    }
    return [
      this.expression,
      ...model,
      ...deployment,
    ].join('\n')
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

  public *values(): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>> {
    yield* this.relations.model
    yield* this.relations.deployment
  }

  /**
   * Merge with another connections, if it has the same source and target.
   * Returns new connection with union of relationships.
   */
  public mergeWith(others: DeploymentConnectionModel<A>[]): DeploymentConnectionModel<A>
  /**
   * Merge with another connection, if it has the same source and target.
   * Returns new connection with union of relationships.
   */
  public mergeWith(other: DeploymentConnectionModel<A>): DeploymentConnectionModel<A>
  public mergeWith(other: DeploymentConnectionModel<A> | DeploymentConnectionModel<A>[]): DeploymentConnectionModel<A> {
    if (Array.isArray(other)) {
      return other.reduce((acc, o) => acc.mergeWith(o), this)
    }

    invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources')
    invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets')
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.union(other.relations),
    )
  }

  public difference(other: DeploymentConnectionModel<A>) {
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.difference(other.relations),
    )
  }

  public intersect(other: DeploymentConnectionModel<A>) {
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      this.relations.intersect(other.relations),
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
  public update(overrides?: {
    model?: ReadonlySet<RelationshipModel<A>> | null
    deployment?: ReadonlySet<DeploymentRelationModel<A>> | null
  }): DeploymentConnectionModel<A> {
    if (overrides) {
      overrides = {
        model: this.relations.model,
        deployment: this.relations.deployment,
        ...overrides,
      }
    }
    return new DeploymentConnectionModel(
      this.source,
      this.target,
      overrides
        ? new RelationshipsAccum(
          overrides.model ?? new Set(),
          overrides.deployment ?? new Set(),
        )
        : this.relations,
    )
  }
}
