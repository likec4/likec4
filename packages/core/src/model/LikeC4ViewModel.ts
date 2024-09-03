import { isNullish, isString } from 'remeda'
import { nonNullable } from '../errors'
import type { ElementShape, Tag } from '../types/element'
import type { ThemeColor } from '../types/theme'
import type { ComputedEdge, ComputedNode, ComputedView } from '../types/view'
import type { LikeC4Model } from './LikeC4Model'
import type { EdgeId, Fqn } from './types'

type ElementOrFqn = Fqn | LikeC4ViewModel.Element

/**
 * All methods are view-scoped, i.e. only return elements and connections in the view.
 */
export class LikeC4ViewModel {
  #rootElements = new Set<LikeC4ViewModel.Element>()

  #elements = new Map<Fqn, LikeC4ViewModel.Element>()

  #connections: Map<EdgeId, LikeC4ViewModel.Connection>

  constructor(
    public readonly view: ComputedView,
    public readonly model: LikeC4Model
  ) {
    for (const node of view.nodes) {
      const el = new LikeC4ViewModel.Element(node, this)
      this.#elements.set(node.id, el)
      if (isNullish(node.parent)) {
        this.#rootElements.add(el)
      }
    }
    this.#connections = new Map(view.edges.map(e => [e.id, new LikeC4ViewModel.Connection(e, this)]))
  }

  get id() {
    return this.view.id
  }

  get title() {
    return this.view.title
  }

  get viewOf() {
    if (this.view.__ !== 'dynamic') {
      return this.view.viewOf ? this.model.element(this.view.viewOf) : null
    }
    return null
  }

  get tags(): Tag[] {
    return this.view.tags ?? []
  }

  public roots(): ReadonlyArray<LikeC4ViewModel.Element> {
    return [...this.#rootElements]
  }

  public elements(): ReadonlyArray<LikeC4ViewModel.Element> {
    return [...this.#elements.values()]
  }

  public element(id: Fqn): LikeC4ViewModel.Element {
    return nonNullable(this.#elements.get(id), `LikeC4ViewModel.Element ${id} in view ${this.view.id} not found`)
  }

  public hasElement(id: Fqn): boolean {
    return this.#elements.has(id)
  }

  public connections(): ReadonlyArray<LikeC4ViewModel.Connection> {
    return [...this.#connections.values()]
  }

  public connection(id: EdgeId): LikeC4ViewModel.Connection {
    return nonNullable(this.#connections.get(id), `Connection ${id} in view ${this.view.id}  not found`)
  }

  public findConnections(
    source: ElementOrFqn,
    target: ElementOrFqn,
    direction: 'both' | 'direct' = 'direct'
  ): ReadonlyArray<LikeC4ViewModel.Connection> {
    const sourceId = isString(source) ? source : source.id
    const targetId = isString(target) ? target : target.id
    return this.connections().filter(c =>
      (c.source.id === sourceId && c.target.id === targetId)
      || (direction === 'both' && c.source.id === targetId && c.target.id === sourceId)
    )
  }

  public parent(element: ElementOrFqn): LikeC4ViewModel.Element | null {
    const el = this.element(isString(element) ? element : element.id)
    return el.node.parent ? this.element(el.node.parent) : null
  }

  public children(element: ElementOrFqn): ReadonlyArray<LikeC4ViewModel.Element> {
    const el = this.element(isString(element) ? element : element.id)
    return el.node.children.map(c => this.element(c))
  }

  // Get all sibling (i.e. same parent)
  public siblings(element: ElementOrFqn): ReadonlyArray<LikeC4ViewModel.Element> {
    const id = isString(element) ? element : element.id
    const parent = this.parent(id)
    const siblings = parent ? this.children(parent) : this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(element: ElementOrFqn): ReadonlyArray<LikeC4ViewModel.Element> {
    let id = isString(element) ? element : element.id
    const result = [] as LikeC4ViewModel.Element[]
    let parent
    while (parent = this.parent(id)) {
      result.push(parent)
      id = parent.id
    }
    return result
  }

  public descendants(element: ElementOrFqn): ReadonlyArray<LikeC4ViewModel.Element> {
    const children = this.children(element)
    return children.flatMap(c => [c, ...this.descendants(c.id)])
  }

  public incoming(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'to-descendants' = 'all'
  ): ReadonlyArray<LikeC4ViewModel.Connection> {
    const el = this.element(isString(element) ? element : element.id)
    const edges = el.node.inEdges.map(e => nonNullable(this.#connections.get(e), `Edge ${e} not found`))

    if (filter === 'all' || edges.length === 0) {
      return edges
    }

    return edges.filter(rel => {
      if (filter === 'direct') {
        return rel.target.id === el.id
      }
      return rel.target.id !== el.id
    })
  }

  public incomers(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'to-descendants' = 'all'
  ): ReadonlyArray<LikeC4ViewModel.Element> {
    return this.incoming(element, filter).map(r => r.source)
  }

  /**
   * Outgoing relationships from the element and its descendants
   */
  public outgoing(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'from-descendants' = 'all'
  ): ReadonlyArray<LikeC4ViewModel.Connection> {
    const el = this.element(isString(element) ? element : element.id)
    const edges = el.node.outEdges.map(e => nonNullable(this.#connections.get(e), `Edge ${e} not found`))

    if (filter === 'all' || edges.length === 0) {
      return edges
    }

    return edges.filter(rel => {
      if (filter === 'direct') {
        return rel.source.id === el.id
      }
      return rel.source.id !== el.id
    })
  }

  public outgoers(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'from-descendants' = 'all'
  ): ReadonlyArray<LikeC4ViewModel.Element> {
    return this.outgoing(element, filter).map(r => r.target)
  }
}

export namespace LikeC4ViewModel {
  /**
   * Represents an element in the view. (Diagram node)
   * All methods are view-scoped, i.e. `children` returns only children of the element in the view.
   */
  export class Element {
    constructor(
      public readonly node: ComputedNode,
      private viewmodel: LikeC4ViewModel
    ) {
    }

    get id() {
      return this.node.id
    }

    get title() {
      return this.node.title
    }

    get kind() {
      return this.node.kind
    }

    get isRoot(): boolean {
      return isNullish(this.node.parent)
    }

    get hasNested(): boolean {
      return this.node.children.length > 0
    }

    get shape(): ElementShape {
      return this.node.shape
    }

    get color(): ThemeColor {
      return this.node.color
    }

    get tags(): Tag[] {
      return this.node.tags ?? []
    }

    public model(): LikeC4Model.Element {
      return this.viewmodel.model.element(this.id)
    }

    public parent(): LikeC4ViewModel.Element | null {
      return this.node.parent ? this.viewmodel.element(this.node.parent) : null
    }

    public metadata(key: string): string | undefined
    public metadata(key: string, defaultValue: string): string
    public metadata(key: string, defaultValue?: string): string | undefined {
      return this.model().metadata(key) ?? defaultValue
    }

    public hasMetadata(key: string): boolean {
      return this.model().hasMetadata(key)
    }

    public ancestors(): ReadonlyArray<LikeC4ViewModel.Element> {
      return this.viewmodel.ancestors(this)
    }

    public siblings(): ReadonlyArray<LikeC4ViewModel.Element> {
      return this.viewmodel.siblings(this)
    }

    public descendants(): ReadonlyArray<LikeC4ViewModel.Element> {
      return this.viewmodel.descendants(this)
    }

    public children(): ReadonlyArray<LikeC4ViewModel.Element> {
      return this.viewmodel.children(this)
    }

    public incoming(filter: 'all' | 'direct' | 'to-descendants' = 'all'): ReadonlyArray<LikeC4ViewModel.Connection> {
      return this.viewmodel.incoming(this, filter)
    }

    public incomers(filter: 'all' | 'direct' | 'to-descendants' = 'all'): ReadonlyArray<LikeC4ViewModel.Element> {
      return this.viewmodel.incomers(this, filter)
    }

    public outgoing(filter: 'all' | 'direct' | 'from-descendants' = 'all'): ReadonlyArray<LikeC4ViewModel.Connection> {
      return this.viewmodel.outgoing(this, filter)
    }

    public outgoers(filter: 'all' | 'direct' | 'from-descendants' = 'all'): ReadonlyArray<LikeC4ViewModel.Element> {
      return this.viewmodel.outgoers(this, filter)
    }

    public connectionsTo(target: Fqn | LikeC4ViewModel.Element): ReadonlyArray<LikeC4ViewModel.Connection> {
      return this.viewmodel.findConnections(this, target)
    }
  }

  /**
   * Represents a connection between two elements.
   * May be source from multiple model relationships.
   */
  export class Connection {
    constructor(
      public readonly edge: ComputedEdge,
      private viewmodel: LikeC4ViewModel
    ) {
    }

    get id() {
      return this.edge.id
    }

    get source(): LikeC4ViewModel.Element {
      return this.viewmodel.element(this.edge.source)
    }

    get target(): LikeC4ViewModel.Element {
      return this.viewmodel.element(this.edge.target)
    }

    get tags(): Tag[] {
      return this.edge.tags ?? []
    }

    /**
     * Model relationships
     */
    relationships(): ReadonlyArray<LikeC4Model.Relationship> {
      return this.edge.relations.map(r => nonNullable(this.viewmodel.model.relationship(r)))
    }
  }
}
