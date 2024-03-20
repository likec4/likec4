import {
  ancestorsFqn,
  commonAncestor,
  type Element,
  ensureModel,
  type Fqn,
  InvalidModelError,
  isSameHierarchy,
  isString,
  parentFqn,
  type Relation,
  type RelationID
} from '@likec4/core'
import { intersection } from 'remeda'

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

export class LikeC4ModelGraph {
  #elements = new Map<Fqn, Element>()
  #children = new Map<Fqn, Fqn[]>()
  #rootElements = new Set<Element>()

  #relations = new Map<RelationID, Relation>()
  // Incoming to an element or its descendants
  #incoming = new Map<Fqn, RelationID[]>()
  // Outgoing from an element or its descendants
  #outgoing = new Map<Fqn, RelationID[]>()
  // Relationships inside the element descendants
  #internal = new Map<Fqn, RelationID[]>()

  constructor({ elements, relations }: Params) {
    for (const el of Object.values(elements)) {
      this.addElement(el)
    }
    for (const rel of Object.values(relations)) {
      this.addRelation(rel)
    }
  }

  get rootElements() {
    return [...this.#rootElements]
  }

  get elements() {
    return [...this.#elements.values()]
  }

  public element(id: Fqn) {
    const el = this.#elements.get(id)
    ensureModel(el, `Element ${id} not found`)
    return el
  }

  public incoming(id: Fqn) {
    return this._incomingTo(id).flatMap(id => this.#relations.get(id) ?? [])
  }

  public outgoing(id: Fqn) {
    return this._outgoingFrom(id).flatMap(id => this.#relations.get(id) ?? [])
  }

  public internal(id: Fqn) {
    return this._internalOf(id).flatMap(id => this.#relations.get(id) ?? [])
  }

  public children(id: Fqn) {
    return this._childrenOf(id).flatMap(id => this.#elements.get(id) ?? [])
  }

  // Get children or element itself if no children
  public childrenOrElement(id: Fqn) {
    const children = this.children(id)
    return children.length > 0 ? children : [this.element(id)]
  }

  // Get all sibling (i.e. same parent)
  public siblings(element: Fqn | Element) {
    const id = isString(element) ? element : element.id
    const parent = parentFqn(id)
    const fqns = parent ? this._childrenOf(parent) : [...this.#rootElements].map(e => e.id)
    return fqns.flatMap(fqn => (fqn !== id && this.#elements.get(fqn)) || [])
  }

  public ancestors(element: Fqn | Element) {
    const id = isString(element) ? element : element.id
    return ancestorsFqn(id).flatMap(id => this.#elements.get(id) ?? [])
  }

  /**
   * Resolve siblings of the element and its ancestors
   */
  public ascendingSiblings(element: Fqn | Element) {
    const id = isString(element) ? element : element.id
    return [...this.siblings(id), ...this.ancestors(id).flatMap(a => this.siblings(a.id))]
  }

  /**
   * Resolve all RelationEdges between element and others (any direction)
   */
  public anyEdgesBetween(_element: Fqn | Element, others: Fqn[] | Element[]) {
    if (others.length === 0) {
      return []
    }
    const element = isString(_element) ? this.element(_element) : _element
    const in_element = this._incomingTo(element.id)
    const element_out = this._outgoingFrom(element.id)
    if (in_element.length === 0 && element_out.length === 0) {
      return []
    }

    const result = [] as Array<RelationEdge>
    for (const _other of others) {
      const other = isString(_other) ? this.element(_other) : _other
      if (isSameHierarchy(element, other)) {
        continue
      }

      if (element_out.length > 0) {
        const in_other = this._incomingTo(other.id)
        const outcoming = intersection(element_out, in_other)
        if (outcoming.length > 0) {
          result.push({
            source: element,
            target: other,
            relations: outcoming.flatMap(id => this.#relations.get(id) ?? [])
          })
        }
      }

      if (in_element.length > 0) {
        const other_out = this._outgoingFrom(other.id)
        const incoming = intersection(other_out, in_element)
        if (incoming.length > 0) {
          result.push({
            source: other,
            target: element,
            relations: incoming.flatMap(id => this.#relations.get(id) ?? [])
          })
        }
      }
    }
    return result
  }

  /**
   * Resolve all RelationEdges between elements (any direction)
   */
  public edgesWithin<T extends Fqn[] | Element[]>(elements: T) {
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
      if (outcoming.length === 0) {
        continue
      }

      for (const _target of targets) {
        const target = isString(_target) ? this.element(_target) : _target
        if (isSameHierarchy(source, target)) {
          continue
        }
        const incoming = this._incomingTo(target.id)
        if (incoming.length === 0) {
          continue
        }

        const relations = intersection(outcoming, incoming).flatMap(
          id => this.#relations.get(id) ?? []
        )
        if (relations.length > 0) {
          result.push({
            source,
            target,
            relations
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
    const parent = parentFqn(el.id)
    if (parent) {
      this._childrenOf(parent).push(el.id)
    } else {
      this.#rootElements.add(el)
    }
  }

  private addRelation(rel: Relation) {
    if (this.#relations.has(rel.id)) {
      throw new InvalidModelError(`Relation ${rel.id} already exists`)
    }
    this.#relations.set(rel.id, rel)
    this._incomingTo(rel.target).push(rel.id)
    this._outgoingFrom(rel.source).push(rel.id)

    const relParent = commonAncestor(rel.source, rel.target)
    // Process internal relationships
    if (relParent) {
      for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
        this._internalOf(ancestor).push(rel.id)
      }
    }
    // Process source hierarchy
    for (const sourceAncestor of ancestorsFqn(rel.source)) {
      if (sourceAncestor === relParent) {
        break
      }
      this._outgoingFrom(sourceAncestor).push(rel.id)
    }
    // Process target hierarchy
    for (const targetAncestor of ancestorsFqn(rel.target)) {
      if (targetAncestor === relParent) {
        break
      }
      this._incomingTo(targetAncestor).push(rel.id)
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
      incoming = []
      this.#incoming.set(id, incoming)
    }
    return incoming
  }

  private _outgoingFrom(id: Fqn) {
    let outgoing = this.#outgoing.get(id)
    if (!outgoing) {
      outgoing = []
      this.#outgoing.set(id, outgoing)
    }
    return outgoing
  }

  private _internalOf(id: Fqn) {
    let internal = this.#internal.get(id)
    if (!internal) {
      internal = []
      this.#internal.set(id, internal)
    }
    return internal
  }
}
