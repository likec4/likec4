import { isTruthy } from 'remeda'
import type { AnyAux, Color, IteratorLike, Link, scalar } from '../types'
import {
  type Relationship,
  type RelationshipLineType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  FqnRef,
} from '../types'
import type * as aux from '../types/aux'
import { commonAncestor } from '../utils/fqn'
import type { DeploymentRelationModel } from './DeploymentElementModel'
import type { ElementModel } from './ElementModel'
import type { isDeploymentRelationModel } from './guards'
import type { LikeC4Model } from './LikeC4Model'
import { RichText } from './RichText'
import type { WithMetadata, WithTags } from './types'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type RelationshipsIterator<A extends AnyAux> = IteratorLike<RelationshipModel<A>>

/**
 * A relationship between two elements (in logical or deployment model)
 * use {@link isDeploymentRelationModel} guard to check if the relationship is a deployment relationship
 */
export interface AnyRelationshipModel<A extends AnyAux> extends WithTags<A>, WithMetadata<A> {
  readonly id: scalar.RelationId
  readonly expression: string
  readonly title: string | null
  readonly technology: string | null
  readonly description: RichText | null
  readonly navigateTo: LikeC4ViewModel<A> | null
  readonly kind: aux.RelationKind<A> | null
  readonly links: ReadonlyArray<Link>
  readonly color: Color
  readonly line: RelationshipLineType
  isDeploymentRelation(): this is DeploymentRelationModel<A>
  isModelRelation(): this is RelationshipModel<A>
  views(): ViewsIterator<A>
}

export class RelationshipModel<A extends AnyAux = AnyAux> implements AnyRelationshipModel<A> {
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

  get id(): scalar.RelationId {
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

  get description(): RichText | null {
    return RichText.memoize(this, this.$relationship.description)
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.$relationship.navigateTo ? this.model.view(this.$relationship.navigateTo) : null
  }

  get tags(): aux.Tags<A> {
    return this.$relationship.tags ?? []
  }

  get kind(): aux.RelationKind<A> | null {
    return this.$relationship.kind ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$relationship.links ?? []
  }

  get color(): Color {
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

  public isModelRelation(): this is RelationshipModel<A> {
    return true
  }

  public getMetadata(): aux.Metadata<A>
  public getMetadata(field: aux.MetadataKey<A>): string | undefined
  public getMetadata(field?: aux.MetadataKey<A>) {
    if (field) {
      return this.$relationship.metadata?.[field]
    }
    return this.$relationship.metadata ?? {}
  }

  /**
   * Checks if the relationship has the given tag.
   */
  public isTagged(tag: aux.LooseTag<A>): boolean {
    return this.tags.includes(tag as aux.Tag<A>)
  }
}
