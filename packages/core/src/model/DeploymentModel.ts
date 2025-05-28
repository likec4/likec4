import { values } from 'remeda'
import { invariant, nonNullable } from '../errors'
import {
  type Aux,
  type ComputedDeploymentView,
  type DeploymentElement,
  type DeploymentRelationship,
  type IteratorLike,
  type LikeC4ModelData,
  FqnRef,
  isDeploymentNode,
} from '../types'
import { ancestorsFqn, parentFqn, sortParentsFirst } from '../utils/fqn'
import { getOrCreate } from '../utils/getOrCreate'
import { DefaultMap } from '../utils/mnemonist'
import {
  type DeployedInstancesIterator,
  type DeploymentElementModel,
  type DeploymentElementsIterator,
  type DeploymentNodesIterator,
  DeployedInstanceModel,
  DeploymentNodeModel,
  DeploymentRelationModel,
  NestedElementOfDeployedInstanceModel,
} from './DeploymentElementModel'
import type { LikeC4Model } from './LikeC4Model'
import {
  type AnyAux,
  type DeploymentOrFqn,
  type ElementOrFqn,
  type IncomingFilter,
  type OutgoingFilter,
  getId,
} from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export class LikeC4DeploymentModel<A extends AnyAux = AnyAux> {
  readonly #elements = new Map<Aux.Strict.DeploymentFqn<A>, DeploymentElementModel<A>>()
  // Parent element for given FQN
  readonly #parents = new Map<Aux.Strict.DeploymentFqn<A>, DeploymentNodeModel<A>>()
  // Children elements for given FQN
  readonly #children = new DefaultMap<Aux.Strict.DeploymentFqn<A>, Set<DeploymentElementModel<A>>>(() => new Set())

  // Keep track of instances of the logical element
  readonly #instancesOf = new DefaultMap<Aux.Strict.Fqn<A>, Set<DeployedInstanceModel<A>>>(() => new Set())

  readonly #rootElements = new Set<DeploymentNodeModel<A>>()

  readonly #relations = new Map<Aux.RelationId<A>, DeploymentRelationModel<A>>()

  // Incoming to an element or its descendants
  readonly #incoming = new DefaultMap<Aux.Strict.DeploymentFqn<A>, Set<DeploymentRelationModel<A>>>(() => new Set())

  // Outgoing from an element or its descendants
  readonly #outgoing = new DefaultMap<Aux.Strict.DeploymentFqn<A>, Set<DeploymentRelationModel<A>>>(() => new Set())

  // Relationships inside the element, among descendants
  readonly #internal = new DefaultMap<Aux.Strict.DeploymentFqn<A>, Set<DeploymentRelationModel<A>>>(() => new Set())

  // readonly #views = new Map<ViewID, LikeC4ViewModel<A>>()

  readonly #allTags = new DefaultMap<Aux.Tag<A>, Set<DeploymentElementModel<A> | DeploymentRelationModel<A>>>(
    () => new Set(),
  )

  readonly #nestedElementsOfDeployment = new Map<
    `${Aux.DeploymentId<A>}@${Aux.ElementId<A>}`,
    NestedElementOfDeployedInstanceModel<A>
  >()

  constructor(
    public readonly $model: LikeC4Model<A>,
    public readonly $deployments: LikeC4ModelData<A>['deployments'],
  ) {
    const elements = values($deployments.elements)
    for (const element of sortParentsFirst(elements)) {
      const el = this.addElement(element)
      for (const tag of el.tags) {
        this.#allTags.get(tag).add(el)
      }
      if (el.isInstance()) {
        this.#instancesOf.get(el.element.id).add(el)
      }
    }
    for (const relation of values($deployments.relations)) {
      const el = this.addRelation(relation)
      for (const tag of el.tags) {
        this.#allTags.get(tag).add(el)
      }
    }
  }

  public element(el: DeploymentOrFqn<A>): DeploymentElementModel<A> {
    if (el instanceof DeploymentNodeModel || el instanceof DeployedInstanceModel) {
      return el
    }
    const id = getId(el)
    return nonNullable(this.#elements.get(id), `Element ${id} not found`)
  }
  public findElement(el: Aux.Primitive.DeploymentFqn<A>): DeploymentElementModel<A> | null {
    return this.#elements.get(el as Aux.Strict.DeploymentFqn<A>) ?? null
  }

  public node(el: DeploymentOrFqn<A>): DeploymentNodeModel<A> {
    const element = this.element(el)
    invariant(element.isDeploymentNode(), `Element ${element.id} is not a deployment node`)
    return element
  }
  public findNode(el: Aux.Primitive.DeploymentFqn<A>): DeploymentNodeModel<A> | null {
    const element = this.findElement(el)
    if (!element) {
      return null
    }
    invariant(element.isDeploymentNode(), `Element ${element?.id} is not a deployment node`)
    return element
  }

  public instance(el: DeploymentOrFqn<A>): DeployedInstanceModel<A> {
    const element = this.element(el)
    invariant(element.isInstance(), `Element ${element.id} is not a deployed instance`)
    return element
  }
  public findInstance(el: Aux.Primitive.DeploymentFqn<A>): DeployedInstanceModel<A> | null {
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
  public roots(): DeploymentNodesIterator<A> {
    return this.#rootElements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): DeploymentElementsIterator<A> {
    return this.#elements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public *nodes(): DeploymentNodesIterator<A> {
    for (const element of this.#elements.values()) {
      if (element.isDeploymentNode()) {
        yield element
      }
    }
    return
  }

  public *instances(): DeployedInstancesIterator<A> {
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
  public *instancesOf(element: ElementOrFqn<A>): DeployedInstancesIterator<A> {
    const id = getId(element)
    const instances = this.#instancesOf.get(id)
    if (instances) {
      yield* instances
    }
    return
  }

  public deploymentRef(
    ref: FqnRef.DeploymentRef<A>,
  ): DeploymentElementModel<A> | NestedElementOfDeployedInstanceModel<A> {
    if (FqnRef.isInsideInstanceRef(ref)) {
      const { deployment, element } = ref
      return getOrCreate(this.#nestedElementsOfDeployment, `${deployment}@${element}`, () => {
        return new NestedElementOfDeployedInstanceModel(this.instance(deployment), this.$model.element(element))
      })
    }
    return this.element(ref.deployment)
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): IteratorLike<DeploymentRelationModel<A>> {
    return this.#relations.values()
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: Aux.RelationId<A>): DeploymentRelationModel<A> {
    return nonNullable(this.#relations.get(id), `DeploymentRelationModel ${id} not found`)
  }
  public findRelationship(id: Aux.Primitive.RelationId<A>): DeploymentRelationModel<A> | null {
    return this.#relations.get(id as Aux.Strict.RelationId<A>) ?? null
  }

  /**
   * Returns all deployment views in the model.
   */
  public *views(): IteratorLike<LikeC4ViewModel<A, ComputedDeploymentView<A>>> {
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
  public parent(element: DeploymentOrFqn<A>): DeploymentNodeModel<A> | null {
    const id = getId(element)
    return this.#parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: DeploymentOrFqn<A>): ReadonlySet<DeploymentElementModel<A>> {
    const id = getId(element)
    return this.#children.get(id)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(element: DeploymentOrFqn<A>): DeploymentElementsIterator<A> {
    const id = getId(element)
    const siblings = this.parent(element)?.children() ?? this.roots()
    for (const sibling of siblings) {
      if (sibling.id !== id) {
        yield sibling
      }
    }
    return
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(element: DeploymentOrFqn<A>): DeploymentNodesIterator<A> {
    let id = getId(element)
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
  public *descendants(element: DeploymentOrFqn<A>, sort: 'asc' | 'desc' = 'desc'): DeploymentElementsIterator<A> {
    for (const child of this.children(element)) {
      if (sort === 'asc') {
        yield child
        yield* this.descendants(child.id)
      } else {
        yield* this.descendants(child.id)
        yield child
      }
    }
    return
  }

  /**
   * Incoming relationships to the element and its descendants
   * @see incomers
   */
  public *incoming(
    element: DeploymentOrFqn<A>,
    filter: IncomingFilter = 'all',
  ): IteratorLike<DeploymentRelationModel<A>> {
    const id = getId(element)
    for (const rel of this.#incoming.get(id)) {
      switch (true) {
        case filter === 'all':
        case filter === 'direct' && rel.target.id === id:
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
    element: DeploymentOrFqn<A>,
    filter: OutgoingFilter = 'all',
  ): IteratorLike<DeploymentRelationModel<A>> {
    const id = getId(element)
    for (const rel of this.#outgoing.get(id)) {
      switch (true) {
        case filter === 'all':
        case filter === 'direct' && rel.source.id === id:
        case filter === 'from-descendants' && rel.source.id !== id:
          yield rel
          break
      }
    }
    return
  }

  private addElement(element: DeploymentElement<A>) {
    if (this.#elements.has(element.id)) {
      throw new Error(`Element ${element.id} already exists`)
    }
    const el = isDeploymentNode(element)
      ? new DeploymentNodeModel(this, Object.freeze(element))
      : new DeployedInstanceModel(this, Object.freeze(element), this.$model.element(element.element))
    this.#elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      invariant(this.#elements.has(parentId), `Parent ${parentId} of ${el.id} not found`)
      this.#parents.set(el.id, this.node(parentId))
      this.#children.get(parentId).add(el)
    } else {
      invariant(el.isDeploymentNode(), `Root element ${el.id} is not a deployment node`)
      this.#rootElements.add(el)
    }
    return el
  }

  private addRelation(relation: DeploymentRelationship<A>) {
    if (this.#relations.has(relation.id)) {
      throw new Error(`Relation ${relation.id} already exists`)
    }
    const rel = new DeploymentRelationModel(
      this,
      Object.freeze(relation),
    )
    this.#relations.set(rel.id, rel)
    this.#incoming.get(rel.target.id).add(rel)
    this.#outgoing.get(rel.source.id).add(rel)

    const relParent = rel.boundary?.id ?? null
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this.#internal.get(ancestor).add(rel)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(rel.source.id)) {
      if (sourceAncestor === relParent) {
        break
      }
      this.#outgoing.get(sourceAncestor).add(rel)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(rel.target.id)) {
      if (targetAncestor === relParent) {
        break
      }
      this.#incoming.get(targetAncestor).add(rel)
    }
    return rel
  }
}
