import { isString, isTruthy, values } from 'remeda'
import { nonNullable } from '../errors'
import type * as c4 from '../types'
import { DefaultElementShape, DefaultThemeColor } from '../types/element'
import { ancestorsFqn, commonAncestor, parentFqn } from '../utils/fqn'
import type { Fqn, RelationID, ViewID } from './types'
import { ViewModel } from './view/ViewModel'

const RelationsSet = Set<LikeC4Model.Relationship>
const MapRelations = Map<Fqn, Set<LikeC4Model.Relationship>>

type ElementOrFqn = Fqn | LikeC4Model.Element

export class LikeC4Model {
  #elements = new Map<Fqn, LikeC4Model.Element>()

  // Parent element for given FQN
  #parents = new Map<Fqn, LikeC4Model.Element>()

  // Children elements for given FQN
  #children = new Map<Fqn, LikeC4Model.Element[]>()

  #rootElements = new Set<LikeC4Model.Element>()

  #relations = new Map<RelationID, LikeC4Model.Relationship>()

  // Incoming to an element or its descendants
  #incoming = new MapRelations()

  // Outgoing from an element or its descendants
  #outgoing = new MapRelations()

  // Relationships inside the element, among descendants
  #internal = new MapRelations()

  #cacheAscendingSiblings = new Map<Fqn, LikeC4Model.Element[]>()

  #views: Map<ViewID, ViewModel>

  static from(computed: c4.ComputedLikeC4Model): LikeC4Model {
    return new LikeC4Model(computed)
  }

  protected constructor(protected computed: c4.ComputedLikeC4Model) {
    for (const el of values(computed.elements)) {
      this.addElement(el)
    }
    for (const rel of values(computed.relations)) {
      this.addRelation(rel)
    }
    this.#views = new Map(
      values(computed.views).map(v => [v.id, new ViewModel(v, this)])
    )
  }

  /**
   * Returns the root elements of the model.
   */
  public roots(): ReadonlyArray<LikeC4Model.Element> {
    return [...this.#rootElements]
  }

  /**
   * Returns all elements in the model.
   */
  public elements(): ReadonlyArray<LikeC4Model.Element> {
    return [...this.#elements.values()]
  }

  /**
   * Returns a specific element by its FQN.
   */
  public element(id: Fqn): LikeC4Model.Element {
    return nonNullable(this.#elements.get(id), `Element ${id} not found`)
  }

  /**
   * Returns all relationships in the model.
   */
  public relationships(): ReadonlyArray<LikeC4Model.Relationship> {
    return [...this.#relations.values()]
  }

  /**
   * Returns a specific relationship by its ID.
   */
  public relationship(id: RelationID): LikeC4Model.Relationship {
    return nonNullable(this.#relations.get(id), `Relation ${id} not found`)
  }

  /**
   * Returns all views in the model.
   */
  public views(): ReadonlyArray<ViewModel> {
    return [...this.#views.values()]
  }

  /**
   * Returns a specific view by its ID.
   */
  public view(viewId: ViewID): ViewModel {
    return nonNullable(this.#views.get(viewId), `View ${viewId} not found`)
  }

  /**
   * Returns the parent element of a given element.
   */
  public parent(element: ElementOrFqn): LikeC4Model.Element | null {
    const id = isString(element) ? element : element.id
    return this.#parents.get(id) || null
  }

  public children(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Element> {
    const id = isString(element) ? element : element.id
    return this._childrenOf(id)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Element> {
    const id = isString(element) ? element : element.id
    const parent = this.#parents.get(id)
    const siblings = parent ? this._childrenOf(parent.id) : this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Element> {
    let id = isString(element) ? element : element.id
    const result = [] as LikeC4Model.Element[]
    let parent
    while (parent = this.#parents.get(id)) {
      result.push(parent)
      id = parent.id
    }
    return result
  }

  /**
   * Get all descendant elements (i.e. children, children’s children, etc.)
   */
  public descendants(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Element> {
    const id = isString(element) ? element : element.id
    const children = this._childrenOf(id)
    return children.flatMap(c => [c, ...this.descendants(c.id)])
  }

  /**
   * Incoming relationships to the element and its descendants
   * @param onlyDirect - only direct incoming relationships, ignore descendants
   */
  public incoming(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'to-descendants' = 'all'
  ): ReadonlyArray<LikeC4Model.Relationship> {
    const id = isString(element) ? element : element.id
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
    filter: 'all' | 'direct' | 'to-descendants' = 'all'
  ): ReadonlyArray<LikeC4Model.Element> {
    return this.incoming(element, filter).map(r => r.source)
  }

  /**
   * Outgoing relationships from the element and its descendants
   */
  public outgoing(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'from-descendants' = 'all'
  ): ReadonlyArray<LikeC4Model.Relationship> {
    const id = isString(element) ? element : element.id
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
    filter: 'all' | 'direct' | 'from-descendants' = 'all'
  ): ReadonlyArray<LikeC4Model.Element> {
    return this.outgoing(element, filter).map(r => r.target)
  }

  /**
   * Relationships inside the element, among descendants
   */
  public internal(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Relationship> {
    const id = isString(element) ? element : element.id
    return Array.from(this._internalOf(id))
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public ascendingSiblings(element: ElementOrFqn): ReadonlyArray<LikeC4Model.Element> {
    const id = isString(element) ? element : element.id
    let siblings = this.#cacheAscendingSiblings.get(id)
    if (!siblings) {
      siblings = [
        ...this.siblings(id),
        ...this.ancestors(id).flatMap(a => this.siblings(a.id))
      ]
      this.#cacheAscendingSiblings.set(id, siblings)
    }
    return siblings.slice()
  }

  /**
   * Resolve all views that contain the element
   */
  public viewsWithElement(element: ElementOrFqn): ReadonlyArray<ViewModel> {
    const id = isString(element) ? element : element.id
    return [...this.#views.values()].filter(v => v.hasElement(id))
  }

  private addElement(parsed: c4.Element) {
    if (this.#elements.has(parsed.id)) {
      throw new Error(`Element ${parsed.id} already exists`)
    }
    const el = new LikeC4Model.Element(parsed, this)
    this.#elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      this.#parents.set(el.id, this.element(parentId))
      this._childrenOf(parentId).push(el)
    } else {
      this.#rootElements.add(el)
    }
  }

  private addRelation(relation: c4.Relation) {
    if (this.#relations.has(relation.id)) {
      throw new Error(`Relation ${relation.id} already exists`)
    }
    const rel = new LikeC4Model.Relationship(relation, this)
    this.#relations.set(rel.id, rel)
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
    let children = this.#children.get(id)
    if (!children) {
      children = []
      this.#children.set(id, children)
    }
    return children
  }

  private _incomingTo(id: Fqn) {
    let incoming = this.#incoming.get(id)
    if (!incoming) {
      incoming = new RelationsSet()
      this.#incoming.set(id, incoming)
    }
    return incoming
  }

  private _outgoingFrom(id: Fqn) {
    let outgoing = this.#outgoing.get(id)
    if (!outgoing) {
      outgoing = new RelationsSet()
      this.#outgoing.set(id, outgoing)
    }
    return outgoing
  }

  private _internalOf(id: Fqn) {
    let internal = this.#internal.get(id)
    if (!internal) {
      internal = new RelationsSet()
      this.#internal.set(id, internal)
    }
    return internal
  }
}

export namespace LikeC4Model {
  export class Element {
    constructor(
      public readonly element: c4.Element,
      private model: LikeC4Model
    ) {
    }

    get id() {
      return this.element.id
    }

    get title() {
      return this.element.title
    }

    get kind() {
      return this.element.kind
    }

    get isRoot(): boolean {
      return parentFqn(this.element.id) === null
    }

    get hasNested(): boolean {
      return this.model.children(this).length > 0
    }

    get shape(): c4.ElementShape {
      return this.element.shape ?? DefaultElementShape
    }

    get color(): c4.ThemeColor {
      return this.element.color ?? DefaultThemeColor
    }

    get tags(): c4.Tag[] {
      return this.element.tags ?? []
    }

    public parent(): LikeC4Model.Element | null {
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

    public incoming(filter?: 'all' | 'direct' | 'to-descendants') {
      return this.model.incoming(this, filter)
    }

    public incomers(filter?: 'all' | 'direct' | 'to-descendants') {
      return this.model.incomers(this, filter)
    }

    public outgoing(filter?: 'all' | 'direct' | 'from-descendants') {
      return this.model.outgoing(this, filter)
    }

    public outgoers(filter?: 'all' | 'direct' | 'from-descendants') {
      return this.model.outgoers(this, filter)
    }

    public internal() {
      return this.model.internal(this)
    }

    // public *descendants(): IterableIterator<LikeC4Element> {
    //   return
    // }
  }

  export class Relationship {
    constructor(
      public readonly relationship: c4.Relation,
      private model: LikeC4Model
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

    get tags(): c4.Tag[] {
      return this.relationship.tags ?? []
    }

    get source(): LikeC4Model.Element {
      return this.model.element(this.relationship.source)
    }

    get target(): LikeC4Model.Element {
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
}
