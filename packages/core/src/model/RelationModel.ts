import { isEmpty } from 'remeda'
import type { ALikeC4Model } from '../types'
import type { Link, Tag } from '../types/element'
import type { Relation, RelationID } from '../types/relation'
import { commonAncestor } from '../utils/fqn'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { IteratorLike } from './types'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type RelationshipsIterator<M extends ALikeC4Model> = IteratorLike<RelationshipModel<M>>

export class RelationshipModel<M extends ALikeC4Model> {
  public parent: ElementModel<M> | null
  public readonly source: ElementModel<M>
  public readonly target: ElementModel<M>

  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $relationship: Relation
  ) {
    this.source = model.element($relationship.source)
    this.target = model.element($relationship.target)
    const parent = commonAncestor(this.source.id, this.target.id)
    this.parent = parent ? this.model.element(parent) : null
  }

  get id(): RelationID {
    return this.$relationship.id
  }

  get title(): string | null {
    if (isEmpty(this.$relationship.title)) {
      return null
    }
    return this.$relationship.title
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

  public *views(): ViewsIterator<M> {
    for (const view of this.model.views()) {
      if (view.includesRelation(this.id)) {
        yield view
      }
    }
    return
  }
}
