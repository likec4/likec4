import { nonNullable } from '../../errors'
import type { Tag } from '../../types/element'
import type { ComputedEdge } from '../../types/view'
import type { LikeC4Model } from '../LikeC4Model'
import type { ViewElement } from './ViewElement'
import type { ViewModel } from './ViewModel'

/**
 * Represents a connection between two elements.
 * May be source from multiple model relationships.
 */
export class ViewConnection {
  constructor(
    public readonly edge: ComputedEdge,
    private viewmodel: ViewModel
  ) {
  }

  get id() {
    return this.edge.id
  }

  get source(): ViewElement {
    return this.viewmodel.element(this.edge.source)
  }

  get target(): ViewElement {
    return this.viewmodel.element(this.edge.target)
  }

  get tags(): Tag[] {
    return this.edge.tags ?? []
  }

  /**
   * Model relationships
   */
  relationships(): ReadonlyArray<LikeC4Model.Relationship> {
    return this.edge.relations.map(r => nonNullable(this.viewmodel.model.relationship(r)))
  }
}
