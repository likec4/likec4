import { entries, map, pipe, prop, sort, sortBy, values } from 'remeda'
import type {
  Any,
  Aux,
  AuxFromDump,
  ComputedLikeC4ModelData,
  Element,
  IteratorLike,
  LayoutedLikeC4ModelData,
  LikeC4ModelDump,
  ModelGlobals,
  ParsedLikeC4ModelData,
  Relationship,
  scalar,
  Specification,
  WhereOperator,
} from '../types'
import { type ProjectId, _stage, GlobalFqn, isGlobalFqn, isOnStage, whereOperatorAsPredicate } from '../types'
import type * as aux from '../types/aux'
import { compareNatural, ifilter, invariant, memoizeProp, nonNullable } from '../utils'
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
  type $ModelData,
  type $View,
  type $ViewModel,
  type ElementOrFqn,
  type IncomingFilter,
  type OutgoingFilter,
  type RelationOrId,
  getId,
} from './types'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'
import type { NodeModel } from './view/NodeModel'

export class LikeC4Model<A extends Any = aux.Unknown> {
  /**
   * Don't use in runtime, only for type inference
   */
  readonly Aux!: A

  protected readonly _elements = new Map<aux.Fqn<A>, ElementModel<A>>()
  // Parent element for given FQN
  protected readonly _parents = new Map<aux.Fqn<A>, ElementModel<A>>()
  // Children elements for given FQN
  protected readonly _children = new DefaultMap<aux.Fqn<A>, Set<ElementModel<A>>>(() => new Set())

  protected readonly _rootElements = new Set<ElementModel<A>>()

  protected readonly _relations = new Map<scalar.RelationId, RelationshipModel<A>>()

  // Incoming to an element or its descendants
  protected readonly _incoming = new DefaultMap<aux.Fqn<A>, Set<RelationshipModel<A>>>(() => new Set())

  // Outgoing from an element or its descendants
  protected readonly _outgoing = new DefaultMap<aux.Fqn<A>, Set<RelationshipModel<A>>>(() => new Set())

  // Relationships inside the element, among descendants
  protected readonly _internal = new DefaultMap<aux.Fqn<A>, Set<RelationshipModel<A>>>(() => new Set())

  protected readonly _views = new Map<aux.ViewId<A>, LikeC4ViewModel<A>>()

  protected readonly _allTags = new DefaultMap<
    aux.Tag<A>,
    Set<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>
  >(
    () => new Set(),
  )

  static fromParsed<T extends Any>(model: ParsedLikeC4ModelData<T>): LikeC4Model.Parsed<T> {
    return new LikeC4Model<T>(model as any).asParsed
  }

  /**
   * Creates a new LikeC4Model instance from the provided model data.
   * Model with parsed data will not have views, as they must be computed
   * (this model is used for computing views)
   *
   * @typeParam M - Type parameter constrained to AnyLikeC4Model
   * @param model - The model data to create a LikeC4Model from
   * @returns A new LikeC4Model instance with the type derived from the input model
   */

  static create<T extends Any>(model: ParsedLikeC4ModelData<T>): LikeC4Model.Parsed<T>
  static create<T extends Any>(model: LayoutedLikeC4ModelData<T>): LikeC4Model.Layouted<T>
  static create<T extends Any>(model: ComputedLikeC4ModelData<T>): LikeC4Model.Computed<T>
  static create<T extends Any>(model: $ModelData<T>): LikeC4Model<T> {
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
  static fromDump<const D extends LikeC4ModelDump>(dump: D): LikeC4Model<AuxFromDump<D>> {
    const {
      _stage: stage = 'layouted',
      projectId = 'unknown',
      globals,
      imports,
      deployments,
      views,
      relations,
      elements,
      specification,
    } = dump
    return new LikeC4Model({
      [_stage]: stage as 'layouted',
      projectId,
      globals: {
        predicates: globals?.predicates ?? {},
        dynamicPredicates: globals?.dynamicPredicates ?? {},
        styles: globals?.styles ?? {},
      },
      imports: imports ?? {},
      deployments: {
        elements: deployments?.elements ?? {},
        relations: deployments?.relations ?? {},
      },
      views: views ?? {},
      relations: relations ?? {},
      elements: elements ?? {},
      specification,
    } as any)
  }

  public readonly deployment: LikeC4DeploymentModel<A>
  public readonly $data: $ModelData<A>

  constructor($data: $ModelData<A>) {
    this.$data = $data
    for (const [, element] of entries($data.elements)) {
      const el = this.addElement(element)
      for (const tag of el.tags) {
        this._allTags.get(tag).add(el)
      }
    }
    for (const [projectId, elements] of entries($data.imports ?? {})) {
      for (const element of sortParentsFirst(elements)) {
        const el = this.addImportedElement(projectId as unknown as ProjectId<A>, element)
        for (const tag of el.tags) {
          this._allTags.get(tag).add(el)
        }
      }
    }
    for (const relation of values($data.relations)) {
      const el = this.addRelation(relation)
      for (const tag of el.tags) {
        this._allTags.get(tag).add(el)
      }
    }

    this.deployment = new LikeC4DeploymentModel(this)

    if (isOnStage($data, 'computed') || isOnStage($data, 'layouted')) {
      const views = pipe(
        values($data.views as Record<string, $View<A>>),
        sort((a, b) => compareNatural(a.title ?? 'untitled', b.title ?? 'untitled')),
      )
      for (const view of views) {
        const vm = new LikeC4ViewModel(this, view)
        this._views.set(view.id, vm)
        for (const tag of vm.tags) {
          this._allTags.get(tag).add(vm)
        }
      }
    }
  }

  /**
   * Type narrows the model to the parsed stage.
   * This is useful for tests
   */
  get asParsed(): LikeC4Model.Parsed<A> {
    return this as any
  }
  /**
   * Type narrows the model to the layouted stage.
   * This is useful for tests
   */
  get asComputed(): LikeC4Model.Computed<A> {
    return this as any
  }
  /**
   * Type narrows the model to the layouted stage.
   * This is useful for tests
   */
  get asLayouted(): LikeC4Model.Layouted<A> {
    return this as any
  }

  /**
   * Type guard the model to the parsed stage.
   */
  public isParsed(this: LikeC4Model<any>): this is LikeC4Model<aux.toParsed<A>> {
    return this.stage === 'parsed'
  }
  /**
   * Type guard the model to the layouted stage.
   */
  public isLayouted(this: LikeC4Model<any>): this is LikeC4Model<aux.toLayouted<A>> {
    return this.stage === 'layouted'
  }
  /**
   * Type guard the model to the computed stage.
   */
  public isComputed(this: LikeC4Model<any>): this is LikeC4Model<aux.toComputed<A>> {
    return this.stage === 'computed'
  }

  /**
   * Keeping here for backward compatibility
   * @deprecated use {@link $data}
   */
  get $model(): $ModelData<A> {
    return this.$data
  }

  get stage(): aux.Stage<A> {
    return this.$data[_stage] as aux.Stage<A>
  }

  get projectId(): aux.ProjectId<A> {
    return this.$data.projectId ?? 'unknown' as any
  }

  get specification(): Specification<A> {
    return this.$data.specification
  }

  get globals(): ModelGlobals {
    return memoizeProp(this, Symbol.for('globals'), (): ModelGlobals => ({
      predicates: {
        ...this.$data.globals?.predicates,
      },
      dynamicPredicates: {
        ...this.$data.globals?.dynamicPredicates,
      },
      styles: {
        ...this.$data.globals?.styles,
      },
    }))
  }

  public element(el: ElementOrFqn<A>): ElementModel<A> {
    if (el instanceof ElementModel) {
      return el
    }
    const id = getId(el)
    return nonNullable(this._elements.get(id), `Element ${id} not found`)
  }
  public findElement(el: aux.LooseElementId<A>): ElementModel<A> | null {
    return this._elements.get(getId(el)) ?? null
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
  public relationship(rel: RelationOrId, type: 'model'): RelationshipModel<A>
  public relationship(rel: RelationOrId, type: 'deployment'): DeploymentRelationModel<A>
  public relationship(
    rel: scalar.RelationId,
    type?: 'model' | 'deployment',
  ): RelationshipModel<A> | DeploymentRelationModel<A>
  public relationship(
    rel: scalar.RelationId,
    type: 'model' | 'deployment' | undefined,
  ): RelationshipModel<A> | DeploymentRelationModel<A> {
    if (type === 'deployment') {
      return this.deployment.relationship(rel)
    }
    const id = getId(rel)
    let model = this._relations.get(id) ?? null
    if (model || type === 'model') {
      return nonNullable(model, `Model relation ${id} not found`)
    }
    // We did not find the relation in the model, let's search in the deployment
    return nonNullable(this.deployment.findRelationship(id), `No model/deployment relation ${id} not found`)
  }

  public findRelationship(id: string, type: 'model'): RelationshipModel<A> | null
  public findRelationship(id: string, type: 'deployment'): DeploymentRelationModel<A> | null
  public findRelationship(
    id: string,
    type?: 'model' | 'deployment',
  ): RelationshipModel<A> | DeploymentRelationModel<A> | null
  public findRelationship(
    id: string,
    type: 'model' | 'deployment' | undefined,
  ): RelationshipModel<A> | DeploymentRelationModel<A> | null {
    if (type === 'deployment') {
      return this.deployment.findRelationship(id)
    }
    let model = this._relations.get(getId(id)) ?? null
    if (model || type === 'model') {
      return model
    }
    return this.deployment.findRelationship(id)
  }

  /**
   * Returns all views in the model.
   */
  public views(): IteratorLike<LikeC4ViewModel<A, $View<A>>> {
    return this._views.values()
  }

  /**
   * Returns a specific view by its ID.
   */
  public view(viewId: aux.ViewId<A> | { id: scalar.ViewId<aux.ViewId<A>> }): LikeC4ViewModel<A, $View<A>> {
    const id = getId(viewId)
    return nonNullable(this._views.get(id), `View ${id} not found`)
  }
  public findView(viewId: aux.LooseViewId<A>): LikeC4ViewModel<A, $View<A>> | null {
    return this._views.get(viewId as aux.ViewId<A>) ?? null
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: ElementOrFqn<A>): ElementModel<A> | null {
    const id = getId(element)
    return this._parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: ElementOrFqn<A>): ReadonlySet<ElementModel<A>> {
    const id = getId(element)
    return this._children.get(id)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(element: ElementOrFqn<A>): ElementsIterator<A> {
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
  public *ancestors(element: ElementOrFqn<A>): ElementsIterator<A> {
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
  public *descendants(element: ElementOrFqn<A>): ElementsIterator<A> {
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
    element: ElementOrFqn<A>,
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
    element: ElementOrFqn<A>,
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

  /**
   * Returns all tags used in the model, sorted alphabetically.
   */
  get tags(): aux.Tags<A> {
    return memoizeProp(this, 'tags', () => sort([...this._allTags.keys()], compareNatural))
  }

  /**
   * Returns all tags used in the model, sorted by usage count (descending).
   */
  get tagsSortedByUsage(): ReadonlyArray<{
    tag: aux.Tag<A>
    count: number
    tagged: ReadonlySet<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>
  }> {
    return memoizeProp(this, 'tagsSortedByUsage', () =>
      pipe(
        [...this._allTags.entries()],
        map(([tag, tagged]) => ({
          tag,
          count: tagged.size,
          tagged,
        })),
        sort((a, b) => compareNatural(a.tag, b.tag)),
        sortBy(
          [prop('count'), 'desc'],
        ),
      ))
  }

  /**
   * Returns all elements, relationships and views marked with the given tag.
   */
  public findByTag(tag: aux.Tag<A>): IteratorLike<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>
  public findByTag(tag: aux.Tag<A>, type: 'elements'): IteratorLike<ElementModel<A>>
  public findByTag(tag: aux.Tag<A>, type: 'views'): IteratorLike<LikeC4ViewModel<A>>
  public findByTag(tag: aux.Tag<A>, type: 'relationships'): IteratorLike<RelationshipModel<A>>
  public findByTag(
    tag: aux.Tag<A>,
    type?: 'elements' | 'views' | 'relationships' | undefined,
  ) {
    return ifilter(this._allTags.get(tag), (el) => {
      if (type === 'elements') {
        return el instanceof ElementModel
      }
      if (type === 'views') {
        return el instanceof LikeC4ViewModel
      }
      if (type === 'relationships') {
        return el instanceof RelationshipModel
      }
      return true
    })
  }

  /**
   * Returns all elements of the given kind.
   */
  public *elementsOfKind(kind: aux.ElementKind<A>): IteratorLike<ElementModel<A>> {
    for (const el of this._elements.values()) {
      if (el.kind === kind) {
        yield el
      }
    }
    return
  }

  /**
   * Returns all elements that match the given where operator.
   *
   * @example
   * ```ts
   * model.where({
   *   and: [
   *     { kind: 'component' },
   *     {
   *       or: [
   *         { tag: 'old' },
   *         { tag: { neq: 'new' } },
   *       ],
   *     },
   *   ],
   * })
   * ```
   */
  public *elementsWhere(where: WhereOperator<A>): IteratorLike<ElementModel<A>> {
    const predicate = whereOperatorAsPredicate(where)
    for (const el of this._elements.values()) {
      if (predicate(el)) {
        yield el
      }
    }
    return
  }

  /**
   * Returns all **model** relationships that match the given where operator.
   *
   * @example
   * ```ts
   * model.relationshipsWhere({
   *   and: [
   *     { kind: 'uses' },
   *     {
   *       or: [
   *         { tag: 'old' },
   *         { tag: { neq: 'new' } },
   *       ],
   *     },
   *   ],
   * })
   * ```
   */
  public *relationshipsWhere(where: WhereOperator<A>): IteratorLike<RelationshipModel<A>> {
    const predicate = whereOperatorAsPredicate(where)
    for (const rel of this._relations.values()) {
      if (predicate(rel)) {
        yield rel
      }
    }
    return
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
export type AnyLikeC4Model = LikeC4Model<any>

export namespace LikeC4Model {
  export const EMPTY = LikeC4Model.create<aux.UnknownComputed>({
    _stage: 'computed',
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

  export type Parsed<A = aux.Unknown> =
    // dprint-ignore
    aux.Unknown extends A
      ? LikeC4Model<aux.UnknownParsed>
      : A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
        ? LikeC4Model<Aux<'parsed', E, D, V, P, Spec>>
        : never

  export type Computed<A = aux.Unknown> =
    // dprint-ignore
    aux.Unknown extends A
    ? LikeC4Model<aux.UnknownComputed>
    : A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
      ? LikeC4Model<Aux<'computed', E, D, V, P, Spec>>
      : never

  export type Layouted<A = aux.Unknown> =
    // dprint-ignore
    aux.Unknown extends A
      ? LikeC4Model<aux.UnknownLayouted>
      : A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
        ? LikeC4Model<Aux<'layouted', E, D, V, P, Spec>>
        : never

  export type Node<A = aux.Unknown> = A extends aux.AnyAux ? NodeModel<A> : never
  export type Element<A = aux.Unknown> = A extends aux.AnyAux ? ElementModel<A> : never
  export type Relationship<A = aux.Unknown> = A extends aux.AnyAux ? RelationshipModel<A> : never
  export type View<A = aux.Unknown> = A extends aux.AnyAux ? $ViewModel<A> : never

  export type DeploymentNode<A = aux.Unknown> = A extends aux.AnyAux ? DeploymentNodeModel<A> : never
  export type DeployedInstance<A = aux.Unknown> = A extends aux.AnyAux ? DeployedInstanceModel<A> : never

  export type AnyRelation<M = aux.Unknown> = M extends aux.AnyAux ? RelationshipModel<M> | DeploymentRelationModel<M>
    : never
}
