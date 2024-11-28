import { isString, pipe, sort, values } from 'remeda'
import { invariant, nonNullable } from '../errors'
import type { ComputedView, DiagramView, ViewID as C4ViewID } from '../types'
import { type Element as C4Element, type Fqn as C4Fqn, type Tag as C4Tag } from '../types/element'
import type { ALikeC4Model, ComputedLikeC4Model, LayoutedLikeC4Model } from '../types/model'
import type { Relation, RelationID as C4RelationID } from '../types/relation'
import { compareNatural, getOrCreate } from '../utils'
import { ancestorsFqn, commonAncestor, parentFqn } from '../utils/fqn'
import { LikeC4DeploymentModel } from './DeploymentModel'
import { ElementModel, type ElementsIterator } from './ElementModel'
import { RelationshipModel, type RelationshipsIterator } from './RelationModel'
import {
  type ElementOrFqn,
  type Fqn,
  getId,
  type IncomingFilter,
  type IteratorLike,
  type OutgoingFilter,
  type RelationID,
  type ViewID
} from './types'
import { EdgeModel } from './view/EdgeModel'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'
import { NodeModel } from './view/NodeModel'

export type ViewType<S extends ALikeC4Model> = S['views'][C4ViewID]

export class LikeC4Model<M extends ALikeC4Model = LikeC4Model.Sources> {
  readonly #elements = new Map<C4Fqn, ElementModel<M>>()
  // Parent element for given FQN
  readonly #parents = new Map<Fqn, ElementModel<M>>()
  // Children elements for given FQN
  readonly #children = new Map<C4Fqn, Set<ElementModel<M>>>()

  readonly #rootElements = new Set<ElementModel<M>>()

  readonly #relations = new Map<C4RelationID, RelationshipModel<M>>()

  // Incoming to an element or its descendants
  readonly #incoming = new Map<Fqn, Set<RelationshipModel<M>>>()

  // Outgoing from an element or its descendants
  readonly #outgoing = new Map<Fqn, Set<RelationshipModel<M>>>()

  // Relationships inside the element, among descendants
  readonly #internal = new Map<Fqn, Set<RelationshipModel<M>>>()

  readonly #views = new Map<ViewID, LikeC4ViewModel<M>>()

  readonly #allTags = new Map<C4Tag, Set<ElementModel<M> | RelationshipModel<M>>>()

  public readonly deployment: LikeC4DeploymentModel<M>

  static create<M extends ALikeC4Model>(model: M): LikeC4Model<M> {
    return new LikeC4Model(model)
  }

  private constructor(
    public readonly $model: M
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
    this.deployment = new LikeC4DeploymentModel(this, $model.deployments)
    const views = pipe(
      values($model.views),
      sort((a, b) => compareNatural(a.title ?? 'untitled', b.title ?? 'untitled'))
    )
    for (const view of views) {
      const vm = new LikeC4ViewModel(this, view as ViewType<M>)
      this.#views.set(view.id, vm)
    }
  }

  get type(): 'computed' | 'layouted' {
    return this.$model.__ ?? 'computed'
  }

  public element(el: ElementOrFqn): ElementModel<M> {
    return nonNullable(this.findElement(el), `Element ${getId(el)} not found`)
  }
  public findElement(el: ElementOrFqn): ElementModel<M> | null {
    const id = getId(el) as C4Fqn
    return this.#elements.get(id) ?? null
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): ElementsIterator<M> {
    return this.#rootElements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): ElementsIterator<M> {
    return this.#elements.values()
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): RelationshipsIterator<M> {
    return this.#relations.values()
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: RelationID): RelationshipModel<M> {
    return nonNullable(this.#relations.get(id as C4RelationID), `Relation ${id} not found`)
  }
  public findRelationship(id: RelationID): RelationshipModel<M> | null {
    return this.#relations.get(id as C4RelationID) ?? null
  }

  /**
   * Returns all views in the model.
   */
  public views() {
    return this.#views.values()
  }

  /**
   * Returns a specific view by its ID.
   */
  public view(viewId: ViewID): LikeC4ViewModel<M> {
    return nonNullable(this.#views.get(viewId), `View ${viewId} not found`)
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: ElementOrFqn): ElementModel<M> | null {
    const id = getId(element)
    return this.#parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: ElementOrFqn) {
    const id = getId(element)
    return this._childrenOf(id).values()
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(element: ElementOrFqn): ElementsIterator<M> {
    const id = getId(element)
    const parent = this.#parents.get(id)
    const siblings = parent ? this._childrenOf(parent.id).values() : this.roots()
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
  public *ancestors(element: ElementOrFqn): ElementsIterator<M> {
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
  public *descendants(element: ElementOrFqn): ElementsIterator<M> {
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
  ): RelationshipsIterator<M> {
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
  ): RelationshipsIterator<M> {
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

  private addElement(element: C4Element) {
    if (this.#elements.has(element.id)) {
      throw new Error(`Element ${element.id} already exists`)
    }
    const el = new ElementModel(this, element)
    this.#elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      invariant(this.#elements.has(parentId), `Parent ${parentId} of ${el.id} not found`)
      this.#parents.set(el.id, this.element(parentId))
      this._childrenOf(parentId).add(el)
    } else {
      this.#rootElements.add(el)
    }
    return el
  }

  private addRelation(relation: Relation) {
    if (this.#relations.has(relation.id)) {
      throw new Error(`Relation ${relation.id} already exists`)
    }
    const rel = new RelationshipModel(
      this,
      relation
    )
    const { source, target } = rel
    this.#relations.set(rel.id, rel)
    this._incomingTo(target.id).add(rel)
    this._outgoingFrom(source.id).add(rel)

    const relParent = commonAncestor(source.id, target.id)
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this._internalOf(ancestor).add(rel)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(relation.source)) {
      if (sourceAncestor === relParent) {
        break
      }
      this._outgoingFrom(sourceAncestor).add(rel)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(relation.target)) {
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

  public isLayouted(): this is LikeC4Model<LayoutedLikeC4Model> {
    return this.$model.__ === 'layouted'
  }
}

export namespace LikeC4Model {
  export type Sources = ComputedLikeC4Model | LayoutedLikeC4Model

  // export const Element = ElementModel
  export type Element<M extends ALikeC4Model = Sources> = ElementModel<M>

  // export const Relation = RelationshipModel
  export type Relation<M extends ALikeC4Model = Sources> = RelationshipModel<M>

  // export const View = LikeC4ViewModel
  export type View<M extends ALikeC4Model = Sources, V extends ComputedView | DiagramView = ViewType<M>> =
    LikeC4ViewModel<M, V>

  // export const Node = NodeModel
  export type Node<M extends ALikeC4Model = Sources, V extends ComputedView | DiagramView = ViewType<M>> = NodeModel<
    M,
    V
  >

  // export const Edge = EdgeModel
  export type Edge<M extends ALikeC4Model = Sources, V extends ComputedView | DiagramView = ViewType<M>> = EdgeModel<
    M,
    V
  >

  // export const Deployment = LikeC4DeploymentModel
  export type Deployment<M extends ALikeC4Model = Sources> = LikeC4DeploymentModel<M>

  export type Computed = LikeC4Model<ComputedLikeC4Model>
  export type Layouted = LikeC4Model<LayoutedLikeC4Model>
}
