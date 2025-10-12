import {
  type Any,
  type aux,
  type Color,
  type IteratorLike,
  type RelationshipArrowType,
  type RelationshipLineType,
  type RichTextOrEmpty,
  type scalar,
  type StepEdgeId,
  extractStep,
  isStepEdgeId,
  RichText,
} from '../../types'
import type { DeploymentRelationModel } from '../DeploymentElementModel'
import type { RelationshipModel } from '../RelationModel'
import type { $View, WithTags } from '../types'
import type { LikeC4ViewModel } from './LikeC4ViewModel'
import type { NodeModel } from './NodeModel'

export type EdgesIterator<A extends Any, V extends $View<A>> = IteratorLike<EdgeModel<A, V>>

export class EdgeModel<A extends Any = Any, V extends $View<A> = $View<A>> implements WithTags<A> {
  public readonly Aux!: A

  public readonly $viewModel: LikeC4ViewModel<A, V>
  public readonly $view: V
  public readonly $edge: V['edges'][number]

  constructor(
    $viewModel: LikeC4ViewModel<A, V>,
    $edge: V['edges'][number],
    public readonly source: NodeModel<A, V>,
    public readonly target: NodeModel<A, V>,
  ) {
    this.$viewModel = $viewModel
    this.$view = $viewModel.$view
    this.$edge = $edge
  }

  get id(): scalar.EdgeId {
    return this.$edge.id
  }

  get parent(): NodeModel<A, V> | null {
    return this.$edge.parent ? this.$viewModel.node(this.$edge.parent) : null
  }

  get label(): string | null {
    return this.$edge.label ?? null
  }

  get description(): RichTextOrEmpty {
    return RichText.memoize(this, 'description', this.$edge.description)
  }

  get technology(): string | null {
    return this.$edge.technology ?? null
  }

  public hasParent(): this is EdgeModel.WithParent<A, V> {
    return this.$edge.parent !== null
  }

  get tags(): aux.Tags<A> {
    return this.$edge.tags ?? []
  }

  get stepNumber(): number | null {
    return this.isStep() ? extractStep(this.id) : null
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.$edge.navigateTo ? this.$viewModel.$model.view(this.$edge.navigateTo) : null
  }

  get color(): Color {
    return this.$edge.color
  }

  get line(): RelationshipLineType {
    return this.$edge.line ?? this.$viewModel.$styles.defaults.relationship.line
  }

  get head(): RelationshipArrowType {
    return this.$edge.head ?? this.$viewModel.$styles.defaults.relationship.arrow
  }

  get tail(): RelationshipArrowType | undefined {
    return this.$edge.tail
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
        const rel = this.$viewModel.$model.findRelationship(id, type)
        if (rel) {
          yield rel
        }
      } else {
        yield this.$viewModel.$model.relationship(id)
      }
    }
    return
  }

  public includesRelation(rel: aux.RelationId | { id: aux.RelationId }): boolean {
    const id = typeof rel === 'string' ? rel : rel.id
    return this.$edge.relations.includes(id)
  }

  public isTagged(tag: aux.LooseTag<A>): boolean {
    return this.tags.includes(tag as aux.Tag<A>)
  }
}

namespace EdgeModel {
  export interface StepEdge<A extends Any, V extends $View<A>> extends EdgeModel<A, V> {
    readonly id: StepEdgeId
    readonly stepNumber: number
  }
  export interface WithParent<A extends Any, V extends $View<A>> extends EdgeModel<A, V> {
    readonly parent: NodeModel<A, V>
  }
}
