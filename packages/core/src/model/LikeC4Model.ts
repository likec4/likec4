import DefaultMap from 'mnemonist/default-map'
import { pipe, sort, values } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import { invariant, nonNullable } from '../errors'
import type { ComputedView, DiagramView } from '../types'
import type { Element } from '../types/element'
import { type Tag as C4Tag } from '../types/element'
import type { AnyLikeC4Model, ParsedLikeC4ModelDump } from '../types/model'
import type { Relation } from '../types/relation'
import { compareNatural } from '../utils'
import { ancestorsFqn, commonAncestor, parentFqn } from '../utils/fqn'
import type {
  DeployedInstanceModel,
  DeploymentElementModel,
  DeploymentNodeModel,
  DeploymentRelationModel
} from './DeploymentElementModel'
import { LikeC4DeploymentModel } from './DeploymentModel'
import { ElementModel, type ElementsIterator } from './ElementModel'
import { RelationshipModel, type RelationshipsIterator } from './RelationModel'
import { type AnyAux, type Aux, getId, type IncomingFilter, type OutgoingFilter } from './types'
import { EdgeModel } from './view/EdgeModel'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'
import { NodeModel } from './view/NodeModel'

export class LikeC4Model<M extends AnyAux = LikeC4Model.Any> {
  /**
   * Only available in compile time
   */
  readonly Aux!: M

  readonly #elements = new Map<M['Element'], ElementModel<M>>()
  // Parent element for given FQN
  readonly #parents = new Map<M['Element'], ElementModel<M>>()
  // Children elements for given FQN
  readonly #children = new DefaultMap<M['Element'], Set<ElementModel<M>>>(() => new Set())

  readonly #rootElements = new Set<ElementModel<M>>()

  readonly #relations = new Map<M['RelationId'], RelationshipModel<M>>()

  // Incoming to an element or its descendants
  readonly #incoming = new DefaultMap<M['Element'], Set<RelationshipModel<M>>>(() => new Set())

  // Outgoing from an element or its descendants
  readonly #outgoing = new DefaultMap<M['Element'], Set<RelationshipModel<M>>>(() => new Set())

  // Relationships inside the element, among descendants
  readonly #internal = new DefaultMap<M['Element'], Set<RelationshipModel<M>>>(() => new Set())

  readonly #views = new Map<M['ViewIdLiteral'], LikeC4ViewModel<M>>()

  readonly #allTags = new DefaultMap<C4Tag, Set<ElementModel<M> | RelationshipModel<M> | LikeC4ViewModel<M>>>(() =>
    new Set()
  )

  public readonly deployment: LikeC4DeploymentModel<M>

  static create<const M extends AnyLikeC4Model>(model: M) {
    type T = Aux.FromModel<M>
    return new LikeC4Model<T>(model as any)
  }

  /**
   * This method is supposed to be used only in dumps
   */
  static fromDump<const M extends ParsedLikeC4ModelDump>(dump: M) {
    type T = Aux.FromDump<M>
    return new LikeC4Model<T>(dump as any)
  }

  private constructor(
    public readonly $model: M['Model']
  ) {
    for (const element of values($model.elements)) {
      const el = this.addElement(element)
      for (const tag of el.tags) {
        this.#allTags.get(tag).add(el)
      }
    }
    for (const relation of values($model.relations)) {
      const el = this.addRelation(relation)
      for (const tag of el.tags) {
        this.#allTags.get(tag).add(el)
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
        this.#allTags.get(tag).add(vm)
      }
    }
  }

  get type(): 'computed' | 'layouted' {
    return this.$model.__ ?? 'computed'
  }

  public element(el: M['ElementOrFqn']): ElementModel<M> {
    if (el instanceof ElementModel) {
      return el
    }
    const id = getId(el)
    return nonNullable(this.findElement(id), `Element ${getId(el)} not found`)
  }
  public findElement(el: LiteralUnion<M['Element'], string>): ElementModel<M> | null {
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
   * If the relationship is not found in the model, it will be searched in the deployment model.
   * Search can be limited to the model or deployment model only.
   */
  public relationship(id: M['RelationId'], type: 'model'): RelationshipModel<M>
  public relationship(id: M['RelationId'], type: 'deployment'): DeploymentRelationModel<M>
  public relationship(
    id: M['RelationId'],
    type?: 'model' | 'deployment'
  ): RelationshipModel<M> | DeploymentRelationModel<M>
  public relationship(
    id: M['RelationId'],
    type: 'model' | 'deployment' | undefined
  ): RelationshipModel<M> | DeploymentRelationModel<M> {
    if (type === 'deployment') {
      return this.deployment.relationship(id)
    }
    let model = this.#relations.get(id) ?? null
    if (model || type === 'model') {
      return nonNullable(model, `Model relation ${id} not found`)
    }
    // We did not find the relation in the model, let's search in the deployment
    return nonNullable(this.deployment.findRelationship(id), `No model/deployment relation ${id} not found`)
  }

  public findRelationship(id: LiteralUnion<M['RelationId'], string>, type: 'model'): RelationshipModel<M> | null
  public findRelationship(
    id: LiteralUnion<M['RelationId'], string>,
    type: 'deployment'
  ): DeploymentRelationModel<M> | null
  public findRelationship(
    id: LiteralUnion<M['RelationId'], string>,
    type?: 'model' | 'deployment'
  ): RelationshipModel<M> | DeploymentRelationModel<M> | null
  public findRelationship(
    id: LiteralUnion<M['RelationId'], string>,
    type: 'model' | 'deployment' | undefined
  ): RelationshipModel<M> | DeploymentRelationModel<M> | null {
    if (type === 'deployment') {
      return this.deployment.findRelationship(id)
    }
    let model = this.#relations.get(id as M['RelationId']) ?? null
    if (model || type === 'model') {
      return model
    }
    return this.deployment.findRelationship(id)
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
  public children(element: M['ElementOrFqn']): ReadonlySet<ElementModel<M>> {
    const id = getId(element) as M['Fqn']
    return this.#children.get(id)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(element: M['ElementOrFqn']): ElementsIterator<M> {
    const id = getId(element) as M['Fqn']
    const parent = this.#parents.get(id)
    const siblings = parent ? this.#children.get(parent.id).values() : this.roots()
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
    element: M['ElementOrFqn'],
    filter: OutgoingFilter = 'all'
  ): RelationshipsIterator<M> {
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

  private addElement(element: Element) {
    if (this.#elements.has(element.id)) {
      throw new Error(`Element ${element.id} already exists`)
    }
    const el = new ElementModel(this, element)
    this.#elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      invariant(this.#elements.has(parentId), `Parent ${parentId} of ${el.id} not found`)
      this.#parents.set(el.id, this.element(parentId))
      this.#children.get(parentId).add(el)
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
    this.#incoming.get(target.id).add(rel)
    this.#outgoing.get(source.id).add(rel)

    const relParent = commonAncestor(source.id, target.id)
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this.#internal.get(ancestor).add(rel)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(relation.source)) {
      if (sourceAncestor === relParent) {
        break
      }
      this.#outgoing.get(sourceAncestor).add(rel)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(relation.target)) {
      if (targetAncestor === relParent) {
        break
      }
      this.#incoming.get(targetAncestor).add(rel)
    }
    return rel
  }
}

export namespace LikeC4Model {
  export type Any = Aux<
    string,
    string,
    string,
    ComputedView | DiagramView
  >

  export type Element<M extends AnyAux = Any> = ElementModel<M>

  // Relationship in logical model
  export type Relation<M extends AnyAux = Any> = RelationshipModel<M>

  // Relationship in logical or deployment model
  export type AnyRelation<M extends AnyAux = Any> = RelationshipModel<M> | DeploymentRelationModel<M>

  export type View<
    M extends AnyAux = Any,
    V extends ComputedView | DiagramView = M['ViewType']
  > = LikeC4ViewModel<M, V>

  export type Node<
    M extends AnyAux = Any,
    V extends ComputedView | DiagramView = M['ViewType']
  > = NodeModel<M, V>

  export type Edge<
    M extends AnyAux = Any,
    V extends ComputedView | DiagramView = M['ViewType']
  > = EdgeModel<M, V>

  export type DeploymentModel<M extends AnyAux = AnyAux> = LikeC4DeploymentModel<M>

  export type Deployment<M extends AnyAux = AnyAux> = DeploymentElementModel<M>
  export type DeploymentNode<M extends AnyAux = AnyAux> = DeploymentNodeModel<M>
  export type DeployedInstance<M extends AnyAux = AnyAux> = DeployedInstanceModel<M>

  export type Typed<
    Elements extends string = string,
    Deployments extends string = string,
    Views extends string = string,
    ViewType = DiagramView<Views> | ComputedView<Views>
  > = Aux<Elements, Deployments, Views, ViewType>

  export type Computed<
    Elements extends string = string,
    Deployments extends string = string,
    Views extends string = string
  > = LikeC4Model<Typed<Elements, Deployments, Views, ComputedView<Views>>>

  export type Layouted<
    Elements extends string = string,
    Deployments extends string = string,
    Views extends string = string
  > = LikeC4Model<Typed<Elements, Deployments, Views, DiagramView<Views>>>
}
