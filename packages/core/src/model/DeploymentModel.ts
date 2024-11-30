import { values } from 'remeda'
import { invariant, nonNullable } from '../errors'
import {
  type AnyLikeC4Model,
  type ComputedDeploymentView,
  DeploymentElement,
  type DeploymentRef,
  type DeploymentRelation,
  type Tag as C4Tag
} from '../types'
import { ancestorsFqn, parentFqn } from '../utils/fqn'
import { getOrCreate } from '../utils/getOrCreate'
import { isString } from '../utils/guards'
import {
  DeployedInstanceModel,
  type DeployedInstancesIterator,
  DeploymentElementModel,
  type DeploymentElementsIterator,
  DeploymentNodeModel,
  type DeploymentNodesIterator,
  DeploymentRelationModel,
  NestedElementOfDeployedInstanceModel
} from './DeploymentElementModel'
import type { LikeC4Model } from './LikeC4Model'
import { type AnyAux, getId, type IncomingFilter, type IteratorLike, type OutgoingFilter } from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export class LikeC4DeploymentModel<M extends AnyAux = AnyAux> {
  readonly #elements = new Map<M['Deployment'], DeploymentElementModel<M>>()
  // Parent element for given FQN
  readonly #parents = new Map<M['Deployment'], DeploymentNodeModel<M>>()
  // Children elements for given FQN
  readonly #children = new Map<M['Deployment'], Set<DeploymentElementModel<M>>>()

  // Keep track of instances of the logical element
  readonly #instancesOf = new Map<M['Element'], Set<DeployedInstanceModel<M>>>()

  readonly #rootElements = new Set<DeploymentNodeModel<M>>()

  readonly #relations = new Map<M['RelationId'], DeploymentRelationModel<M>>()

  // Incoming to an element or its descendants
  readonly #incoming = new Map<M['Deployment'], Set<DeploymentRelationModel<M>>>()

  // Outgoing from an element or its descendants
  readonly #outgoing = new Map<M['Deployment'], Set<DeploymentRelationModel<M>>>()

  // Relationships inside the element, among descendants
  readonly #internal = new Map<M['Deployment'], Set<DeploymentRelationModel<M>>>()

  // readonly #views = new Map<ViewID, LikeC4ViewModel<M>>()

  readonly #allTags = new Map<C4Tag, Set<DeploymentElementModel<M> | DeploymentRelationModel<M>>>()

  readonly #nestedElementsOfDeployment = new Map<
    `${M['Deployment']}@${M['Element']}`,
    NestedElementOfDeployedInstanceModel<M>
  >()

  constructor(
    public readonly $model: LikeC4Model<M>,
    public readonly $deployments: AnyLikeC4Model['deployments']
  ) {
    for (const element of values($deployments.elements)) {
      const el = this.addElement(element)
      for (const tag of el.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(el)
      }
      if (el.isInstance()) {
        getOrCreate(this.#instancesOf, el.element.id, () => new Set()).add(el)
      }
    }
    for (const relation of values($deployments.relations)) {
      const el = this.addRelation(relation)
      for (const tag of el.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(el)
      }
    }
  }

  public element(el: M['DeploymentOrFqn']): DeploymentElementModel<M> {
    if (el instanceof DeploymentElementModel) {
      return el
    }
    const id = getId(el)
    return nonNullable(this.#elements.get(id), `Element ${id} not found`)
  }
  public findElement(el: M['Deployment']): DeploymentElementModel<M> | null {
    return this.#elements.get(el) ?? null
  }

  public node(el: M['DeploymentOrFqn']): DeploymentNodeModel<M> {
    const element = this.element(el)
    invariant(element.isDeploymentNode(), `Element ${element.id} is not a deployment node`)
    return element
  }
  public findNode(el: M['Deployment']): DeploymentNodeModel<M> | null {
    const element = this.findElement(el)
    if (!element) {
      return null
    }
    invariant(element.isDeploymentNode(), `Element ${element?.id} is not a deployment node`)
    return element
  }

  public instance(el: M['DeploymentOrFqn']): DeployedInstanceModel<M> {
    const element = this.element(el)
    invariant(element.isInstance(), `Element ${element.id} is not a deployed instance`)
    return element
  }
  public findInstance(el: M['Deployment']): DeployedInstanceModel<M> | null {
    const element = this.findElement(el)
    if (!element) {
      return null
    }
    invariant(element.isInstance(), `Element ${element?.id} is not a deployed instance`)
    return element
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): DeploymentNodesIterator<M> {
    return this.#rootElements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): DeploymentElementsIterator<M> {
    return this.#elements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public *nodes(): DeploymentNodesIterator<M> {
    for (const element of this.#elements.values()) {
      if (element.isDeploymentNode()) {
        yield element
      }
    }
    return
  }

  public *instances(): DeployedInstancesIterator<M> {
    for (const element of this.#elements.values()) {
      if (element.isInstance()) {
        yield element
      }
    }
    return
  }

  /**
   * Iterate over all instances of the given logical element.
   */
  public *instancesOf(element: M['ElementOrFqn']): DeployedInstancesIterator<M> {
    const id = getId(element)
    const instances = this.#instancesOf.get(id)
    if (instances) {
      yield* instances
    }
    return
  }

  public deploymentRef(ref: DeploymentRef): DeploymentElementModel<M> | NestedElementOfDeployedInstanceModel<M> {
    if ('element' in ref) {
      const { id, element } = ref
      return getOrCreate(this.#nestedElementsOfDeployment, `${id}@${element}`, () => {
        return new NestedElementOfDeployedInstanceModel(this.instance(id), this.$model.element(element))
      })
    }
    return this.element(ref)
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): IteratorLike<DeploymentRelationModel<M>> {
    return this.#relations.values()
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: M['RelationId']): DeploymentRelationModel<M> {
    return nonNullable(this.#relations.get(id), `Relation ${id} not found`)
  }
  public findRelationship(id: M['RelationId']): DeploymentRelationModel<M> | null {
    return this.#relations.get(id) ?? null
  }

  /**
   * Returns all deployment views in the model.
   */
  public *views(): IteratorLike<LikeC4ViewModel<M, ComputedDeploymentView>> {
    for (const view of this.$model.views()) {
      if (view.isDeploymentView()) {
        yield view
      }
    }
    return
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: M['DeploymentOrFqn']): DeploymentNodeModel<M> | null {
    const id = getId(element)
    return this.#parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: M['DeploymentOrFqn']): DeploymentElementsIterator<M> {
    const id = getId(element)
    return this._childrenOf(id).values()
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(element: M['DeploymentOrFqn']): DeploymentElementsIterator<M> {
    const id = getId(element)
    const siblings = this.parent(element)?.children() ?? this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(element: M['DeploymentOrFqn']): DeploymentNodesIterator<M> {
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
  public *descendants(element: M['DeploymentOrFqn']): DeploymentElementsIterator<M> {
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
    element: M['DeploymentOrFqn'],
    filter: IncomingFilter = 'all'
  ): IteratorLike<DeploymentRelationModel<M>> {
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
    element: M['DeploymentOrFqn'],
    filter: OutgoingFilter = 'all'
  ): IteratorLike<DeploymentRelationModel<M>> {
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
      : new DeployedInstanceModel(this, element, this.$model.element(element.element))
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

    const relParent = rel.boundary?.id ?? null
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

  private _childrenOf(id: M['DeploymentFqn']) {
    return getOrCreate(this.#children, id, () => new Set())
  }

  private _incomingTo(id: M['DeploymentFqn']) {
    return getOrCreate(this.#incoming, id, () => new Set())
  }

  private _outgoingFrom(id: M['DeploymentFqn']) {
    return getOrCreate(this.#outgoing, id, () => new Set())
  }

  private _internalOf(id: M['DeploymentFqn']) {
    return getOrCreate(this.#internal, id, () => new Set())
  }

  // public isDiagramModel(): this is LikeC4Model<C4LayoutedLikeC4Model> {
  //   return this.$model.__ === 'layouted'
  // }
}
