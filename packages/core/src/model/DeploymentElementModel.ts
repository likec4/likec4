import { isEmpty } from 'remeda'
import type { SetRequired } from 'type-fest'
import { nonNullable } from '../errors'
import {
  type ComputedDeploymentView,
  DefaultElementShape,
  DefaultThemeColor,
  type DeployedInstance,
  type DeploymentNode,
  type DeploymentNodeKind,
  type DeploymentRelation,
  type ElementShape as C4ElementShape,
  type Link,
  type PhysicalElementStyle,
  type Tag,
  type Tag as C4Tag,
  type ThemeColor
} from '../types'
import { commonAncestor, nameFromFqn } from '../utils'
import { difference, intersection, union } from '../utils/set'
import type { LikeC4DeploymentModel } from './DeploymentModel'
import type { ElementModel } from './ElementModel'
import type { RelationshipModel, RelationshipsIterator } from './RelationModel'
import type { AnyAux, IncomingFilter, IteratorLike, OutgoingFilter } from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export type DeploymentElementsIterator<M extends AnyAux> = IteratorLike<DeploymentElementModel<M>>
export type DeployedInstancesIterator<M extends AnyAux> = IteratorLike<DeployedInstanceModel<M>>
export type DeploymentNodesIterator<M extends AnyAux> = IteratorLike<DeploymentNodeModel<M>>

export abstract class DeploymentElementModel<M extends AnyAux = AnyAux> {
  abstract readonly $model: LikeC4DeploymentModel<M>
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
    return this.$model.parent(this)
  }

  get links(): ReadonlyArray<Link> {
    return this.$node.links ?? []
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(): DeploymentNodesIterator<M> {
    return this.$model.ancestors(this)
  }

  /**
   * Returns the common ancestor of this element and another element.
   */
  public commonAncestor(another: DeploymentElementModel<M>): DeploymentNodeModel<M> | null {
    const common = commonAncestor(this.id, another.id)
    return common ? this.$model.node(common) : null
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(): DeploymentElementsIterator<M> {
    return this.$model.siblings(this)
  }

  /**
   * Check if the element is a sibling of another element
   */
  public isSibling(other: DeploymentElementModel<M>): boolean {
    return this.parent === other.parent
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public *ascendingSiblings(): DeploymentElementsIterator<M> {
    yield* this.siblings()
    for (const ancestor of this.ancestors()) {
      yield* ancestor.siblings()
    }
    return
  }

  public incoming(filter: IncomingFilter = 'all'): IteratorLike<DeploymentRelationModel<M>> {
    return this.$model.incoming(this, filter)
  }
  public outgoing(filter: OutgoingFilter = 'all'): IteratorLike<DeploymentRelationModel<M>> {
    return this.$model.outgoing(this, filter)
  }

  public *incomers(filter: IncomingFilter = 'all'): IteratorLike<DeploymentRelationEndpoint<M>> {
    const unique = new Set<M['Deployment']>()
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
    const unique = new Set<M['Deployment']>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  /**
   * Iterate over all views that include this deployment element.
   */
  public *views(): IteratorLike<LikeC4ViewModel<M, ComputedDeploymentView>> {
    for (const view of this.$model.views()) {
      if (view.includesDeployment(this.id)) {
        yield view
      }
    }
  }

  // type guard
  public isDeploymentNode(): this is DeploymentNodeModel<M> {
    return false
  }
  // type guard
  public isInstance(): this is DeployedInstanceModel<M> {
    return false
  }

  public abstract outgoingFromModel(): RelationshipsIterator<M>
  public abstract incomingFromModel(): RelationshipsIterator<M>

  protected cachedOutgoing: RelationshipsAccum<M> | null = null
  protected cachedIncoming: RelationshipsAccum<M> | null = null

  public get allOutgoing(): RelationshipsAccum<M> {
    this.cachedOutgoing ??= new RelationshipsAccum(
      new Set(this.outgoingFromModel()),
      new Set(this.outgoing())
    )
    return this.cachedOutgoing
  }

  public get allIncoming(): RelationshipsAccum<M> {
    this.cachedIncoming ??= new RelationshipsAccum(
      new Set(this.incomingFromModel()),
      new Set(this.incoming())
    )
    return this.cachedIncoming
  }
}

export class DeploymentNodeModel<M extends AnyAux = AnyAux> extends DeploymentElementModel<M> {
  constructor(
    public readonly $model: LikeC4DeploymentModel<M>,
    public readonly $node: DeploymentNode
  ) {
    super()
  }

  get kind(): DeploymentNodeKind {
    return this.$node.kind
  }

  public children(): ReadonlySet<DeploymentElementModel<M>> {
    return this.$model.children(this)
  }

  public descendants(): DeploymentElementsIterator<M> {
    return this.$model.descendants(this)
  }

  public override isDeploymentNode(): this is DeploymentNodeModel<M> {
    return true
  }

  /**
   * Iterate over all instances nested in this deployment node.
   */
  public *instances(): DeployedInstancesIterator<M> {
    for (const nested of this.descendants()) {
      if (nested.isInstance()) {
        yield nested
      }
    }
    return
  }

  /**
   * Returns deployed instance inside this deployment node
   * if only there are no more instances
   */
  public onlyOneInstance(): DeployedInstanceModel<M> | null {
    const it = this.instances()
    const one = it.next().value
    if (one) {
      const two = it.next().value
      return two ? null : one
    }
    return null
  }

  /**
   * Cached result of relationships from instances
   */
  private _relationshipsFromInstances: {
    outgoing: ReadonlySet<RelationshipModel<M>>
    incoming: ReadonlySet<RelationshipModel<M>>
  } | null = null

  private relationshipsFromInstances() {
    if (this._relationshipsFromInstances) {
      return this._relationshipsFromInstances
    }
    const outgoing = new Set<RelationshipModel<M>>()
    const incoming = new Set<RelationshipModel<M>>()
    for (const instance of this.instances()) {
      for (const r of instance.$element.outgoing()) {
        outgoing.add(r)
      }
      for (const r of instance.$element.incoming()) {
        incoming.add(r)
      }
    }
    return (this._relationshipsFromInstances = { outgoing, incoming })
  }

  /**
   * We return only relationships that are not already present in nested instances
   */
  public override outgoingFromModel(): RelationshipsIterator<M> {
    const {
      outgoing,
      incoming
    } = this.relationshipsFromInstances()
    return difference(outgoing, incoming).values()
  }

  /**
   * We return only relationships that are not already present in nested instances
   */
  public override incomingFromModel(): RelationshipsIterator<M> {
    const {
      outgoing,
      incoming
    } = this.relationshipsFromInstances()
    return difference(incoming, outgoing).values()
  }
}

export class DeployedInstanceModel<M extends AnyAux = AnyAux> extends DeploymentElementModel<M> {
  constructor(
    public readonly $model: LikeC4DeploymentModel<M>,
    public readonly $instance: DeployedInstance,
    public readonly $element: ElementModel<M>
  ) {
    super()
  }

  override get parent(): DeploymentNodeModel<M> {
    return nonNullable(this.$model.parent(this), `Parent of ${this.id} not found`)
  }

  get $node(): DeployedInstance {
    return this.$instance
  }

  override get style(): SetRequired<PhysicalElementStyle, 'shape' | 'color'> {
    const { icon, style } = this.$element.$element
    return {
      shape: this.$element.shape,
      color: this.$element.color,
      ...icon && { icon },
      ...style,
      ...this.$instance.style
    }
  }

  override get shape(): C4ElementShape {
    return this.$instance.style?.shape ?? this.$element.shape
  }

  override get color(): ThemeColor {
    return this.$instance.style?.color as ThemeColor ?? this.$element.color
  }

  override get tags(): ReadonlyArray<C4Tag> {
    return this.$instance.tags ?? []
  }

  override get title(): string {
    return this.$instance.title ?? this.$element.title
  }

  override get description(): string | null {
    return this.$instance.description ?? this.$element.description
  }

  override get technology(): string | null {
    return this.$instance.technology ?? this.$element.technology
  }

  override get links(): ReadonlyArray<Link> {
    return this.$instance.links ?? this.$element.links
  }

  public override isInstance(): this is DeployedInstanceModel<M> {
    return true
  }

  public override outgoingFromModel(): RelationshipsIterator<M> {
    return this.$element.outgoing()
  }
  public override incomingFromModel(): RelationshipsIterator<M> {
    return this.$element.incoming()
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
  public boundary: DeploymentNodeModel<M> | null
  public source: DeploymentRelationEndpoint<M>
  public target: DeploymentRelationEndpoint<M>

  constructor(
    public readonly $model: LikeC4DeploymentModel<M>,
    public readonly $relationship: DeploymentRelation
  ) {
    this.source = $model.deploymentRef($relationship.source)
    this.target = $model.deploymentRef($relationship.target)
    const parent = commonAncestor(this.source.id, this.target.id)
    this.boundary = parent ? this.$model.node(parent) : null
  }
  get id(): M['RelationId'] {
    return this.$relationship.id
  }

  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  get title(): string | null {
    if (isEmpty(this.$relationship.title)) {
      return null
    }
    return this.$relationship.title
  }

  get technology(): string | null {
    if (isEmpty(this.$relationship.technology)) {
      return null
    }
    return this.$relationship.technology
  }

  get description(): string | null {
    if (isEmpty(this.$relationship.description)) {
      return null
    }
    return this.$relationship.description
  }

  get tags(): ReadonlyArray<Tag> {
    return this.$relationship.tags ?? []
  }

  get navigateTo(): LikeC4ViewModel<M> | null {
    return this.$relationship.navigateTo ? this.$model.$model.view(this.$relationship.navigateTo) : null
  }

  get links(): ReadonlyArray<Link> {
    return this.$relationship.links ?? []
  }

  public *views(): IteratorLike<LikeC4ViewModel<M, ComputedDeploymentView>> {
    for (const view of this.$model.views()) {
      if (view.includesRelation(this.id)) {
        yield view
      }
    }
    return
  }
}

export class RelationshipsAccum<M extends AnyAux> {
  /**
   * @param model relationships from logical model
   * @param deployment relationships from deployment model
   */
  constructor(
    public readonly model: ReadonlySet<RelationshipModel<M>>,
    public readonly deployment: ReadonlySet<DeploymentRelationModel<M>>
  ) {
  }

  get isEmpty(): boolean {
    return this.model.size === 0 && this.deployment.size === 0
  }

  get nonEmpty(): boolean {
    return this.model.size > 0 || this.deployment.size > 0
  }

  get size(): number {
    return this.model.size + this.deployment.size
  }

  /**
   * Returns new Accum containing all the elements which are both in this and otherAccum
   */
  public intersect(otherAccum: RelationshipsAccum<M>): RelationshipsAccum<M> {
    return new RelationshipsAccum(
      intersection(this.model, otherAccum.model),
      intersection(this.deployment, otherAccum.deployment)
    )
  }

  /**
   * Returns new Accum containing all the elements which are both in this and otherAccum
   */
  public difference(otherAccum: RelationshipsAccum<M>): RelationshipsAccum<M> {
    return new RelationshipsAccum(
      difference(this.model, otherAccum.model),
      difference(this.deployment, otherAccum.deployment)
    )
  }

  /**
   * Returns new Accum containing all the elements from both
   */
  public union(otherAccum: RelationshipsAccum<M>): RelationshipsAccum<M> {
    return new RelationshipsAccum(
      union(this.model, otherAccum.model),
      union(this.deployment, otherAccum.deployment)
    )
  }
}
