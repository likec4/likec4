import { isString, pipe, sort, values } from 'remeda'
import { invariant, nonNullable } from '../../errors'
import type { ViewID } from '../../types'
import { type Element as C4Element, type Fqn, type Tag as C4Tag } from '../../types/element'
import type { ALikeC4Model, ComputedLikeC4Model, LayoutedLikeC4Model as C4LayoutedLikeC4Model } from '../../types/model'
import type { Relation, RelationID } from '../../types/relation'
import { compareNatural, getOrCreate } from '../../utils'
import { ancestorsFqn, commonAncestor, parentFqn } from '../../utils/fqn'
import { getId, type IncomingFilter, type OutgoingFilter } from '../types'
import { ElementModel } from './ElementModel'
import { RelationModel } from './RelationModel'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'

export type Source = ALikeC4Model

export type ViewType<S extends Source> = S['views'][ViewID]

type ElementOrFqn = Fqn | { id: Fqn }

// type ViewModel<S extends Source> = LikeC4ViewModel<ViewType<S>, S>

export class LikeC4Model<M extends Source = ComputedLikeC4Model> {
  #elements = new Map<Fqn, ElementModel<M>>()
  // Parent element for given FQN
  #parents = new Map<Fqn, ElementModel<M>>()
  // Children elements for given FQN
  #children = new Map<Fqn, Set<ElementModel<M>>>()

  #rootElements = new Set<ElementModel<M>>()

  #relations = new Map<RelationID, RelationModel<M>>()

  // Incoming to an element or its descendants
  #incoming = new Map<Fqn, Set<RelationModel<M>>>()

  // Outgoing from an element or its descendants
  #outgoing = new Map<Fqn, Set<RelationModel<M>>>()

  // Relationships inside the element, among descendants
  #internal = new Map<Fqn, Set<RelationModel<M>>>()

  // private _cacheAscendingSiblings = new Map<Fqn, ElementModel<M>[]>()

  #views = new Map<ViewID, LikeC4ViewModel<M>>()

  #allTags = new Map<C4Tag, Set<ElementModel<M> | RelationModel<M>>>()

  constructor(
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
    const views = pipe(
      values($model.views),
      sort((a, b) => compareNatural(a.title ?? 'untitled', b.title ?? 'untitled'))
    )
    for (const view of views) {
      const vm = new LikeC4ViewModel(this, view as ViewType<M>)
      this.#views.set(view.id, vm)
    }
  }

  public element(el: ElementOrFqn): ElementModel<M> {
    const id = getId(el)
    return nonNullable(this.#elements.get(id), `Element ${id} not found`)
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): IteratorObject<ElementModel<M>> {
    return this.#rootElements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): IteratorObject<ElementModel<M>> {
    return this.#elements.values()
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): IteratorObject<RelationModel<M>> {
    return this.#relations.values()
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: RelationID) {
    return nonNullable(this.#relations.get(id), `Relation ${id} not found`)
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
  public siblings(element: ElementOrFqn) {
    const id = getId(element)
    const parent = this.#parents.get(id)
    const siblings = parent ? this._childrenOf(parent.id).values() : this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(element: ElementOrFqn): IteratorObject<ElementModel<M>> {
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
  public *descendants(element: ElementOrFqn): IteratorObject<ElementModel<M>> {
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
  ): IteratorObject<RelationModel<M>> {
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
  ): IteratorObject<RelationModel<M>> {
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
    const source = this.element(relation.source)
    const target = this.element(relation.target)
    const rel = new RelationModel(
      this,
      relation,
      source,
      target
    )
    this.#relations.set(rel.id, rel)
    this._incomingTo(relation.target).add(rel)
    this._outgoingFrom(relation.source).add(rel)

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

  public isDiagramModel(): this is LikeC4Model<C4LayoutedLikeC4Model> {
    return this.$model.__ === 'layouted'
  }
}
