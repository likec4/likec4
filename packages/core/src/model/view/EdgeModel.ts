import { isNonNullish } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import {
  type ComputedDynamicView,
  type ComputedView,
  type DiagramView,
  extractStep,
  isStepEdgeId,
  type RelationId as C4RelationID,
  type StepEdgeId,
  type Tag as C4Tag
} from '../../types'
import type { DeploymentRelationModel } from '../DeploymentElementModel'
import type { LikeC4Model } from '../LikeC4Model'
import type { RelationshipModel } from '../RelationModel'
import type { AnyAux, IteratorLike } from '../types'
import type { LikeC4ViewModel } from './LikeC4ViewModel'
import type { NodeModel } from './NodeModel'

export type EdgesIterator<M extends AnyAux, V extends ComputedView | DiagramView> = IteratorLike<EdgeModel<M, V>>

export class EdgeModel<M extends AnyAux, V extends ComputedView | DiagramView = M['ViewType']> {
  constructor(
    public readonly view: LikeC4ViewModel<M, V>,
    public readonly $edge: V['edges'][number],
    public readonly source: NodeModel<M, V>,
    public readonly target: NodeModel<M, V>
  ) {
  }

  get id(): M['EdgeId'] {
    return this.$edge.id
  }

  get parent(): NodeModel<M, V> | null {
    return this.$edge.parent ? this.view.node(this.$edge.parent) : null
  }

  get label(): string | null {
    return this.$edge.label
  }

  get description(): string | null {
    return this.$edge.description ?? null
  }

  get technology(): string | null {
    return this.$edge.technology ?? null
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

  get navigateTo(): LikeC4ViewModel<M> | null {
    return this.$edge.navigateTo ? this.view.$model.view(this.$edge.navigateTo) : null
  }

  public isStep(): this is EdgeModel.StepEdge<M, ComputedDynamicView> {
    return isStepEdgeId(this.id)
  }

  public relationships(type: 'model'): IteratorLike<RelationshipModel<M>>
  public relationships(type: 'deployment'): IteratorLike<DeploymentRelationModel<M>>
  public relationships(type?: 'model' | 'deployment'): IteratorLike<LikeC4Model.AnyRelation<M>>
  public *relationships(type: 'model' | 'deployment' | undefined): IteratorLike<LikeC4Model.AnyRelation<M>> {
    for (const id of this.$edge.relations) {
      // if type is provided, then we need to filter relationships
      if (type) {
        const rel = this.view.$model.findRelationship(id, type)
        if (rel) {
          yield rel
        }
      } else {
        yield this.view.$model.relationship(id)
      }
    }
    return
  }

  public includesRelation(rel: M['RelationId']): boolean {
    return this.$edge.relations.includes(rel as C4RelationID)
  }
}

namespace EdgeModel {
  export interface StepEdge<M extends AnyAux, V extends ComputedView | DiagramView> extends EdgeModel<M, V> {
    id: StepEdgeId
    stepNumber: number
  }
  export interface WithParent<M extends AnyAux, V extends ComputedView | DiagramView> extends EdgeModel<M, V> {
    parent: NodeModel<M, V>
  }
}
