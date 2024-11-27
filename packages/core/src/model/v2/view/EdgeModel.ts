import type { SetNonNullable } from 'type-fest'
import {
  type ComputedDynamicView,
  ComputedNode,
  extractStep,
  isStepEdgeId,
  type RelationID,
  type StepEdgeId,
  type Tag as C4Tag
} from '../../../types'
import type { EdgeId } from '../../types'
import type { ComputedOrDiagram, LikeC4ViewModel } from './LikeC4ViewModel'
import type { NodeModel } from './NodeModel'

export class EdgeModel<V extends ComputedOrDiagram> {
  constructor(
    public readonly view: LikeC4ViewModel<V>,
    public readonly $edge: V['edges'][number],
    public readonly source: NodeModel<V>,
    public readonly target: NodeModel<V>
  ) {
  }

  get id(): EdgeId {
    return this.$edge.id
  }

  get parent(): NodeModel<V> | null {
    return this.$edge.parent ? this.view.node(this.$edge.parent) : null
  }

  public hasParent(): this is EdgeModel.WithParent<V> {
    return this.$edge.parent !== null
  }

  get tags(): ReadonlyArray<C4Tag> {
    return this.$edge.tags ?? []
  }

  get stepNumber(): number | null {
    return this.isStep() ? extractStep(this.id) : null
  }

  public isStep(): this is EdgeModel.StepEdge {
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
  export interface StepEdge extends EdgeModel<ComputedDynamicView> {
    id: StepEdgeId
    stepNumber: number
  }
  export interface WithParent<V extends ComputedOrDiagram> extends EdgeModel<V> {
    parent: NodeModel<V>
  }
}
