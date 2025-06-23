import {
  type Any,
  type aux,
  type Color,
  type ComputedEdge,
  type DiagramEdge,
  type IteratorLike,
  type RelationshipLineType,
  type scalar,
  type StepEdgeId,
  extractStep,
  isStepEdgeId,
} from '../../types'
import { type RichTextOrEmpty, RichText } from '../../types'
import type { DeploymentRelationModel } from '../DeploymentElementModel'
import type { RelationshipModel } from '../RelationModel'
import type { $View, WithTags } from '../types'
import type { LikeC4ViewModel } from './LikeC4ViewModel'
import type { NodeModel } from './NodeModel'

export type EdgesIterator<A extends Any, V extends $View<A>> = IteratorLike<EdgeModel<A, V>>

export class EdgeModel<A extends Any = Any, View extends $View<A> = $View<A>> implements WithTags<A> {
  #edge: ComputedEdge<A> | DiagramEdge<A>
  constructor(
    public readonly view: LikeC4ViewModel<A, View>,
    public readonly $edge: View['edges'][number],
    public readonly source: NodeModel<A, View>,
    public readonly target: NodeModel<A, View>,
  ) {
    this.#edge = $edge
  }

  get id(): scalar.EdgeId {
    return this.#edge.id
  }

  get parent(): NodeModel<A, View> | null {
    return this.#edge.parent ? this.view.node(this.#edge.parent) : null
  }

  get label(): string | null {
    return this.#edge.label ?? null
  }

  get description(): RichTextOrEmpty {
    return RichText.memoize(this, this.#edge.description)
  }

  get technology(): string | null {
    return this.#edge.technology ?? null
  }

  public hasParent(): this is EdgeModel.WithParent<A, View> {
    return this.#edge.parent !== null
  }

  get tags(): aux.Tags<A> {
    return this.#edge.tags ?? []
  }

  get stepNumber(): number | null {
    return this.isStep() ? extractStep(this.id) : null
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.#edge.navigateTo ? this.view.$model.view(this.#edge.navigateTo) : null
  }

  get color(): Color {
    return this.#edge.color ?? 'gray'
  }

  get line(): RelationshipLineType {
    return this.#edge.line ?? 'dashed'
  }

  public isStep(): this is EdgeModel.StepEdge<A, View> {
    return isStepEdgeId(this.id)
  }

  public relationships(type: 'model'): IteratorLike<RelationshipModel<A>>
  public relationships(type: 'deployment'): IteratorLike<DeploymentRelationModel<A>>
  public relationships(type?: 'model' | 'deployment'): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>>
  public *relationships(
    type: 'model' | 'deployment' | undefined,
  ): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>> {
    for (const id of this.#edge.relations) {
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

  public includesRelation(rel: aux.RelationId | { id: aux.RelationId }): boolean {
    const id = typeof rel === 'string' ? rel : rel.id
    return this.#edge.relations.includes(id)
  }

  public isTagged(tag: aux.LooseTag<A>): boolean {
    return this.tags.includes(tag as aux.Tag<A>)
  }
}

namespace EdgeModel {
  export interface StepEdge<A extends Any, V extends $View<A>> extends EdgeModel<A, V> {
    id: StepEdgeId
    stepNumber: number
  }
  export interface WithParent<A extends Any, V extends $View<A>> extends EdgeModel<A, V> {
    parent: NodeModel<A, V>
  }
}
