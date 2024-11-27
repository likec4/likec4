import { isEmpty } from 'remeda'
import type { Tag } from '../../types/element'
import type { Relation, RelationID } from '../../types/relation'
import { commonAncestor } from '../../utils/fqn'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model, Source, ViewType } from './LikeC4Model'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export class RelationModel<M extends Source> {
  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $relation: Relation,
    public readonly source: ElementModel<M>,
    public readonly target: ElementModel<M>
  ) {
  }

  get id(): RelationID {
    return this.$relation.id
  }

  get tags(): ReadonlyArray<Tag> {
    return this.$relation.tags ?? []
  }

  get title(): string | null {
    if (isEmpty(this.$relation.title)) {
      return null
    }
    return this.$relation.title
  }

  get parent(): ElementModel<M> | null {
    const parent = commonAncestor(this.source.id, this.target.id)
    return parent ? this.model.element(parent) : null
  }

  public views(): IteratorObject<LikeC4ViewModel<ViewType<M>>> {
    return this.model.views().filter(vm => vm.includesRelation(this.id))
  }
}
