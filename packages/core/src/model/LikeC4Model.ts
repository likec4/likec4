import { pipe, sort, values } from 'remeda'
import type { IsLiteral, LiteralUnion } from 'type-fest'
import { invariant, nonNullable } from '../errors'
import type { ComputedView, DiagramView } from '../types'
import { type Element as C4Element, type Tag as C4Tag } from '../types/element'
import type { Fqn as C4Fqn } from '../types/element'
import type { AnyLikeC4Model, ComputedLikeC4Model, LayoutedLikeC4Model } from '../types/model'
import type { Relation } from '../types/relation'
import type { RelationID as C4RelationID } from '../types/relation'
import type { EdgeId as C4EdgeId, NodeId as C4NodeId, ViewID as C4ViewID } from '../types/view'
import { compareNatural, getOrCreate } from '../utils'
import { ancestorsFqn, commonAncestor, parentFqn } from '../utils/fqn'
import { LikeC4DeploymentModel } from './DeploymentModel'
import { ElementModel, type ElementsIterator } from './ElementModel'
import { RelationshipModel, type RelationshipsIterator } from './RelationModel'
import { type AnyAux, getId, type IncomingFilter, type OutgoingFilter } from './types'
import { EdgeModel } from './view/EdgeModel'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'
import { NodeModel } from './view/NodeModel'

export class LikeC4Model<M extends AnyAux = AnyAux> {
  readonly #elements = new Map<M['FqnLiteral'], ElementModel<M>>()
  // Parent element for given FQN
  readonly #parents = new Map<M['FqnLiteral'], ElementModel<M>>()
  // Children elements for given FQN
  readonly #children = new Map<M['FqnLiteral'], Set<ElementModel<M>>>()

  readonly #rootElements = new Set<ElementModel<M>>()

  readonly #relations = new Map<M['RelationId'], RelationshipModel<M>>()

  // Incoming to an element or its descendants
  readonly #incoming = new Map<M['FqnLiteral'], Set<RelationshipModel<M>>>()

  // Outgoing from an element or its descendants
  readonly #outgoing = new Map<M['FqnLiteral'], Set<RelationshipModel<M>>>()

  // Relationships inside the element, among descendants
  readonly #internal = new Map<M['FqnLiteral'], Set<RelationshipModel<M>>>()

  readonly #views = new Map<M['ViewIdLiteral'], LikeC4ViewModel<M>>()

  readonly #allTags = new Map<C4Tag, Set<ElementModel<M> | RelationshipModel<M> | LikeC4ViewModel<M>>>()

  public readonly deployment: LikeC4DeploymentModel<M>

  static create<M extends AnyLikeC4Model>(model: M): LikeC4Model.FromModel<M> {
    return new LikeC4Model(model)
  }

  private constructor(
    public readonly $model: M['Model']
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
      const vm = new LikeC4ViewModel(this, view as M['ViewType'])
      this.#views.set(view.id, vm)
      for (const tag of vm.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(vm)
      }
    }
  }

  get type(): 'computed' | 'layouted' {
    return this.$model.__ ?? 'computed'
  }

  public element(el: M['ElementOrFqn']): ElementModel<M> {
    const id = getId(el)
    return nonNullable(this.findElement(id), `Element ${getId(el)} not found`)
  }
  public findElement(el: LiteralUnion<M['FqnLiteral'], string>): ElementModel<M> | null {
    // const id = getId(el) as C4Fqn
    return this.#elements.get(el) ?? null
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
  public relationship(id: M['RelationId']): RelationshipModel<M> {
    return nonNullable(this.#relations.get(id), `Relation ${id} not found`)
  }
  public findRelationship(id: LiteralUnion<M['RelationId'], string>): RelationshipModel<M> | null {
    return this.#relations.get(id as M['RelationId']) ?? null
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
  public view(viewId: M['ViewIdLiteral']): LikeC4ViewModel<M> {
    return nonNullable(this.#views.get(viewId), `View ${viewId} not found`)
  }
  public findView(viewId: LiteralUnion<M['ViewId'], string>): LikeC4ViewModel<M> {
    return nonNullable(this.#views.get(viewId), `View ${viewId} not found`)
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: M['ElementOrFqn']): ElementModel<M> | null {
    const id = getId(element)
    return this.#parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: M['ElementOrFqn']) {
    const id = getId(element) as M['Fqn']
    return this._childrenOf(id).values()
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(element: M['ElementOrFqn']): ElementsIterator<M> {
    const id = getId(element) as M['Fqn']
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
  public *ancestors(element: M['ElementOrFqn']): ElementsIterator<M> {
    let id = getId(element) as M['Fqn']
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
  public *descendants(element: M['ElementOrFqn']): ElementsIterator<M> {
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
    element: M['ElementOrFqn'],
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
    element: M['ElementOrFqn'],
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

  private _childrenOf(id: M['FqnLiteral']) {
    return getOrCreate(this.#children, id, () => new Set())
  }

  private _incomingTo(id: M['FqnLiteral']) {
    return getOrCreate(this.#incoming, id, () => new Set())
  }

  private _outgoingFrom(id: M['FqnLiteral']) {
    return getOrCreate(this.#outgoing, id, () => new Set())
  }

  private _internalOf(id: M['FqnLiteral']) {
    return getOrCreate(this.#internal, id, () => new Set())
  }

  // public isLayouted(): this is LikeC4Model<LayoutedLikeC4Model> {
  //   return this.$model.__ === 'layouted'
  // }
}

type WithId<Id> = { id: Id }

export namespace LikeC4Model {
  /**
   * Auxilary type to keep track
   */
  export interface Aux<
    Fqn extends string,
    DeploymentFqn extends string,
    ViewId extends string,
    Model extends AnyLikeC4Model
  > {
    Model: Model

    // If Fqn is just a string, then we use generic Fqn to have better hints in the editor
    Fqn: IsLiteral<Fqn> extends true ? C4Fqn<Fqn> : C4Fqn
    FqnLiteral: Fqn
    ElementOrFqn: Fqn | WithId<this['Fqn']>

    DeploymentFqn: IsLiteral<DeploymentFqn> extends true ? C4Fqn<DeploymentFqn> : C4Fqn
    DeploymentLiteral: DeploymentFqn
    DeploymentOrFqn: DeploymentFqn | WithId<this['DeploymentFqn']>

    ViewId: IsLiteral<ViewId> extends true ? C4ViewID<ViewId> : C4ViewID
    ViewIdLiteral: ViewId
    ViewType: Model['views'][ViewId]

    RelationId: C4RelationID
    NodeId: C4NodeId
    NodeIdLiteral: string
    EdgeId: C4EdgeId
    EdgeIdLiteral: string

    NodeOrId: LiteralUnion<this['NodeIdLiteral'], string> | WithId<this['NodeId']>
    EdgeOrId: LiteralUnion<this['EdgeIdLiteral'], string> | WithId<this['EdgeId']>
  }

  export namespace Aux {
    export type Layouted<
      Fqn extends string = string,
      DeploymentFqn extends string = string,
      ViewId extends string = string
    > = Aux<Fqn, DeploymentFqn, ViewId, LayoutedLikeC4Model>
  }

  export type Any = Aux<
    string,
    string,
    string,
    AnyLikeC4Model
  >

  export type FromModel<M> = LikeC4Model<
    M extends AnyLikeC4Model<
      infer Fqn extends string,
      infer DeploymentFqn extends string,
      infer ViewId extends string,
      any
    > ? Aux<Fqn, DeploymentFqn, ViewId, M>
      : Aux<string, string, string, ComputedLikeC4Model | LayoutedLikeC4Model>
  >

  export type Element<M extends AnyAux = AnyAux> = ElementModel<M>

  export type Relation<M extends AnyAux = AnyAux> = RelationshipModel<M>

  export type View<
    M extends AnyAux = AnyAux,
    V extends ComputedView | DiagramView = M['ViewType']
  > = LikeC4ViewModel<M, V>

  export type Node<
    M extends AnyAux = AnyAux,
    V extends ComputedView | DiagramView = M['ViewType']
  > = NodeModel<M, V>

  export type Edge<
    M extends AnyAux = AnyAux,
    V extends ComputedView | DiagramView = M['ViewType']
  > = EdgeModel<M, V>

  export type Deployment<M extends Any = Any> = LikeC4DeploymentModel<M>

  export type Typed<
    Model extends AnyLikeC4Model = ComputedLikeC4Model | LayoutedLikeC4Model,
    Fqn extends string = string,
    DeploymentFqn extends string = string,
    ViewId extends string = string
  > = LikeC4Model<Aux<Fqn, DeploymentFqn, ViewId, Model>>

  export type Computed = LikeC4Model.Typed<ComputedLikeC4Model>
  export type Layouted = LikeC4Model.Typed<LayoutedLikeC4Model>
}
