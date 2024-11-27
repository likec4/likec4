import { isEmpty } from 'remeda'
import type { ALikeC4Model } from '../../types'
import type { Link, Tag } from '../../types/element'
import type { Relation, RelationID } from '../../types/relation'
import { commonAncestor } from '../../utils/fqn'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export class RelationModel<M extends ALikeC4Model> {
  public parent: ElementModel<M> | null
  public readonly source: ElementModel<M>
  public readonly target: ElementModel<M>

  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $relation: Relation
  ) {
    this.source = model.element($relation.source)
    this.target = model.element($relation.target)
    const parent = commonAncestor(this.source.id, this.target.id)
    this.parent = parent ? this.model.element(parent) : null
  }

  get id(): RelationID {
    return this.$relation.id
  }

  get title(): string | null {
    if (isEmpty(this.$relation.title)) {
      return null
    }
    return this.$relation.title
  }

  get description(): string | null {
    if (isEmpty(this.$relation.description)) {
      return null
    }
    return this.$relation.description
  }

  get navigateTo(): LikeC4ViewModel<M> | null {
    return this.$relation.navigateTo ? this.model.view(this.$relation.navigateTo) : null
  }

  get tags(): ReadonlyArray<Tag> {
    return this.$relation.tags ?? []
  }

  get links(): ReadonlyArray<Link> {
    return this.$relation.links ?? []
  }

  public views(): IteratorObject<LikeC4ViewModel<M>> {
    return this.model.views().filter(vm => vm.includesRelation(this.id))
  }
}
