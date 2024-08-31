import { isNullish, isString } from 'remeda'
import { nonNullable } from '../../errors'
import type { Tag } from '../../types/element'
import type { ComputedView } from '../../types/view'
import type { LikeC4Model } from '../LikeC4Model'
import type { EdgeId, Fqn } from '../types'
import { ViewConnection } from './ViewConnection'
import { ViewElement } from './ViewElement'

type ElementOrFqn = Fqn | ViewElement

/**
 * All methods are view-scoped, i.e. only return elements and connections in the view.
 */
export class ViewModel {
  #rootElements = new Set<ViewElement>()

  #elements = new Map<Fqn, ViewElement>()

  #connections: Map<EdgeId, ViewConnection>

  constructor(
    public readonly view: ComputedView,
    public readonly model: LikeC4Model
  ) {
    for (const node of view.nodes) {
      const el = new ViewElement(node, this)
      this.#elements.set(node.id, el)
      if (isNullish(node.parent)) {
        this.#rootElements.add(el)
      }
    }
    this.#connections = new Map(view.edges.map(e => [e.id, new ViewConnection(e, this)]))
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

  public roots(): ReadonlyArray<ViewElement> {
    return [...this.#rootElements]
  }

  public elements(): ReadonlyArray<ViewElement> {
    return [...this.#elements.values()]
  }

  public element(id: Fqn): ViewElement {
    return nonNullable(this.#elements.get(id), `ViewElement ${id} in view ${this.view.id} not found`)
  }

  public hasElement(id: Fqn): boolean {
    return this.#elements.has(id)
  }

  public connections(): ReadonlyArray<ViewConnection> {
    return [...this.#connections.values()]
  }

  public connection(id: EdgeId): ViewConnection {
    return nonNullable(this.#connections.get(id), `Connection ${id} in view ${this.view.id}  not found`)
  }

  public findConnections(
    source: ElementOrFqn,
    target: ElementOrFqn,
    direction: 'both' | 'direct' = 'direct'
  ): ReadonlyArray<ViewConnection> {
    const sourceId = isString(source) ? source : source.id
    const targetId = isString(target) ? target : target.id
    return this.connections().filter(c =>
      (c.source.id === sourceId && c.target.id === targetId)
      || (direction === 'both' && c.source.id === targetId && c.target.id === sourceId)
    )
  }

  public parent(element: ElementOrFqn): ViewElement | null {
    const el = this.element(isString(element) ? element : element.id)
    return el.node.parent ? this.element(el.node.parent) : null
  }

  public children(element: ElementOrFqn): ReadonlyArray<ViewElement> {
    const el = this.element(isString(element) ? element : element.id)
    return el.node.children.map(c => this.element(c))
  }

  // Get all sibling (i.e. same parent)
  public siblings(element: ElementOrFqn): ReadonlyArray<ViewElement> {
    const id = isString(element) ? element : element.id
    const parent = this.parent(id)
    const siblings = parent ? this.children(parent) : this.roots()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(element: ElementOrFqn): ReadonlyArray<ViewElement> {
    let id = isString(element) ? element : element.id
    const result = [] as ViewElement[]
    let parent
    while (parent = this.parent(id)) {
      result.push(parent)
      id = parent.id
    }
    return result
  }

  public descendants(element: ElementOrFqn): ReadonlyArray<ViewElement> {
    const children = this.children(element)
    return children.flatMap(c => [c, ...this.descendants(c.id)])
  }

  public incoming(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'to-descendants' = 'all'
  ): ReadonlyArray<ViewConnection> {
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
  ): ReadonlyArray<ViewElement> {
    return this.incoming(element, filter).map(r => r.source)
  }

  /**
   * Outgoing relationships from the element and its descendants
   */
  public outgoing(
    element: ElementOrFqn,
    filter: 'all' | 'direct' | 'from-descendants' = 'all'
  ): ReadonlyArray<ViewConnection> {
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
  ): ReadonlyArray<ViewElement> {
    return this.outgoing(element, filter).map(r => r.target)
  }
}
