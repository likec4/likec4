import { isString, isTruthy, values } from 'remeda'
import type { Class } from 'type-fest'
import { nonNullable } from '../errors'
import type {
  Element as C4Element,
  ElementKind as C4ElementKind,
  ElementShape as C4ElementShape,
  Tag as C4Tag
} from '../types/element'
import { DefaultElementShape, DefaultThemeColor } from '../types/element'
import type {
  ComputedLikeC4Model as C4ComputedLikeC4Model,
  LayoutedLikeC4Model as C4LayoutedLikeC4Model
} from '../types/model'
import type { Relation as C4Relation } from '../types/relation'
import type { Color as C4Color } from '../types/theme'
import { ancestorsFqn, commonAncestor, parentFqn } from '../utils/fqn'
import { LikeC4DiagramModel } from './LikeC4DiagramModel'
import { LikeC4ViewModel } from './LikeC4ViewModel'
import type { ElementOrFqn, Fqn, IncomingFilter, OutgoingFilter, RelationID, ViewID } from './types'
import { getId } from './types'

type PickBySource<Source> = Source extends LikeC4Model.Layouted.SourceModel ? LikeC4Model.Layouted
  : Source extends LikeC4Model.Computed.SourceModel ? LikeC4Model.Computed
  : never

export class LikeC4Model<M extends LikeC4Model.ViewModel = LikeC4Model.ViewModel> {
  private _elements = new Map<Fqn, LikeC4Model.ElementModel<M>>()

  // Parent element for given FQN
  private _parents = new Map<Fqn, LikeC4Model.ElementModel<M>>()

  // Children elements for given FQN
  private _children = new Map<Fqn, LikeC4Model.ElementModel<M>[]>()

  private _rootElements = new Set<LikeC4Model.ElementModel<M>>()

  private _relations = new Map<RelationID, LikeC4Model.Relationship<M>>()

  // Incoming to an element or its descendants
  private _incoming = new Map<Fqn, Set<LikeC4Model.Relationship<M>>>()

  // Outgoing from an element or its descendants
  private _outgoing = new Map<Fqn, Set<LikeC4Model.Relationship<M>>>()

  // Relationships inside the element, among descendants
  private _internal = new Map<Fqn, Set<LikeC4Model.Relationship<M>>>()

  private _cacheAscendingSiblings = new Map<Fqn, LikeC4Model.ElementModel<M>[]>()

  private _views: Map<Fqn, M>

  constructor(
    public readonly type: LikeC4Model.ModelType<M>,
    public readonly sourcemodel: LikeC4Model.SourceModel<M>,
    elements: C4Element[],
    relations: C4Relation[],
    views: LikeC4Model.SourceModel<M>['views'],
    ViewModelClass: Class<M>
  ) {
    for (const el of elements) {
      this.addElement(el)
    }
    for (const rel of relations) {
      this.addRelation(rel)
    }
    this._views = new Map(
      values(views).map(view => [view.id, new ViewModelClass(view, this)] as [Fqn, M])
    )
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    return [...this._rootElements]
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    return [...this._elements.values()]
  }

  /**
   * Returns a specific element by its FQN.
   */
  public element(id: Fqn): LikeC4Model.ElementModel<M> {
    return nonNullable(this._elements.get(id), `Element ${id} not found`)
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): ReadonlyArray<LikeC4Model.Relationship<M>> {
    return [...this._relations.values()]
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: RelationID) {
    return nonNullable(this._relations.get(id), `Relation ${id} not found`)
  }

  /**
   * Returns all views in the model.
   */
  public views(): ReadonlyArray<M> {
    return [...this._views.values()]
  }

  /**
   * Returns a specific view by its ID.
   */
  public view(viewId: ViewID): M {
    return nonNullable(this._views.get(viewId), `View ${viewId} not found`)
  }

  /**
   * Returns the parent element of given element.
   * @see ancestors
   */
  public parent(element: ElementOrFqn): LikeC4Model.ElementModel<M> | null {
    const id = getId(element)
    return this._parents.get(id) || null
  }

  /**
   * Get all children of the element (only direct children),
   * @see descendants
   */
  public children(element: ElementOrFqn): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    const id = getId(element)
    return this._childrenOf(id)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(element: ElementOrFqn): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    const id = getId(element)
    const parent = this._parents.get(id)
    const siblings = parent ? this._childrenOf(parent.id) : this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(element: ElementOrFqn): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    let id = isString(element) ? element : element.id
    const result = [] as LikeC4Model.ElementModel<M>[]
    let parent
    while (parent = this._parents.get(id)) {
      result.push(parent)
      id = parent.id
    }
    return result
  }

  /**
   * Get all descendant elements (i.e. children, children’s children, etc.)
   */
  public descendants(element: ElementOrFqn): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    const id = getId(element)
    const children = this._childrenOf(id)
    return children.flatMap(c => [c, ...this.descendants(c.id)])
  }

  /**
   * Incoming relationships to the element and its descendants
   * @see incomers
   */
  public incoming(
    element: ElementOrFqn,
    filter: IncomingFilter = 'all'
  ): ReadonlyArray<LikeC4Model.Relationship<M>> {
    const id = getId(element)
    const incoming = Array.from(this._incomingTo(id))
    if (filter === 'all' || incoming.length === 0) {
      return incoming
    }

    return incoming.filter(rel => {
      if (filter === 'direct') {
        return rel.target.id === id
      }
      return rel.target.id !== id
    })
  }

  /**
   * Source elements of incoming relationships
   */
  public incomers(
    element: ElementOrFqn,
    filter: IncomingFilter = 'all'
  ): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    return this.incoming(element, filter).map(r => r.source)
  }

  /**
   * Outgoing relationships from the element and its descendants
   * @see outgoers
   */
  public outgoing(
    element: ElementOrFqn,
    filter: OutgoingFilter = 'all'
  ): ReadonlyArray<LikeC4Model.Relationship<M>> {
    const id = getId(element)
    const outgoing = Array.from(this._outgoingFrom(id))
    if (filter === 'all' || outgoing.length === 0) {
      return outgoing
    }
    return outgoing.filter(rel => {
      if (filter === 'direct') {
        return rel.source.id === id
      }
      return rel.source.id !== id
    })
  }

  /**
   * Target elements of outgoing relationships
   */
  public outgoers(
    element: ElementOrFqn,
    filter: OutgoingFilter = 'all'
  ): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    return this.outgoing(element, filter).map(r => r.target)
  }

  /**
   * Relationships inside the element, among descendants
   */
  public internal(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Relationship<M>> {
    const id = getId(element)
    return Array.from(this._internalOf(id))
  }

  /**
   * Resolve siblings of the element and siblings of ancestors
   *  (from closest to root)
   */
  public ascendingSiblings(element: ElementOrFqn): ReadonlyArray<LikeC4Model.ElementModel<M>> {
    const id = getId(element)
    let siblings = this._cacheAscendingSiblings.get(id)
    if (!siblings) {
      siblings = [
        ...this.siblings(id),
        ...this.ancestors(id).flatMap(a => this.siblings(a.id))
      ]
      this._cacheAscendingSiblings.set(id, siblings)
    }
    return siblings.slice()
  }

  /**
   * Resolve all views that contain the element
   */
  public viewsWithElement(element: ElementOrFqn): ReadonlyArray<M> {
    const id = getId(element)
    return [...this._views.values()].filter(v => v.hasElement(id))
  }

  private addElement(parsed: C4Element) {
    if (this._elements.has(parsed.id)) {
      throw new Error(`Element ${parsed.id} already exists`)
    }
    const el = new LikeC4Model.ElementModel(parsed, this)
    this._elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      this._parents.set(el.id, this.element(parentId))
      this._childrenOf(parentId).push(el)
    } else {
      this._rootElements.add(el)
    }
  }

  private addRelation(relation: C4Relation) {
    if (this._relations.has(relation.id)) {
      throw new Error(`Relation ${relation.id} already exists`)
    }
    const rel = new LikeC4Model.Relationship(relation, this)
    this._relations.set(rel.id, rel)
    this._incomingTo(relation.target).add(rel)
    this._outgoingFrom(relation.source).add(rel)

    const relParent = commonAncestor(relation.source, relation.target)
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
  }

  private _childrenOf(id: Fqn) {
    let children = this._children.get(id)
    if (!children) {
      children = []
      this._children.set(id, children)
    }
    return children
  }

  private _incomingTo(id: Fqn) {
    let incoming = this._incoming.get(id)
    if (!incoming) {
      incoming = new Set()
      this._incoming.set(id, incoming)
    }
    return incoming
  }

  private _outgoingFrom(id: Fqn) {
    let outgoing = this._outgoing.get(id)
    if (!outgoing) {
      outgoing = new Set()
      this._outgoing.set(id, outgoing)
    }
    return outgoing
  }

  private _internalOf(id: Fqn) {
    let internal = this._internal.get(id)
    if (!internal) {
      internal = new Set()
      this._internal.set(id, internal)
    }
    return internal
  }
}

export namespace LikeC4Model {
  export function create(source: LikeC4Model.SourceModel): PickBySource<typeof source> {
    // static create<MM extends LikeC4Model>(source: MM['s']): PickBySource<typeof source> {
    if (source.__ === 'layouted') {
      return LikeC4Model.layouted(source)
    }
    return LikeC4Model.computed(source)
  }

  export function computed(source: C4ComputedLikeC4Model): LikeC4Model<LikeC4ViewModel> {
    return new LikeC4Model(
      'computed',
      source,
      values(source.elements),
      values(source.relations),
      source.views,
      LikeC4ViewModel
    )
  }

  export function layouted(source: C4LayoutedLikeC4Model): LikeC4Model<LikeC4DiagramModel> {
    return new LikeC4Model(
      'layouted',
      source,
      values(source.elements),
      values(source.relations),
      source.views,
      LikeC4DiagramModel
    )
  }

  export function isModel(model: any): model is LikeC4Model {
    return model instanceof LikeC4Model
  }

  export type SourceModel<M extends ViewModel = ViewModel> = M extends LikeC4DiagramModel ? C4LayoutedLikeC4Model
    : C4ComputedLikeC4Model

  export type ViewModel = LikeC4ViewModel | LikeC4DiagramModel
  export namespace ViewModel {
    export type Relationship = LikeC4Model.Relationship<ViewModel>

    export function isLayouted(model: ViewModel): model is LikeC4DiagramModel {
      return model instanceof LikeC4DiagramModel
    }
  }

  export type Computed = LikeC4Model<LikeC4ViewModel>
  export namespace Computed {
    export type ViewModel = LikeC4ViewModel
    export type SourceModel = LikeC4Model.SourceModel<ViewModel>
  }

  export type Layouted = LikeC4Model<LikeC4DiagramModel>
  export namespace Layouted {
    export type ViewModel = LikeC4DiagramModel
    export type SourceModel = LikeC4Model.SourceModel<ViewModel>
  }

  export type ModelType<M extends ViewModel = ViewModel> = M extends LikeC4DiagramModel ? 'layouted'
    : M extends LikeC4ViewModel ? 'computed'
    : never

  export function isLayouted(model: LikeC4Model): model is Layouted {
    return model.type === 'layouted'
  }

  export class Relationship<M extends ViewModel> {
    constructor(
      public readonly relationship: C4Relation,
      private readonly model: LikeC4Model<M>
    ) {
    }

    get id() {
      return this.relationship.id
    }

    get title() {
      return this.relationship.title
    }

    get kind() {
      return this.relationship.kind ?? null
    }

    get tags(): C4Tag[] {
      return this.relationship.tags ?? []
    }

    get source() {
      return this.model.element(this.relationship.source)
    }

    get target() {
      return this.model.element(this.relationship.target)
    }

    public metadata(key: string): string | undefined
    public metadata(key: string, defaultValue: string): string
    public metadata(key: string, defaultValue?: string): string | undefined {
      return this.relationship.metadata?.[key] ?? defaultValue
    }

    public hasMetadata(key: string): boolean {
      return isTruthy(this.relationship.metadata?.[key])
    }
  }

  // Class renamed to ElementModel, otherwise generated DTS will be incorrect
  export class ElementModel<M extends ViewModel> {
    constructor(
      public readonly element: C4Element,
      private readonly model: LikeC4Model<M>
    ) {
    }

    get id() {
      return this.element.id
    }

    get title() {
      return this.element.title
    }

    get kind(): C4ElementKind {
      return this.element.kind
    }

    get isRoot(): boolean {
      return parentFqn(this.element.id) === null
    }

    get hasNested(): boolean {
      return this.model.children(this).length > 0
    }

    get shape(): C4ElementShape {
      return this.element.shape ?? DefaultElementShape
    }

    get color(): C4Color {
      return this.element.color ?? DefaultThemeColor
    }

    get tags(): C4Tag[] {
      return this.element.tags ?? []
    }

    public parent(): ElementModel<M> | null {
      return this.model.parent(this)
    }

    public metadata(key: string): string | undefined
    public metadata(key: string, defaultValue: string): string
    public metadata(key: string, defaultValue?: string): string | undefined {
      return this.element.metadata?.[key] ?? defaultValue
    }

    public hasMetadata(key: string): boolean {
      return isTruthy(this.element.metadata?.[key])
    }

    public ancestors() {
      return this.model.ancestors(this)
    }

    public siblings() {
      return this.model.siblings(this)
    }

    public descendants() {
      return this.model.descendants(this)
    }

    public children() {
      return this.model.children(this)
    }

    /**
     * Views that contain this element
     */
    public views() {
      return this.model.viewsWithElement(this)
    }

    public incoming(filter?: IncomingFilter) {
      return this.model.incoming(this, filter)
    }

    public incomers(filter?: IncomingFilter) {
      return this.model.incomers(this, filter)
    }

    public outgoing(filter?: OutgoingFilter) {
      return this.model.outgoing(this, filter)
    }

    public outgoers(filter?: OutgoingFilter) {
      return this.model.outgoers(this, filter)
    }

    public internal() {
      return this.model.internal(this)
    }

    // public *descendants(): IterableIterator<LikeC4Element> {
    //   return
    // }
  }
}
