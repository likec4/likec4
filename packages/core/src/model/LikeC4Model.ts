import { entries, isNullish, map, pipe, prop, sort, sortBy, values } from 'remeda'
import { invariant, nonNullable } from '../errors'
import type {
  AnyAux,
  aux,
  ComputedLikeC4ModelData,
  Element,
  IteratorLike,
  LayoutedLikeC4ModelData,
  LikeC4ModelData,
  LikeC4ModelDump,
  ModelGlobals,
  ParsedLikeC4ModelData,
  Relationship,
  scalar,
  Specification,
  Unknown,
} from '../types'
import { type ProjectId, GlobalFqn, isGlobalFqn } from '../types'
import { compareNatural, ifilter, memoizeProp } from '../utils'
import { ancestorsFqn, commonAncestor, parentFqn, sortParentsFirst } from '../utils/fqn'
import { DefaultMap } from '../utils/mnemonist'
import type {
  DeployedInstanceModel,
  DeploymentNodeModel,
  DeploymentRelationModel,
} from './DeploymentElementModel'
import { LikeC4DeploymentModel } from './DeploymentModel'
import { type ElementsIterator, ElementModel } from './ElementModel'
import { type RelationshipsIterator, RelationshipModel } from './RelationModel'
import {
  type $View,
  type ElementOrFqn,
  type IncomingFilter,
  type LikeC4ModelFromDump,
  type OutgoingFilter,
  getId,
} from './types'
import { type ViewsIterator, LikeC4ViewModel } from './view/LikeC4ViewModel'
import type { NodeModel } from './view/NodeModel'

abstract class BoundLikeC4Model<
  A extends AnyAux,
  ElementId extends string,
  ViewId extends string,
  Tag extends string,
  Fqn extends scalar.Fqn,
> // Fqn extends scalar.Fqn,
// StrViewId extends scalar.ViewId = scalar.ViewId<ElementId>,
{
  /**
   * Don't use in runtime, only for type inference
   */
  readonly Aux!: A
  /**
  /**
   * Don't use in runtime, only for type inference
   */
  readonly ViewType!: $View<A>

  protected readonly _elements = new Map<Fqn, ElementModel<A>>()
  // Parent element for given FQN
  protected readonly _parents = new Map<ElementId, ElementModel<A>>()
  // Children elements for given FQN
  protected readonly _children = new DefaultMap<ElementId, Set<ElementModel<A>>>(() => new Set())

  protected readonly _rootElements = new Set<ElementModel<A>>()

  protected readonly _relations = new Map<scalar.RelationId, RelationshipModel<A>>()

  // Incoming to an element or its descendants
  protected readonly _incoming = new DefaultMap<ElementId, Set<RelationshipModel<A>>>(() => new Set())

  // Outgoing from an element or its descendants
  protected readonly _outgoing = new DefaultMap<ElementId, Set<RelationshipModel<A>>>(() => new Set())

  // Relationships inside the element, among descendants
  protected readonly _internal = new DefaultMap<ElementId, Set<RelationshipModel<A>>>(() => new Set())

  protected readonly _views = new Map<ViewId, LikeC4ViewModel<A>>()

  protected readonly _allTags = new DefaultMap<Tag, Set<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>>(
    () => new Set(),
  )

  public abstract readonly $model: LikeC4ModelData<A>
  public abstract readonly deployment: LikeC4DeploymentModel<A>

  get type(): 'computed' | 'layouted' {
    return this.$model.__ ?? 'computed'
  }

  get projectId(): aux.ProjectId<A> {
    return this.$model.projectId ?? 'unknown' as any
  }

  get specification(): Specification<A> {
    return this.$model.specification
  }

  /**
   * Returns true if the model was created from a parsed data
   * (not computed or layouted)
   */
  get isFromParsed(): boolean {
    return isNullish(this.$model.__)
  }

  // isLayouted<This extends LikeC4Model<A>>(this: This): this is LikeC4Model.Layouted<A> {
  isLayouted(): this is LikeC4Model.Layouted<A> {
    return this.type === 'layouted'
  }

  isComputed(): this is LikeC4Model.Computed<A> {
    return this.type === 'computed'
  }

  public element(el: ElementOrFqn<ElementId>): ElementModel<A> {
    if (el instanceof ElementModel) {
      return el as ElementModel<A>
    }
    const id = getId(el)
    return nonNullable(this.findElement(id), `Element ${getId(el)} not found`)
  }
  public findElement(el: aux.complete<ElementId>): ElementModel<A> | null {
    return this._elements.get(el as any) ?? null
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): ElementsIterator<A> {
    return this._rootElements.values()
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): ElementsIterator<A> {
    return this._elements.values()
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): RelationshipsIterator<A> {
    return this._relations.values()
  }

  /**
   * Returns a specific relationship by its ID.
   * If the relationship is not found in the model, it will be searched in the deployment model.
   * Search can be limited to the model or deployment model only.
   */
  public relationship(id: scalar.RelationId, type: 'model'): RelationshipModel<A>
  public relationship(id: scalar.RelationId, type: 'deployment'): DeploymentRelationModel<A>
  public relationship(
    id: scalar.RelationId,
    type?: 'model' | 'deployment',
  ): RelationshipModel<A> | DeploymentRelationModel<A>
  public relationship(
    id: scalar.RelationId,
    type: 'model' | 'deployment' | undefined,
  ): RelationshipModel<A> | DeploymentRelationModel<A> {
    if (type === 'deployment') {
      return this.deployment.relationship(id)
    }
    let model = this._relations.get(id) ?? null
    if (model || type === 'model') {
      return nonNullable(model, `Model relation ${id} not found`)
    }
    // We did not find the relation in the model, let's search in the deployment
    return nonNullable(this.deployment.findRelationship(id), `No model/deployment relation ${id} not found`)
  }

  public findRelationship(id: scalar.RelationId, type: 'model'): RelationshipModel<A> | null
  public findRelationship(id: scalar.RelationId, type: 'deployment'): DeploymentRelationModel<A> | null
  public findRelationship(
    id: scalar.RelationId,
    type?: 'model' | 'deployment',
  ): RelationshipModel<A> | DeploymentRelationModel<A> | null
  public findRelationship(
    id: scalar.RelationId,
    type: 'model' | 'deployment' | undefined,
  ): RelationshipModel<A> | DeploymentRelationModel<A> | null {
    if (type === 'deployment') {
      return this.deployment.findRelationship(id)
    }
    let model = this._relations.get(id) ?? null
    if (model || type === 'model') {
      return model
    }
    return this.deployment.findRelationship(id)
  }

  /**
   * Returns all views in the model.
   */
  public views(): IteratorLike<LikeC4ViewModel<A>> {
    return this._views.values()
  }

  /**
   * Returns a specific view by its ID.
   */
  public view(viewId: ViewId): LikeC4ViewModel<A> {
    return nonNullable(this._views.get(viewId), `View ${viewId} not found`)
  }
  public findView(viewId: aux.complete<ViewId>): LikeC4ViewModel<A> | null {
    return this._views.get(viewId as any) ?? null
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: ElementOrFqn<ElementId>): ElementModel<A> | null {
    const id = getId(element)
    return this._parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: ElementOrFqn<ElementId>): ReadonlySet<ElementModel<A>> {
    const id = getId(element)
    return this._children.get(id)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(element: ElementOrFqn<ElementId>): ElementsIterator<A> {
    const id = getId(element)
    const parent = this._parents.get(id)
    const siblings = parent ? this._children.get(parent.id).values() : this.roots()
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
  public *ancestors(element: ElementOrFqn<ElementId>): ElementsIterator<A> {
    let id = getId(element)
    let parent
    while (parent = this._parents.get(id)) {
      yield parent
      id = parent.id
    }
    return
  }

  /**
   * Get all descendant elements (i.e. children, children’s children, etc.)
   */
  public *descendants(element: ElementOrFqn<ElementId>): ElementsIterator<A> {
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
    element: ElementOrFqn<ElementId>,
    filter: IncomingFilter = 'all',
  ): RelationshipsIterator<A> {
    const id = getId(element)
    for (const rel of this._incoming.get(id)) {
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
    element: ElementOrFqn<ElementId>,
    filter: OutgoingFilter = 'all',
  ): RelationshipsIterator<A> {
    const id = getId(element)
    for (const rel of this._outgoing.get(id)) {
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

  public globals(): ModelGlobals {
    return {
      predicates: {
        ...this.$model.globals?.predicates,
      },
      dynamicPredicates: {
        ...this.$model.globals?.dynamicPredicates,
      },
      styles: {
        ...this.$model.globals?.styles,
      },
    }
  }

  /**
   * Returns all tags used in the model.
   */
  get tags(): aux.Tags<A> {
    return memoizeProp(this, Symbol('tags'), () => Array.from(this._allTags.keys())) as unknown as aux.Tags<A>
  }

  /**
   * Returns all tags used in the model, sorted by usagecount (descending).
   */
  get tagsSortedByUsageCount(): aux.Tags<A> {
    return memoizeProp(this, Symbol('tagsSortedByUsageCount'), () =>
      pipe(
        [...this._allTags.entries()],
        map(([tag, marked]) => ({
          tag,
          count: marked.size,
        })),
        sortBy(
          [prop('count'), 'desc'],
        ),
        map(prop('tag')),
      )) as unknown as aux.Tags<A>
  }

  /**
   * Returns all elements, relationships and views marked with the given tag.
   */
  public findByTag(tag: Tag): IteratorLike<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>
  public findByTag(tag: Tag, type: 'model-elements'): ElementsIterator<A>
  public findByTag(tag: Tag, type: 'views'): ViewsIterator<A>
  public findByTag(
    tag: Tag,
    type?: 'model-elements' | 'views' | undefined,
  ) {
    return ifilter(this._allTags.get(tag), (el) => {
      if (type === 'model-elements') {
        return el instanceof ElementModel
      }
      if (type === 'views') {
        return el instanceof LikeC4ViewModel
      }
      return true
    })
  }
}

export class LikeC4Model<A extends AnyAux = Unknown>
  extends BoundLikeC4Model<A, aux.ElementId<A>, aux.ViewId<A>, aux.Tag<A>, aux.StrictFqn<A>>
{
  /**
   * Creates a new LikeC4Model instance from a parsed model data.\
   * This model omits the views, as they must be computed (or layouted)
   * Parsed model is used for computing views
   */
  static fromParsed<T extends AnyAux>(parsed: ParsedLikeC4ModelData<T>): LikeC4Model<T> {
    const { views: _omit, ...rest } = parsed
    return new LikeC4Model({
      ...rest,
      views: {},
    } as any)
  }

  /**
   * Creates a new LikeC4Model instance from the provided model data.
   *
   * @typeParam M - Type parameter constrained to AnyLikeC4Model
   * @param model - The model data to create a LikeC4Model from
   * @returns A new LikeC4Model instance with the type derived from the input model
   */

  static create<T extends AnyAux>(model: LayoutedLikeC4ModelData<T>): LikeC4Model.Layouted<T>
  static create<T extends AnyAux>(model: ComputedLikeC4ModelData<T>): LikeC4Model.Computed<T>
  static create<T extends AnyAux>(model: LikeC4ModelData<T>): LikeC4Model<T> {
    return new LikeC4Model(model)
  }

  /**
   * Creates a new LikeC4Model instance and infers types from a model dump.\
   * Model dump expected to be computed or layouted.
   *
   * @typeParam D - A constant type parameter extending LikeC4ModelDump
   * @param dump - The model dump to create the instance from
   * @returns A  new LikeC4Model instance with types inferred from the dump
   */
  static fromDump<const D extends LikeC4ModelDump>(dump: D): LikeC4ModelFromDump<D> {
    return new LikeC4Model(dump as any) as any
  }

  public readonly deployment: LikeC4DeploymentModel<A>

  constructor(
    public readonly $model: LikeC4ModelData<A>,
  ) {
    super()
    for (const element of values($model.elements as Record<string, Element<A>>)) {
      const el = this.addElement(element)
      for (const tag of el.tags) {
        this._allTags.get(tag).add(el)
      }
    }
    for (const [projectId, elements] of entries($model.imports ?? {})) {
      for (const element of sortParentsFirst(elements)) {
        const el = this.addImportedElement(projectId as unknown as ProjectId<A>, element)
        for (const tag of el.tags) {
          this._allTags.get(tag).add(el)
        }
      }
    }
    for (const relation of values($model.relations)) {
      const el = this.addRelation(relation)
      for (const tag of el.tags) {
        this._allTags.get(tag).add(el)
      }
    }
    this.deployment = new LikeC4DeploymentModel(this, $model.deployments)
    const views = pipe(
      values($model.views as any as Record<string, $View<A>>),
      sort((a, b) => compareNatural(a.title ?? 'untitled', b.title ?? 'untitled')),
    )
    for (const view of views) {
      const vm = new LikeC4ViewModel(this, Object.freeze(view) as $View<A>)
      this._views.set(view.id, vm)
      for (const tag of vm.tags) {
        this._allTags.get(tag).add(vm)
      }
    }
  }

  private addElement(element: Element<A>) {
    if (this._elements.has(element.id)) {
      throw new Error(`Element ${element.id} already exists`)
    }
    const el = new ElementModel(this, Object.freeze(element))
    this._elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      invariant(this._elements.has(parentId), `Parent ${parentId} of ${el.id} not found`)
      this._parents.set(el.id, this.element(parentId))
      this._children.get(parentId).add(el)
    } else {
      this._rootElements.add(el)
    }
    return el
  }

  private addImportedElement(projectId: ProjectId<A>, element: Element<A>) {
    invariant(!isGlobalFqn(element.id), `Imported element already has global FQN`)
    const id = GlobalFqn(projectId, element.id) as unknown as aux.StrictFqn<A>
    if (this._elements.has(id)) {
      throw new Error(`Element ${id} already exists`)
    }
    const el = new ElementModel(
      this,
      Object.freeze({
        ...element,
        id,
      }),
    )
    this._elements.set(el.id, el)
    let parentId = parentFqn(el.id)
    while (parentId) {
      // For imported elements - id has format `@projectId.fqn`
      // We need to exclude `@projectId` from the parentId
      if (parentId.includes('.') && this._elements.has(parentId)) {
        this._parents.set(el.id, this.element(parentId))
        this._children.get(parentId).add(el)
        return el
      }
      parentId = parentFqn(parentId)
    }
    this._rootElements.add(el)
    return el
  }

  private addRelation(relation: Relationship<A>) {
    if (this._relations.has(relation.id)) {
      throw new Error(`Relation ${relation.id} already exists`)
    }
    const rel = new RelationshipModel(
      this,
      Object.freeze(relation),
    )
    const { source, target } = rel
    this._relations.set(rel.id, rel)
    this._incoming.get(target.id).add(rel)
    this._outgoing.get(source.id).add(rel)

    const relParent = commonAncestor(source.id, target.id)
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this._internal.get(ancestor).add(rel)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(source.id)) {
      if (sourceAncestor === relParent) {
        break
      }
      this._outgoing.get(sourceAncestor).add(rel)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(target.id)) {
      if (targetAncestor === relParent) {
        break
      }
      this._incoming.get(targetAncestor).add(rel)
    }
    return rel
  }
}

/**
 *  When you do not need types in the model
 */
export type AnyLikeC4Model = LikeC4Model<AnyAux>

export namespace LikeC4Model {
  export const EMPTY = LikeC4Model.create<Unknown>({
    __: 'computed',
    projectId: 'default' as never,
    specification: {
      elements: {},
      relationships: {},
      deployments: {},
      tags: {},
    },
    globals: {
      predicates: {},
      dynamicPredicates: {},
      styles: {},
    },
    deployments: {
      elements: {},
      relations: {},
    },
    elements: {},
    relations: {},
    views: {},
    imports: {},
  })

  export type Parsed<A = Unknown> = A extends AnyAux ? LikeC4Model<aux.setStage<A, 'parsed'>> : never
  export type Computed<A = Unknown> = A extends AnyAux ? LikeC4Model<aux.setStage<A, 'computed'>> : never
  export type Layouted<A = Unknown> = A extends AnyAux ? LikeC4Model<aux.setStage<A, 'layouted'>> : never

  export type Node<A = Unknown> = A extends AnyAux ? NodeModel<A> : never
  export type Element<A = Unknown> = A extends AnyAux ? ElementModel<A> : never
  export type Relationship<A = Unknown> = A extends AnyAux ? RelationshipModel<A> : never
  export type View<A = Unknown> = A extends AnyAux ? LikeC4ViewModel<A> : never

  export type DeploymentNode<A = Unknown> = A extends AnyAux ? DeploymentNodeModel<A> : never
  export type DeployedInstance<A = Unknown> = A extends AnyAux ? DeployedInstanceModel<A> : never

  export type AnyRelation<M = Unknown> = M extends AnyAux ? RelationshipModel<M> | DeploymentRelationModel<M> : never
}
