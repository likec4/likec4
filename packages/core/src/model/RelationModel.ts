import { isTruthy } from 'remeda'
import type { IteratorLike, Link } from '../types'
import {
  type Aux,
  type Relationship,
  type RelationshipLineType,
  type ThemeColor,
  DefaultLineStyle,
  DefaultRelationshipColor,
  FqnRef,
} from '../types'
import type { AnyAux } from '../types'
import { commonAncestor } from '../utils/fqn'
import type { DeploymentRelationModel } from './DeploymentElementModel'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type RelationshipsIterator<A extends AnyAux> = IteratorLike<RelationshipModel<A>>

export class RelationshipModel<A extends AnyAux = AnyAux> {
  public readonly source: ElementModel<A>
  public readonly target: ElementModel<A>

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the Relation.
   */
  public readonly boundary: ElementModel<A> | null

  constructor(
    public readonly model: LikeC4Model<A>,
    public readonly $relationship: Relationship<A>,
  ) {
    this.source = model.element(FqnRef.flatten($relationship.source))
    this.target = model.element(FqnRef.flatten($relationship.target))
    const parent = commonAncestor(this.source.id, this.target.id)
    this.boundary = parent ? this.model.element(parent) : null
  }

  get id(): Aux.Strict.RelationId<A> {
    return this.$relationship.id
  }

  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  get title(): string | null {
    if (!isTruthy(this.$relationship.title)) {
      return null
    }
    return this.$relationship.title
  }

  get technology(): string | null {
    if (!isTruthy(this.$relationship.technology)) {
      return null
    }
    return this.$relationship.technology
  }

  get description(): string | null {
    if (!isTruthy(this.$relationship.description)) {
      return null
    }
    return this.$relationship.description
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.$relationship.navigateTo ? this.model.view(this.$relationship.navigateTo) : null
  }

  get tags(): Aux.Tags<A> {
    return this.$relationship.tags ?? []
  }

  get kind(): Aux.RelationKind<A> | null {
    return this.$relationship.kind ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$relationship.links ?? []
  }

  get color(): ThemeColor {
    return this.$relationship.color ?? DefaultRelationshipColor
  }

  get line(): RelationshipLineType {
    return this.$relationship.line ?? DefaultLineStyle
  }

  /**
   * Iterate over all views that include this relationship.
   */
  public *views(): ViewsIterator<A> {
    for (const view of this.model.views()) {
      if (view.includesRelation(this.id)) {
        yield view
      }
    }
    return
  }

  public isDeploymentRelation(): this is DeploymentRelationModel<A> {
    return false
  }

  public getMetadata(): Aux.Strict.Metadata<A>
  public getMetadata(field: Aux.MetadataKey<A>): string | undefined
  public getMetadata(field?: Aux.MetadataKey<A>) {
    if (field) {
      return this.$relationship.metadata?.[field]
    }
    return this.$relationship.metadata ?? {}
  }
}
