import {
  type AnyAux,
  type Aux,
  type Color,
  type IteratorLike,
  type ProcessedView,
  type RelationshipLineType,
  extractStep,
  isStepEdgeId,
} from '../../types'
import type { DeploymentRelationModel } from '../DeploymentElementModel'
import type { RelationshipModel } from '../RelationModel'
import type { LikeC4ViewModel } from './LikeC4ViewModel'
import type { NodeModel } from './NodeModel'

export type EdgesIterator<A extends AnyAux, V extends ProcessedView<A>> = IteratorLike<EdgeModel<A, V>>

export class EdgeModel<A extends AnyAux, V extends ProcessedView<A> = ProcessedView<A>> {
  constructor(
    public readonly view: LikeC4ViewModel<A, V>,
    public readonly $edge: V['edges'][number],
    public readonly source: NodeModel<A, V>,
    public readonly target: NodeModel<A, V>,
  ) {
  }

  get id(): Aux.Strict.EdgeId<A> {
    return this.$edge.id
  }

  get parent(): NodeModel<A, V> | null {
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

  public hasParent(): this is EdgeModel.WithParent<A, V> {
    return this.$edge.parent !== null
  }

  get tags(): Aux.Tags<A> {
    return this.$edge.tags ?? []
  }

  get stepNumber(): number | null {
    return this.isStep() ? extractStep(this.id as any) : null
  }

  get navigateTo(): LikeC4ViewModel<A, V> | null {
    return this.$edge.navigateTo ? this.view.$model.view(this.$edge.navigateTo) : null
  }

  get color(): Color {
    return this.$edge.color ?? 'gray'
  }

  get line(): RelationshipLineType {
    return this.$edge.line ?? 'dashed'
  }

  public isStep(): this is EdgeModel.StepEdge<A, V> {
    return isStepEdgeId(this.id)
  }

  public relationships(type: 'model'): IteratorLike<RelationshipModel<A>>
  public relationships(type: 'deployment'): IteratorLike<DeploymentRelationModel<A>>
  public relationships(type?: 'model' | 'deployment'): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>>
  public *relationships(
    type: 'model' | 'deployment' | undefined,
  ): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>> {
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

  public includesRelation(rel: Aux.RelationId<A>): boolean {
    return this.$edge.relations.includes(rel as unknown as Aux.Strict.RelationId<A>)
  }
}

namespace EdgeModel {
  export interface StepEdge<A extends AnyAux, V extends ProcessedView<A> = ProcessedView<A>> extends EdgeModel<A, V> {
    // id: StepEdgeId
    stepNumber: number
  }
  export interface WithParent<A extends AnyAux, V extends ProcessedView<A> = ProcessedView<A>> extends EdgeModel<A, V> {
    parent: NodeModel<A, V>
  }
}
