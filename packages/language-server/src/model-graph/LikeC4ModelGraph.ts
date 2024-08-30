import {
  ancestorsFqn,
  commonAncestor,
  type Element,
  type Fqn,
  InvalidModelError,
  invariant,
  isSameHierarchy,
  isString,
  parentFqn,
  type Relation,
  type RelationID
} from '@likec4/core'

type Params = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  // views: ElementView[]
}

type RelationEdge = {
  source: Element
  target: Element
  relations: Relation[]
}

type FqnOrElement = Fqn | Element
type FqnsOrElements = Fqn[] | Element[]

const RelationsSet = Set<Relation>
const MapRelations = Map<Fqn, Set<Relation>>

function intersection<T>(a: Set<T>, b: Set<T>) {
  if (a.size === 0 || b.size === 0) {
    return new Set<T>()
  }
  return new Set([...a].filter(value => b.has(value)))
}

export class LikeC4ModelGraph {
  #elements = new Map<Fqn, Element>()
  // Parent element for given FQN
  #parents = new Map<Fqn, Element>()
  // Children elements for given FQN
  #children = new Map<Fqn, Element[]>()
  #rootElements = new Set<Element>()

  #relations = new Map<RelationID, Relation>()
  // Incoming to an element or its descendants
  #incoming = new MapRelations()
  // Outgoing from an element or its descendants
  #outgoing = new MapRelations()
  // Relationships inside the element, among descendants
  #internal = new MapRelations()

  #cacheAscendingSiblings = new Map<Fqn, Element[]>()

  constructor({ elements, relations }: Params) {
    for (const el of Object.values(elements)) {
      this.addElement(el)
    }
    for (const rel of Object.values(relations)) {
      this.addRelation(rel)
    }
  }

  get rootElements(): ReadonlyArray<Element> {
    return [...this.#rootElements]
  }

  get elements(): ReadonlyArray<Element> {
    return [...this.#elements.values()]
  }

  public element(id: Fqn) {
    const el = this.#elements.get(id)
    invariant(el, `Element ${id} not found`)
    return el
  }

  public connectedRelations(id: Fqn) {
    return [...this._incomingTo(id), ...this._outgoingFrom(id), ...this._internalOf(id)]
  }

  public children(id: Fqn): ReadonlyArray<Element> {
    return this._childrenOf(id).slice()
  }

  // Get children or element itself if no children
  public childrenOrElement(id: Fqn): ReadonlyArray<Element> {
    const children = this.children(id)
    return children.length > 0 ? children : [this.element(id)]
  }

  // Get all sibling (i.e. same parent)
  public siblings(element: Fqn | Element): ReadonlyArray<Element> {
    const id = isString(element) ? element : element.id
    const parent = parentFqn(id)
    const siblings = parent ? this._childrenOf(parent) : this.rootElements
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(element: Fqn | Element): ReadonlyArray<Element> {
    let id = isString(element) ? element : element.id
    const result = [] as Element[]
    let parent
    while (parent = this.#parents.get(id)) {
      result.push(parent)
      id = parent.id
    }
    return result as ReadonlyArray<Element>
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public ascendingSiblings(element: Fqn | Element): ReadonlyArray<Element> {
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
   * Resolve all RelationEdges between element and others (any direction)
   */
  public anyEdgesBetween(_element: Fqn | Element, others: Fqn[] | Element[]): ReadonlyArray<RelationEdge> {
    if (others.length === 0) {
      return []
    }
    const element = isString(_element) ? this.element(_element) : _element
    const in_element = this._incomingTo(element.id)
    const element_out = this._outgoingFrom(element.id)
    if (in_element.size === 0 && element_out.size === 0) {
      return []
    }

    const result = [] as Array<RelationEdge>
    for (const _other of others) {
      const other = isString(_other) ? this.element(_other) : _other
      if (isSameHierarchy(element, other)) {
        continue
      }

      if (element_out.size > 0) {
        const outcoming = intersection(this._incomingTo(other.id), element_out)
        // const outcoming = filter(in_other, isOutgoing)
        if (outcoming.size > 0) {
          result.push({
            source: element,
            target: other,
            relations: [...outcoming]
          })
        }
      }

      if (in_element.size > 0) {
        const incoming = intersection(this._outgoingFrom(other.id), in_element)
        // const incoming = filter(other_out, isIncoming)
        if (incoming.size > 0) {
          result.push({
            source: other,
            target: element,
            relations: [...incoming]
          })
        }
      }
    }
    return result
  }

  /**
   * Resolve all RelationEdges between elements (any direction)
   */
  public edgesWithin<T extends Fqn[] | Element[]>(elements: T): ReadonlyArray<RelationEdge> {
    if (elements.length < 2) {
      return []
    }
    return elements.reduce((acc, el, index, array) => {
      // return acc if last element
      if (index === array.length - 1) {
        return acc
      }
      acc.push(...this.anyEdgesBetween(el, array.slice(index + 1) as T))
      return acc
    }, [] as RelationEdge[])
  }

  /**
   * Get directed RelationEdge between source and target if exists
   */
  public edgesBetween(
    _sources: FqnOrElement | FqnsOrElements,
    _targets: FqnOrElement | FqnsOrElements
  ) {
    const sources = Array.isArray(_sources) ? _sources : [_sources]
    const targets = Array.isArray(_targets) ? _targets : [_targets]
    if (sources.length === 0 || targets.length === 0) {
      return []
    }

    const result = [] as Array<RelationEdge>
    for (const _source of sources) {
      const source = isString(_source) ? this.element(_source) : _source
      const outcoming = this._outgoingFrom(source.id)
      if (outcoming.size === 0) {
        continue
      }
      // const isSameAsOut = isIncludedIn(outcoming)

      for (const _target of targets) {
        const target = isString(_target) ? this.element(_target) : _target
        if (isSameHierarchy(source, target)) {
          continue
        }
        const incoming = this._incomingTo(target.id)
        const relations = intersection(outcoming, incoming)
        if (relations.size > 0) {
          result.push({
            source,
            target,
            relations: [...relations]
          })
        }
      }
    }
    return result
  }

  private addElement(el: Element) {
    if (this.#elements.has(el.id)) {
      throw new InvalidModelError(`Element ${el.id} already exists`)
    }
    this.#elements.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      this.#parents.set(el.id, this.element(parentId))
      this._childrenOf(parentId).push(el)
    } else {
      this.#rootElements.add(el)
    }
  }

  private addRelation(rel: Relation) {
    if (this.#relations.has(rel.id)) {
      throw new InvalidModelError(`Relation ${rel.id} already exists`)
    }
    this.#relations.set(rel.id, rel)
    this._incomingTo(rel.target).add(rel)
    this._outgoingFrom(rel.source).add(rel)

    const relParent = commonAncestor(rel.source, rel.target)
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this._internalOf(ancestor).add(rel)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(rel.source)) {
      if (sourceAncestor === relParent) {
        break
      }
      this._outgoingFrom(sourceAncestor).add(rel)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(rel.target)) {
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
