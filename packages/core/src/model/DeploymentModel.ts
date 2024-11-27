import { isEmpty, values } from 'remeda'
import type { SetRequired } from 'type-fest'
import { invariant, nonNullable } from '../errors'
import {
  type ALikeC4Model,
  type ComputedDeploymentView,
  type ComputedLikeC4Model,
  DefaultElementShape,
  DefaultThemeColor,
  type DeployedInstance,
  DeploymentElement,
  type DeploymentNode,
  type DeploymentNodeKind,
  type DeploymentRef,
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
import { ancestorsFqn, commonAncestor, nameFromFqn, parentFqn } from '../utils/fqn'
import { getOrCreate } from '../utils/getOrCreate'
import { isString } from '../utils/guards'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import { type Fqn, getId, type IncomingFilter, type OutgoingFilter, type RelationID } from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

type ElementOrFqn = Fqn | { id: Fqn }

export class LikeC4DeploymentModel<M extends ALikeC4Model = ComputedLikeC4Model> {
  readonly #elements = new Map<Fqn, DeploymentElementModel<M>>()
  // Parent element for given FQN
  readonly #parents = new Map<Fqn, DeploymentNodeModel<M>>()
  // Children elements for given FQN
  readonly #children = new Map<Fqn, Set<DeploymentElementModel<M>>>()

  readonly #rootElements = new Set<DeploymentNodeModel<M>>()

  readonly #relations = new Map<RelationID, DeploymentRelationModel<M>>()

  // Incoming to an element or its descendants
  readonly #incoming = new Map<Fqn, Set<DeploymentRelationModel<M>>>()

  // Outgoing from an element or its descendants
  readonly #outgoing = new Map<Fqn, Set<DeploymentRelationModel<M>>>()

  // Relationships inside the element, among descendants
  readonly #internal = new Map<Fqn, Set<DeploymentRelationModel<M>>>()

  // readonly #views = new Map<ViewID, LikeC4ViewModel<M>>()

  readonly #allTags = new Map<C4Tag, Set<DeploymentElementModel<M> | DeploymentRelationModel<M>>>()

  readonly #nestedElementsOfDeployment = new Map<`${Fqn}@${Fqn}`, NestedElementOfDeployedInstanceModel<M>>()

  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $model: M['deployments']
  ) {
    for (const element of values($model.elements)) {
      const el = this.addElement(element)
      for (const tag of el.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(el)
      }
    }
    for (const relation of values($model.relations)) {
      const el = this.addRelation(relation)
      for (const tag of el.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(el)
      }
    }
  }

  public element(el: ElementOrFqn): DeploymentElementModel<M> {
    const id = getId(el)
    return nonNullable(this.#elements.get(id), `Element ${id} not found`)
  }
  public findElement(el: ElementOrFqn): DeploymentElementModel<M> | null {
    return this.#elements.get(getId(el)) ?? null
  }

  public node(el: ElementOrFqn): DeploymentNodeModel<M> {
    const element = this.element(el)
    invariant(element.isDeploymentNode(), `Element ${element.id} is not a deployment node`)
    return element
  }
  public findNode(el: ElementOrFqn): DeploymentNodeModel<M> | null {
    const element = this.findElement(el)
    invariant(!element || element.isDeploymentNode(), `Element ${element?.id} is not a deployment node`)
    return element
  }

  public instance(el: ElementOrFqn): DeployedInstanceModel<M> {
    const element = this.element(el)
    invariant(element.isInstance(), `Element ${element.id} is not a deployed instance`)
    return element
  }
  public findInstance(el: ElementOrFqn): DeployedInstanceModel<M> | null {
    const element = this.findElement(el)
    invariant(!element || element.isInstance(), `Element ${element?.id} is not a deployed instance`)
    return element
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): IteratorObject<DeploymentNodeModel<M>> {
    return this.#rootElements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): IteratorObject<DeploymentElementModel<M>> {
    return this.#elements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public nodes(): IteratorObject<DeploymentNodeModel<M>> {
    return this.#elements.values().filter(e => e.isDeploymentNode())
  }

  public instances(): IteratorObject<DeployedInstanceModel<M>> {
    return this.#elements.values().filter(e => e.isInstance())
  }

  public deploymentRef(ref: DeploymentRef): DeploymentElementModel<M> | NestedElementOfDeployedInstanceModel<M> {
    if ('element' in ref) {
      const { id, element } = ref
      return getOrCreate(this.#nestedElementsOfDeployment, `${id}@${element}`, () => {
        return new NestedElementOfDeployedInstanceModel(this.instance(id), this.model.element(element))
      })
    }
    return this.element(ref)
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): IteratorObject<DeploymentRelationModel<M>> {
    return this.#relations.values()
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: RelationID) {
    return nonNullable(this.#relations.get(id), `Relation ${id} not found`)
  }
  public findRelationship(id: RelationID) {
    return this.#relations.get(id) ?? null
  }

  /**
   * Returns all deployment views in the model.
   */
  public views(): IteratorObject<LikeC4ViewModel<M, ComputedDeploymentView>> {
    return this.model.views().filter(vm => vm.isDeploymentView())
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: ElementOrFqn): DeploymentNodeModel<M> | null {
    const id = getId(element)
    return this.#parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: ElementOrFqn): IteratorObject<DeploymentElementModel<M>> {
    const id = getId(element)
    return this._childrenOf(id).values()
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(element: ElementOrFqn): IteratorObject<DeploymentElementModel<M>> {
    const id = getId(element)
    const siblings = this.parent(element)?.children() ?? this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(element: ElementOrFqn): IteratorObject<DeploymentNodeModel<M>> {
    let id = isString(element) ? element : element.id
    let parent
    while (parent = this.#parents.get(id)) {
      yield parent
      id = parent.id
    }
    return
  }

  /**
   * Get all descendant elements (i.e. children, children’s children, etc.)
   */
  public *descendants(element: ElementOrFqn): IteratorObject<DeploymentElementModel<M>> {
    for (const child of this.children(element)) {
      yield child
      yield* this.descendants(child.id)
    }
    return
  }

  /**
   * Incoming relationships to the element and its descendants
   * @see incomers
   */
  public *incoming(
    element: ElementOrFqn,
    filter: IncomingFilter = 'all'
  ): IteratorObject<DeploymentRelationModel<M>> {
    const id = getId(element)
    for (const rel of this._incomingTo(id).values()) {
      switch (true) {
        case filter === 'all':
          yield rel
          break
        case filter === 'direct' && rel.target.id === id:
          yield rel
          break
        case filter === 'to-descendants' && rel.target.id !== id:
          yield rel
          break
      }
    }
    return
  }

  /**
   * Outgoing relationships from the element and its descendants
   * @see outgoers
   */
  public *outgoing(
    element: ElementOrFqn,
    filter: OutgoingFilter = 'all'
  ): IteratorObject<DeploymentRelationModel<M>> {
    const id = getId(element)
    for (const rel of this._outgoingFrom(id).values()) {
      switch (true) {
        case filter === 'all':
          yield rel
          break
        case filter === 'direct' && rel.source.id === id:
          yield rel
          break
        case filter === 'from-descendants' && rel.source.id !== id:
          yield rel
          break
      }
    }
    return
  }

  private addElement(element: DeploymentElement) {
    if (this.#elements.has(element.id)) {
      throw new Error(`Element ${element.id} already exists`)
    }
    const el = DeploymentElement.isDeploymentNode(element)
      ? new DeploymentNodeModel(this, element)
      : new DeployedInstanceModel(this, element, this.model.element(element.element))
    this.#elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      invariant(this.#elements.has(parentId), `Parent ${parentId} of ${el.id} not found`)
      this.#parents.set(el.id, this.node(parentId))
      this._childrenOf(parentId).add(el)
    } else {
      invariant(el.isDeploymentNode(), `Root element ${el.id} is not a deployment node`)
      this.#rootElements.add(el)
    }
    return el
  }

  private addRelation(relation: DeploymentRelation) {
    if (this.#relations.has(relation.id)) {
      throw new Error(`Relation ${relation.id} already exists`)
    }
    const rel = new DeploymentRelationModel(
      this,
      relation
    )
    this.#relations.set(rel.id, rel)
    this._incomingTo(rel.target.id).add(rel)
    this._outgoingFrom(rel.source.id).add(rel)

    const relParent = rel.parent?.id ?? null
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this._internalOf(ancestor).add(rel)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(rel.source.id)) {
      if (sourceAncestor === relParent) {
        break
      }
      this._outgoingFrom(sourceAncestor).add(rel)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(rel.target.id)) {
      if (targetAncestor === relParent) {
        break
      }
      this._incomingTo(targetAncestor).add(rel)
    }
    return rel
  }

  private _childrenOf(id: Fqn) {
    return getOrCreate(this.#children, id, () => new Set())
  }

  private _incomingTo(id: Fqn) {
    return getOrCreate(this.#incoming, id, () => new Set())
  }

  private _outgoingFrom(id: Fqn) {
    return getOrCreate(this.#outgoing, id, () => new Set())
  }

  private _internalOf(id: Fqn) {
    return getOrCreate(this.#internal, id, () => new Set())
  }

  // public isDiagramModel(): this is LikeC4Model<C4LayoutedLikeC4Model> {
  //   return this.$model.__ === 'layouted'
  // }
}

export abstract class DeploymentElementModel<M extends ALikeC4Model> {
  abstract readonly model: LikeC4DeploymentModel<M>
  abstract readonly $node: DeploymentNode | DeployedInstance

  get id(): C4Fqn {
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

  public ancestors(): IteratorObject<DeploymentElementModel<M>> {
    return this.model.ancestors(this)
  }

  public siblings(): IteratorObject<DeploymentElementModel<M>> {
    return this.model.siblings(this)
  }

  public incoming(filter: IncomingFilter = 'all'): IteratorObject<DeploymentRelationModel<M>> {
    return this.model.incoming(this, filter)
  }
  public outgoing(filter: OutgoingFilter = 'all'): IteratorObject<DeploymentRelationModel<M>> {
    return this.model.outgoing(this, filter)
  }

  public *incomers(filter: IncomingFilter = 'all'): IteratorObject<DeploymentRelationEndpoint<M>> {
    const unique = new Set<Fqn>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }
  public *outgoers(filter: OutgoingFilter = 'all'): IteratorObject<DeploymentRelationEndpoint<M>> {
    const unique = new Set<Fqn>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public views(): IteratorObject<LikeC4ViewModel<M, ComputedDeploymentView>> {
    return this.model.views().filter(vm => vm.includesDeployment(this.id))
  }

  public isDeploymentNode(): this is DeploymentNodeModel<M> {
    return false
  }
  public isInstance(): this is DeployedInstanceModel<M> {
    return false
  }
}

export class DeploymentNodeModel<M extends ALikeC4Model> extends DeploymentElementModel<M> {
  constructor(
    public readonly model: LikeC4DeploymentModel<M>,
    public readonly $node: DeploymentNode
  ) {
    super()
  }

  get kind(): DeploymentNodeKind {
    return this.$node.kind
  }

  public children(): IteratorObject<DeploymentElementModel<M>> {
    return this.model.children(this)
  }

  public descendants(): IteratorObject<DeploymentElementModel<M>> {
    return this.model.descendants(this)
  }

  public override isDeploymentNode(): this is DeploymentNodeModel<M> {
    return true
  }
}

export class DeployedInstanceModel<M extends ALikeC4Model> extends DeploymentElementModel<M> {
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

export class NestedElementOfDeployedInstanceModel<M extends ALikeC4Model> {
  constructor(
    public readonly instance: DeployedInstanceModel<M>,
    public readonly element: ElementModel<M>
  ) {
  }

  get id(): C4Fqn {
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

type DeploymentRelationEndpoint<M extends ALikeC4Model> =
  | DeploymentElementModel<M>
  | NestedElementOfDeployedInstanceModel<M>

export class DeploymentRelationModel<M extends ALikeC4Model> {
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

  get id(): C4RelationID {
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

  public views(): IteratorObject<LikeC4ViewModel<M, ComputedDeploymentView>> {
    return this.model.views().filter(vm => vm.includesRelation(this.id))
  }
}
