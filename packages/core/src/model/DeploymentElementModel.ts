import { isEmpty } from 'remeda'
import type { SetRequired } from 'type-fest'
import { nonNullable } from '../errors'
import {
  type AnyLikeC4Model,
  type ComputedDeploymentView,
  DefaultElementShape,
  DefaultThemeColor,
  type DeployedInstance,
  type DeploymentNode,
  type DeploymentNodeKind,
  type DeploymentRelation,
  type ElementShape as C4ElementShape,
  type Fqn as C4Fqn,
  type Link,
  type PhysicalElementStyle,
  type RelationID as C4RelationID,
  type Tag,
  type Tag as C4Tag,
  type ThemeColor
} from '../types'
import { commonAncestor, nameFromFqn } from '../utils'
import type { LikeC4DeploymentModel } from './DeploymentModel'
import type { ElementModel } from './ElementModel'
import type { AnyAux, IncomingFilter, IteratorLike, OutgoingFilter } from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export type DeploymentElementsIterator<M extends AnyAux> = IteratorLike<DeploymentElementModel<M>>
export type DeploymentNodesIterator<M extends AnyAux> = IteratorLike<DeploymentNodeModel<M>>

export abstract class DeploymentElementModel<M extends AnyAux> {
  abstract readonly model: LikeC4DeploymentModel<M>
  abstract readonly $node: DeploymentNode | DeployedInstance

  get id(): M['DeploymentFqn'] {
    return this.$node.id
  }

  get style(): SetRequired<PhysicalElementStyle, 'shape' | 'color'> {
    return {
      shape: DefaultElementShape,
      color: DefaultThemeColor,
      ...this.$node.style
    }
  }

  get shape(): C4ElementShape {
    return this.$node.style?.shape ?? DefaultElementShape
  }

  get color(): ThemeColor {
    return this.$node.style?.color as ThemeColor ?? DefaultThemeColor
  }

  get tags(): ReadonlyArray<C4Tag> {
    return this.$node.tags ?? []
  }

  get title(): string {
    return this.$node.title ?? nameFromFqn(this.id)
  }

  get description(): string | null {
    return this.$node.description ?? null
  }

  get technology(): string | null {
    return this.$node.technology ?? null
  }

  get parent(): DeploymentNodeModel<M> | null {
    return this.model.parent(this)
  }

  get links(): ReadonlyArray<Link> {
    return this.$node.links ?? []
  }

  public ancestors(): DeploymentElementsIterator<M> {
    return this.model.ancestors(this)
  }

  public siblings(): DeploymentElementsIterator<M> {
    return this.model.siblings(this)
  }

  public incoming(filter: IncomingFilter = 'all'): IteratorLike<DeploymentRelationModel<M>> {
    return this.model.incoming(this, filter)
  }
  public outgoing(filter: OutgoingFilter = 'all'): IteratorLike<DeploymentRelationModel<M>> {
    return this.model.outgoing(this, filter)
  }

  public *incomers(filter: IncomingFilter = 'all'): IteratorLike<DeploymentRelationEndpoint<M>> {
    const unique = new Set<M['DeploymentLiteral']>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }
  public *outgoers(filter: OutgoingFilter = 'all'): IteratorLike<DeploymentRelationEndpoint<M>> {
    const unique = new Set<M['DeploymentLiteral']>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public *views(): IteratorLike<LikeC4ViewModel<M, ComputedDeploymentView>> {
    // return this.model.views().filter(vm => vm.includesDeployment(this.id))
    for (const view of this.model.views()) {
      if (view.includesDeployment(this.id)) {
        yield view
      }
    }
  }

  public isDeploymentNode(): this is DeploymentNodeModel<M> {
    return false
  }
  public isInstance(): this is DeployedInstanceModel<M> {
    return false
  }
}

export class DeploymentNodeModel<M extends AnyAux> extends DeploymentElementModel<M> {
  constructor(
    public readonly model: LikeC4DeploymentModel<M>,
    public readonly $node: DeploymentNode
  ) {
    super()
  }

  get kind(): DeploymentNodeKind {
    return this.$node.kind
  }

  public children(): DeploymentElementsIterator<M> {
    return this.model.children(this)
  }

  public descendants(): DeploymentElementsIterator<M> {
    return this.model.descendants(this)
  }

  public override isDeploymentNode(): this is DeploymentNodeModel<M> {
    return true
  }
}

export class DeployedInstanceModel<M extends AnyAux> extends DeploymentElementModel<M> {
  constructor(
    public readonly model: LikeC4DeploymentModel<M>,
    public readonly $instance: DeployedInstance,
    public readonly element: ElementModel<M>
  ) {
    super()
  }

  override get parent(): DeploymentNodeModel<M> {
    return nonNullable(this.model.parent(this), `Parent of ${this.id} not found`)
  }

  get $node(): DeployedInstance {
    return this.$instance
  }

  override get style(): SetRequired<PhysicalElementStyle, 'shape' | 'color'> {
    const { icon, style } = this.element.$element
    return {
      shape: this.element.shape,
      color: this.element.color,
      ...icon && { icon },
      ...style,
      ...this.$instance.style
    }
  }

  override get shape(): C4ElementShape {
    return this.$instance.style?.shape ?? this.element.shape
  }

  override get color(): ThemeColor {
    return this.$instance.style?.color as ThemeColor ?? this.element.color
  }

  override get tags(): ReadonlyArray<C4Tag> {
    return this.$instance.tags ?? []
  }

  override get title(): string {
    return this.$instance.title ?? this.element.title
  }

  override get description(): string | null {
    return this.$instance.description ?? this.element.description
  }

  override get technology(): string | null {
    return this.$instance.technology ?? this.element.technology
  }

  override get links(): ReadonlyArray<Link> {
    return this.$instance.links ?? this.element.links
  }

  public override isInstance(): this is DeployedInstanceModel<M> {
    return true
  }
}

export class NestedElementOfDeployedInstanceModel<M extends AnyAux> {
  constructor(
    public readonly instance: DeployedInstanceModel<M>,
    public readonly element: ElementModel<M>
  ) {
  }

  get id(): M['DeploymentFqn'] {
    return this.instance.id
  }

  get style(): SetRequired<PhysicalElementStyle, 'shape' | 'color'> {
    const { icon, style } = this.element.$element
    return {
      shape: this.element.shape,
      color: this.element.color,
      ...icon && { icon },
      ...style
    }
  }

  get shape(): C4ElementShape {
    return this.element.shape
  }

  get color(): ThemeColor {
    return this.element.color
  }

  get title(): string {
    return this.element.title
  }

  get description(): string | null {
    return this.element.description
  }

  get technology(): string | null {
    return this.element.technology
  }

  public isDeploymentNode(): this is DeploymentNodeModel<M> {
    return false
  }
  public isInstance(): this is DeployedInstanceModel<M> {
    return false
  }
}

export type DeploymentRelationEndpoint<M extends AnyAux> =
  | DeploymentElementModel<M>
  | NestedElementOfDeployedInstanceModel<M>

export class DeploymentRelationModel<M extends AnyAux> {
  public parent: DeploymentNodeModel<M> | null
  public source: DeploymentRelationEndpoint<M>
  public target: DeploymentRelationEndpoint<M>

  constructor(
    public readonly model: LikeC4DeploymentModel<M>,
    public readonly $relation: DeploymentRelation
  ) {
    this.source = model.deploymentRef($relation.source)
    this.target = model.deploymentRef($relation.target)
    const parent = commonAncestor(this.source.id, this.target.id)
    this.parent = parent ? this.model.node(parent) : null
  }

  get id(): M['RelationId'] {
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

  public *views(): IteratorLike<LikeC4ViewModel<M, ComputedDeploymentView>> {
    for (const view of this.model.views()) {
      if (view.includesRelation(this.id)) {
        yield view
      }
    }
    return
  }
}
