import { isTruthy, only } from 'remeda'
import type { SetRequired } from 'type-fest'
import { nonNullable } from '../errors'
import {
  type AnyAux,
  type aux,
  type Color,
  type DeployedInstance,
  type DeploymentElement,
  type DeploymentElementStyle,
  type DeploymentNode,
  type DeploymentRelationship,
  type ElementShape as C4ElementShape,
  type IteratorLike,
  type Link,
  type RelationshipLineType,
  type scalar,
  type Unknown,
  DefaultElementShape,
  DefaultLineStyle,
  DefaultShapeSize,
  DefaultThemeColor,
} from '../types'
import { commonAncestor, hierarchyLevel, memoizeProp } from '../utils'
import { difference, intersection, union } from '../utils/set'
import type { LikeC4DeploymentModel } from './DeploymentModel'
import type { ElementModel } from './ElementModel'
import type { AnyRelationshipModel, RelationshipModel, RelationshipsIterator } from './RelationModel'
import type { $ViewWithType, IncomingFilter, OutgoingFilter } from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export type DeploymentElementsIterator<A extends AnyAux> = IteratorLike<DeploymentElementModel<A>>
export type DeployedInstancesIterator<A extends AnyAux> = IteratorLike<DeployedInstanceModel<A>>
export type DeploymentNodesIterator<A extends AnyAux> = IteratorLike<DeploymentNodeModel<A>>

export type DeploymentElementModel<A extends AnyAux> = DeploymentNodeModel<A> | DeployedInstanceModel<A>

abstract class AbstractDeploymentElementModel<A extends AnyAux = AnyAux> {
  abstract readonly id: aux.DeploymentFqn<A>
  abstract readonly _literalId: aux.DeploymentId<A>
  abstract readonly parent: DeploymentNodeModel<A> | null
  abstract readonly title: string
  abstract readonly hierarchyLevel: number

  abstract readonly $model: LikeC4DeploymentModel<A>
  abstract readonly $node: DeploymentElement<A>

  get style(): SetRequired<DeploymentElementStyle, 'shape' | 'color' | 'size'> {
    return {
      shape: DefaultElementShape,
      color: DefaultThemeColor,
      size: DefaultShapeSize,
      ...this.$node.style,
    }
  }

  get shape(): C4ElementShape {
    return this.$node.style?.shape ?? DefaultElementShape
  }

  get color(): Color {
    return this.$node.style?.color as Color ?? DefaultThemeColor
  }

  get tags(): aux.Tags<A> {
    return this.$node.tags ?? []
  }

  get description(): string | null {
    return this.$node.description ?? null
  }

  get technology(): string | null {
    return this.$node.technology ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$node.links ?? []
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(): DeploymentNodesIterator<A> {
    return this.$model.ancestors(this)
  }

  /**
   * Returns the common ancestor of this element and another element.
   */
  public commonAncestor(another: DeploymentElementModel<A>): DeploymentNodeModel<A> | null {
    const common = commonAncestor(this.id, another.id)
    return common ? this.$model.node(common) : null
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(): DeploymentElementsIterator<A> {
    return this.$model.siblings(this)
  }

  /**
   * Check if the element is a sibling of another element
   */
  public isSibling(other: DeploymentElementModel<A>): boolean {
    return this.parent === other.parent
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public *ascendingSiblings(): DeploymentElementsIterator<A> {
    yield* this.siblings()
    for (const ancestor of this.ancestors()) {
      yield* ancestor.siblings()
    }
    return
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from root to closest)
   */
  public *descendingSiblings(): DeploymentElementsIterator<A> {
    for (const ancestor of [...this.ancestors()].reverse()) {
      yield* ancestor.siblings()
    }
    yield* this.siblings()
    return
  }

  public incoming(filter: IncomingFilter = 'all'): IteratorLike<DeploymentRelationModel<A>> {
    return this.$model.incoming(this, filter)
  }
  public outgoing(filter: OutgoingFilter = 'all'): IteratorLike<DeploymentRelationModel<A>> {
    return this.$model.outgoing(this, filter)
  }

  public *incomers(filter: IncomingFilter = 'all'): IteratorLike<DeploymentRelationEndpoint<A>> {
    const unique = new Set<aux.DeploymentFqn<A>>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }
  public *outgoers(filter: OutgoingFilter = 'all'): IteratorLike<DeploymentRelationEndpoint<A>> {
    const unique = new Set<aux.DeploymentFqn<A>>()
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
  public *views(): IteratorLike<LikeC4ViewModel<A, $ViewWithType<A, 'deployment'>>> {
    for (const view of this.$model.views()) {
      if (!view.isDeploymentView()) {
        continue
      }
      if (view.includesDeployment(this.id)) {
        yield view
      }
    }
  }

  // type guard
  public isDeploymentNode(): this is DeploymentNodeModel<A> {
    return false
  }
  // type guard
  public isInstance(): this is DeployedInstanceModel<A> {
    return false
  }

  public abstract outgoingModelRelationships(): RelationshipsIterator<A>
  public abstract incomingModelRelationships(): RelationshipsIterator<A>

  public get allOutgoing(): RelationshipsAccum<A> {
    return memoizeProp(this, Symbol('allOutgoing'), () =>
      RelationshipsAccum.from(
        new Set(this.outgoingModelRelationships()),
        new Set(this.outgoing()),
      ))
  }

  public get allIncoming(): RelationshipsAccum<A> {
    return memoizeProp(this, Symbol('allIncoming'), () =>
      RelationshipsAccum.from(
        new Set(this.incomingModelRelationships()),
        new Set(this.incoming()),
      ))
  }

  public getMetadata(): aux.Metadata<A>
  public getMetadata(field: aux.MetadataKey<A>): string | undefined
  public getMetadata(field?: aux.MetadataKey<A>) {
    if (field) {
      return this.$node.metadata?.[field]
    }
    return this.$node.metadata ?? {}
  }
}

export class DeploymentNodeModel<A extends AnyAux = AnyAux> extends AbstractDeploymentElementModel<A> {
  override id: aux.DeploymentFqn<A>
  override _literalId: aux.DeploymentId<A>
  override title: string
  override hierarchyLevel: number

  constructor(
    public readonly $model: LikeC4DeploymentModel<A>,
    public readonly $node: DeploymentNode<A>,
  ) {
    super()
    this.id = $node.id
    this._literalId = $node.id
    this.title = $node.title
    this.hierarchyLevel = hierarchyLevel($node.id)
  }

  get parent(): DeploymentNodeModel<A> | null {
    return this.$model.parent(this)
  }

  get kind(): aux.DeploymentKind<A> {
    return this.$node.kind
  }

  public children(): ReadonlySet<DeploymentElementModel<A>> {
    return this.$model.children(this)
  }

  public descendants(sort: 'asc' | 'desc' = 'desc'): DeploymentElementsIterator<A> {
    return this.$model.descendants(this, sort)
  }

  public override isDeploymentNode(): this is DeploymentNodeModel<A> {
    return true
  }

  /**
   * Iterate over all instances nested in this deployment node.
   */
  public *instances(): DeployedInstancesIterator<A> {
    for (const nested of this.descendants('desc')) {
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
  public onlyOneInstance(): DeployedInstanceModel<A> | null {
    const children = this.children()
    if (children.size !== 1) {
      return null
    }
    const child = only([...children])
    return child?.isInstance() ? child : null
  }

  /**
   * Cached result of relationships from instances
   */
  private _relationshipsFromInstances: {
    outgoing: ReadonlySet<RelationshipModel<A>>
    incoming: ReadonlySet<RelationshipModel<A>>
  } | null = null

  private relationshipsFromInstances() {
    if (this._relationshipsFromInstances) {
      return this._relationshipsFromInstances
    }
    const {
      outgoing,
      incoming,
    } = (this._relationshipsFromInstances = {
      outgoing: new Set<RelationshipModel<A>>(),
      incoming: new Set<RelationshipModel<A>>(),
    })
    for (const instance of this.instances()) {
      for (const r of instance.element.outgoing()) {
        outgoing.add(r)
      }
      for (const r of instance.element.incoming()) {
        incoming.add(r)
      }
    }
    return this._relationshipsFromInstances
  }

  /**
   * We return only relationships that are not already present in nested instances
   */
  public override outgoingModelRelationships(): RelationshipsIterator<A> {
    return this.relationshipsFromInstances().outgoing.values()
  }

  /**
   * We return only relationships that are not already present in nested instances
   */
  public override incomingModelRelationships(): RelationshipsIterator<A> {
    return this.relationshipsFromInstances().incoming.values()
  }

  /**
   * Returns an iterator of relationships between nested instances
   */
  public internalModelRelationships(): ReadonlySet<RelationshipModel<A>> {
    const {
      outgoing,
      incoming,
    } = this.relationshipsFromInstances()
    return intersection(incoming, outgoing)
  }
}

export class DeployedInstanceModel<A extends AnyAux = Unknown> extends AbstractDeploymentElementModel<A> {
  override readonly id: aux.DeploymentFqn<A>
  override readonly _literalId: aux.DeploymentId<A>
  override readonly title: string
  override readonly hierarchyLevel: number

  constructor(
    public readonly $model: LikeC4DeploymentModel<A>,
    public readonly $instance: DeployedInstance<A>,
    public readonly element: ElementModel<A>,
  ) {
    super()
    this.id = $instance.id
    this._literalId = $instance.id
    this.title = $instance.title ?? element.title
    this.hierarchyLevel = hierarchyLevel($instance.id)
  }

  get $node(): DeployedInstance<A> {
    return this.$instance
  }

  get parent(): DeploymentNodeModel<A> {
    return nonNullable(this.$model.parent(this), `Parent of ${this.id} not found`)
  }

  override get style(): SetRequired<DeploymentElementStyle, 'shape' | 'color' | 'size'> {
    const { icon, style } = this.element.$element
    return {
      shape: this.element.shape,
      color: this.element.color,
      size: DefaultShapeSize,
      ...icon && { icon },
      ...style,
      ...this.$instance.style,
    }
  }

  override get shape(): C4ElementShape {
    return this.$instance.style?.shape ?? this.element.shape
  }

  override get color(): Color {
    return this.$instance.style?.color as Color ?? this.element.color
  }

  override get tags(): aux.Tags<A> {
    return this.$instance.tags ?? []
  }

  get kind(): aux.ElementKind<A> {
    return this.element.kind
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

  public override isInstance(): this is DeployedInstanceModel<A> {
    return true
  }

  public override outgoingModelRelationships(): RelationshipsIterator<A> {
    return this.element.outgoing()
  }
  public override incomingModelRelationships(): RelationshipsIterator<A> {
    return this.element.incoming()
  }

  /**
   * Iterate over all views that include this instance.
   * (Some views may include the parent deployment node instead of the instance.)
   */
  public override *views(): IteratorLike<LikeC4ViewModel<A, $ViewWithType<A, 'deployment'>>> {
    for (const view of this.$model.views()) {
      if (!view.isDeploymentView()) {
        continue
      }
      if (view.includesDeployment(this.id)) {
        yield view
        continue
      }
      // check if the view includes parent referecing this element
      if (
        view.includesDeployment(this.parent.id)
        && this.parent.onlyOneInstance()
      ) {
        yield view
      }
    }
  }
}

export class NestedElementOfDeployedInstanceModel<A extends AnyAux = Unknown> {
  constructor(
    public readonly instance: DeployedInstanceModel<A>,
    public readonly element: ElementModel<A>,
  ) {
  }

  get id(): aux.DeploymentFqn<A> {
    return this.instance.id
  }

  get _literalId(): aux.DeploymentId<A> {
    return this.instance.id
  }

  get style(): SetRequired<DeploymentElementStyle, 'shape' | 'color'> {
    const { icon, style } = this.element.$element
    return {
      shape: this.element.shape,
      color: this.element.color,
      ...icon && { icon },
      ...style,
    }
  }

  get shape(): C4ElementShape {
    return this.element.shape
  }

  get color(): Color {
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

  public isDeploymentNode(): this is DeploymentNodeModel<A> {
    return false
  }
  public isInstance(): this is DeployedInstanceModel<A> {
    return false
  }
}

export type DeploymentRelationEndpoint<A extends AnyAux = Unknown> =
  | DeploymentElementModel<A>
  | NestedElementOfDeployedInstanceModel<A>

export class DeploymentRelationModel<A extends AnyAux = Unknown> implements AnyRelationshipModel<A> {
  public boundary: DeploymentNodeModel<A> | null
  public source: DeploymentRelationEndpoint<A>
  public target: DeploymentRelationEndpoint<A>

  constructor(
    public readonly $model: LikeC4DeploymentModel<A>,
    public readonly $relationship: DeploymentRelationship<A>,
  ) {
    this.source = $model.deploymentRef($relationship.source)
    this.target = $model.deploymentRef($relationship.target)
    const parent = commonAncestor(this.source.id, this.target.id)
    this.boundary = parent ? this.$model.node(parent) : null
  }
  get id(): scalar.RelationId {
    return this.$relationship.id
  }

  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  get title(): string | null {
    if (!isTruthy(this.$relationship.title)) {
      return null
    }
    return this.$relationship.title
  }

  get technology(): string | null {
    if (!isTruthy(this.$relationship.technology)) {
      return null
    }
    return this.$relationship.technology
  }

  get description(): string | null {
    if (!isTruthy(this.$relationship.description)) {
      return null
    }
    return this.$relationship.description
  }

  get tags(): aux.Tags<A> {
    return this.$relationship.tags ?? []
  }

  get kind(): aux.RelationKind<A> | null {
    return this.$relationship.kind ?? null
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.$relationship.navigateTo ? this.$model.$model.view(this.$relationship.navigateTo) : null
  }

  get links(): ReadonlyArray<Link> {
    return this.$relationship.links ?? []
  }

  get color(): Color {
    return this.$relationship.color ?? DefaultThemeColor
  }

  get line(): RelationshipLineType {
    return this.$relationship.line ?? DefaultLineStyle
  }

  public *views(): IteratorLike<LikeC4ViewModel<A>> {
    for (const view of this.$model.views()) {
      if (view.includesRelation(this.id)) {
        yield view
      }
    }
    return
  }

  public isDeploymentRelation(): this is DeploymentRelationModel<A> {
    return true
  }

  public isModelRelation(): this is RelationshipModel<A> {
    return false
  }

  public getMetadata(): aux.Metadata<A>
  public getMetadata(field: aux.MetadataKey<A>): string | undefined
  public getMetadata(field?: aux.MetadataKey<A>) {
    if (field) {
      return this.$relationship.metadata?.[field]
    }
    return this.$relationship.metadata ?? {}
  }
}

export class RelationshipsAccum<A extends AnyAux = Unknown> {
  static empty<A extends AnyAux>(): RelationshipsAccum<A> {
    return new RelationshipsAccum()
  }
  static from<A extends AnyAux>(
    model: Iterable<RelationshipModel<A>> | undefined,
    deployment?: Iterable<DeploymentRelationModel<A>>,
  ): RelationshipsAccum<A> {
    return new RelationshipsAccum(
      new Set(model),
      new Set(deployment),
    )
  }
  /**
   * @param model relationships from logical model
   * @param deployment relationships from deployment model
   */
  constructor(
    public readonly model: ReadonlySet<RelationshipModel<A>> = new Set(),
    public readonly deployment: ReadonlySet<DeploymentRelationModel<A>> = new Set(),
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
  public intersect(otherAccum: RelationshipsAccum<A>): RelationshipsAccum<A> {
    return RelationshipsAccum.from(
      intersection(this.model, otherAccum.model),
      intersection(this.deployment, otherAccum.deployment),
    )
  }

  /**
   * Returns new Accum containing all the elements which are both in this and otherAccum
   */
  public difference(otherAccum: RelationshipsAccum<A>): RelationshipsAccum<A> {
    return RelationshipsAccum.from(
      difference(this.model, otherAccum.model),
      difference(this.deployment, otherAccum.deployment),
    )
  }

  /**
   * Returns new Accum containing all the elements from both
   */
  public union(otherAccum: RelationshipsAccum<A>): RelationshipsAccum<A> {
    return RelationshipsAccum.from(
      union(this.model, otherAccum.model),
      union(this.deployment, otherAccum.deployment),
    )
  }
}
