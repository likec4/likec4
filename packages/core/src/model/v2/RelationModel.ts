import { isEmpty } from 'remeda'
import type { Tag } from '../../types/element'
import type { Relation, RelationID } from '../../types/relation'
import { commonAncestor } from '../../utils/fqn'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model, Source } from './LikeC4Model'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export class RelationModel<M extends Source> {
  public parent: ElementModel<M> | null

  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $relation: Relation,
    public readonly source: ElementModel<M>,
    public readonly target: ElementModel<M>
  ) {
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

  get tags(): ReadonlyArray<Tag> {
    return this.$relation.tags ?? []
  }

  public views(): IteratorObject<LikeC4ViewModel<M>> {
    return this.model.views().filter(vm => vm.includesRelation(this.id))
  }
}
