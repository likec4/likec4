import { isEmpty } from 'remeda'
import type { IteratorLike } from '../types/_common'
import type { Link } from '../types/element'
import {
  type ModelRelation,
  type RelationshipLineType,
  DefaultLineStyle,
  DefaultRelationshipColor,
} from '../types/relation'
import type { Tag } from '../types/scalars'
import type { Color } from '../types/theme'
import { commonAncestor } from '../utils/fqn'
import type { DeploymentRelationModel } from './DeploymentElementModel'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { AnyAux } from './types'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type RelationshipsIterator<M extends AnyAux> = IteratorLike<RelationshipModel<M>>

export class RelationshipModel<M extends AnyAux = AnyAux> {
  public readonly source: ElementModel<M>
  public readonly target: ElementModel<M>

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the Relation.
   */
  public readonly boundary: ElementModel<M> | null

  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $relationship: ModelRelation,
  ) {
    this.source = model.element($relationship.source)
    this.target = model.element($relationship.target)
    const parent = commonAncestor(this.source.id, this.target.id)
    this.boundary = parent ? this.model.element(parent) : null
  }

  get id(): M['RelationId'] {
    return this.$relationship.id
  }

  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  get title(): string | null {
    if (isEmpty(this.$relationship.title)) {
      return null
    }
    return this.$relationship.title
  }

  get technology(): string | null {
    if (isEmpty(this.$relationship.technology)) {
      return null
    }
    return this.$relationship.technology
  }

  get description(): string | null {
    if (isEmpty(this.$relationship.description)) {
      return null
    }
    return this.$relationship.description
  }

  get navigateTo(): LikeC4ViewModel<M> | null {
    return this.$relationship.navigateTo ? this.model.view(this.$relationship.navigateTo) : null
  }

  get tags(): ReadonlyArray<Tag> {
    return this.$relationship.tags ?? []
  }

  get kind(): string | null {
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
  public *views(): ViewsIterator<M> {
    for (const view of this.model.views()) {
      if (view.includesRelation(this.id)) {
        yield view
      }
    }
    return
  }

  public isDeploymentRelation(): this is DeploymentRelationModel<M> {
    return false
  }
}
