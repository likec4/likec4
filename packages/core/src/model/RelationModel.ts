import { isEmpty } from 'remeda'
import type { Link, Tag } from '../types/element'
import type { ModelRelation } from '../types/relation'
import { commonAncestor } from '../utils/fqn'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { AnyAux, IteratorLike } from './types'
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
    public readonly $relationship: ModelRelation
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

  get links(): ReadonlyArray<Link> {
    return this.$relationship.links ?? []
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
}
