import {
  type ALikeC4Model,
  type ComputedDynamicView,
  type ComputedView,
  type DiagramView,
  extractStep,
  isStepEdgeId,
  type RelationID,
  type StepEdgeId,
  type Tag as C4Tag,
  type ViewID
} from '../../../types'
import type { EdgeId } from '../../types'
import type { ViewType } from '../LikeC4Model'
import type { LikeC4ViewModel } from './LikeC4ViewModel'
import type { NodeModel } from './NodeModel'

export class EdgeModel<M extends ALikeC4Model, V extends ComputedView | DiagramView> {
  constructor(
    public readonly view: LikeC4ViewModel<M, V>,
    public readonly $edge: V['edges'][number],
    public readonly source: NodeModel<M, V>,
    public readonly target: NodeModel<M, V>
  ) {
  }

  get id(): EdgeId {
    return this.$edge.id
  }

  get parent(): NodeModel<M, V> | null {
    return this.$edge.parent ? this.view.node(this.$edge.parent) : null
  }

  public hasParent(): this is EdgeModel.WithParent<M, V> {
    return this.$edge.parent !== null
  }

  get tags(): ReadonlyArray<C4Tag> {
    return this.$edge.tags ?? []
  }

  get stepNumber(): number | null {
    return this.isStep() ? extractStep(this.id) : null
  }

  public isStep(): this is EdgeModel.StepEdge<M, ComputedDynamicView> {
    return isStepEdgeId(this.id)
  }

  public *relationships() {
    for (const rel of this.$edge.relations) {
      yield this.view.model.relationship(rel)
    }
  }

  public includesRelation(rel: RelationID): boolean {
    return this.$edge.relations.includes(rel)
  }
}

export namespace EdgeModel {
  export interface StepEdge<M extends ALikeC4Model, V extends ComputedView | DiagramView> extends EdgeModel<M, V> {
    id: StepEdgeId
    stepNumber: number
  }
  export interface WithParent<M extends ALikeC4Model, V extends ComputedView | DiagramView> extends EdgeModel<M, V> {
    parent: NodeModel<M, V>
  }
}
