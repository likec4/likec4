import { isArray, isString } from 'remeda'
import { invariant, nonNullable } from '../errors'
import {
  type DeployedInstance,
  type DeploymentNode,
  type Element as ModelElement,
  type Fqn,
  PhysicalElement,
  type Relation
} from '../types'
import { commonAncestor, getOrCreate, isSameHierarchy, parentFqn, sortNaturalByFqn } from '../utils'
import { intersection, type LikeC4ModelGraph } from './LikeC4ModelGraph'

type Params = {
  elements: ReadonlyArray<PhysicalElement>
  modelGraph: LikeC4ModelGraph
  // Optional for tests
  // globals?: ModelGlobals
}

// type RelationEdge = {
//   source: Element
//   target: Element
//   relations: Relation[]
// }

type FqnOrElement = Fqn | LikeC4DeploymentGraph.Element
type Edges = ReadonlyArray<LikeC4DeploymentGraph.Edge>
// type FqnsOrElements = ReadonlyArray<Fqn> | ReadonlyArray<Element>

// const RelationsSet = Set<Relation>
// const MapRelations = Map<Fqn, Set<Relation>>
/**
 * Used only for views calculations.
 * Subject to change.
 */
export class LikeC4DeploymentGraph {
  readonly #nodes = new Map<Fqn, DeploymentNode>()
  // Parent element for given FQN
  // readonly #parents = new Map<Fqn, DeploymentNode>()
  // Children elements for given FQN
  readonly #children = new Map<Fqn, Array<LikeC4DeploymentGraph.Element>>()
  readonly #rootNodes = new Set<DeploymentNode>()
  readonly #instances = new Map<Fqn, LikeC4DeploymentGraph.Instance>()

  readonly #cacheAscendingSiblings = new Map<Fqn, DeploymentNode[]>()

  // readonly #relations = new Map<RelationID, Relation>()
  // // Incoming to an element or its descendants
  readonly #incoming = new Map<Fqn, ReadonlySet<Relation>>()
  // // Outgoing from an element or its descendants
  readonly #outgoing = new Map<Fqn, ReadonlySet<Relation>>()
  // // Relationships inside the element, among descendants
  // readonly #internal = new MapRelations()

  // readonly #cacheAscendingSiblings = new Map<Fqn, Element[]>()

  readonly #nestedInstances = new Map<Fqn, ReadonlyArray<LikeC4DeploymentGraph.Instance>>()

  public readonly modelGraph: LikeC4ModelGraph

  constructor(
    { elements, modelGraph }: Params
  ) {
    this.modelGraph = modelGraph
    const instances: DeployedInstance[] = []
    // this.globals = globals ?? {
    //   predicates: {},
    //   dynamicPredicates: {},
    //   styles: {}
    // }
    for (const el of sortNaturalByFqn(elements)) {
      if (PhysicalElement.isDeploymentNode(el)) {
        this.addDeploymentNode(el)
      } else {
        instances.push(el)
      }
    }
    for (const el of instances) {
      this.addInstance(el)
    }
  }

  public rootNodes(): ReadonlyArray<DeploymentNode> {
    return Array.from(this.#rootNodes)
  }

  public node(id: Fqn) {
    return nonNullable(this.#nodes.get(id), `Node ${id} not found`)
  }

  public parent(element: FqnOrElement): DeploymentNode | null {
    const id = isString(element) ? element : element.id
    const parentId = parentFqn(id)
    if (parentId) {
      invariant(this.#nodes.has(parentId), `Parent ${parentId} not found for ${id}`)
      return this.node(parentId)
    }
    return null
  }

  public children(element: FqnOrElement): ReadonlyArray<LikeC4DeploymentGraph.Element> {
    if (element instanceof LikeC4DeploymentGraph.Instance) {
      return []
    }
    const id = isString(element) ? element : element.id
    return this._childrenOf(id)
  }

  public element(id: Fqn): LikeC4DeploymentGraph.Element {
    return nonNullable(this.#instances.get(id) ?? this.#nodes.get(id), `Element ${id} not found`)
  }

  public instance(id: Fqn) {
    return nonNullable(this.#instances.get(id), `Instance ${id} not found`)
  }

  // Get all sibling (i.e. same parent)
  public siblings(element: FqnOrElement): ReadonlyArray<LikeC4DeploymentGraph.Element> {
    const id = isString(element) ? element : element.id
    const parent = parentFqn(id)
    const siblings = parent ? this._childrenOf(parent) : this.rootNodes()
    return siblings.filter(e => e.id !== id)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(element: FqnOrElement): ReadonlyArray<DeploymentNode> {
    let id = isString(element) ? element : element.id
    const result = [] as DeploymentNode[]
    let parent
    while (parent = this.parent(id)) {
      result.push(parent)
      id = parent.id
    }
    return result
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public ascendingSiblings(element: FqnOrElement): ReadonlyArray<LikeC4DeploymentGraph.Element> {
    const id = isString(element) ? element : element.id
    return getOrCreate(this.#cacheAscendingSiblings, id, () => [
      ...this.siblings(id),
      ...this.ancestors(id).flatMap(a => this.siblings(a.id))
    ])
  }

  public allNestedInstances(element: FqnOrElement) {
    const el = isString(element) ? this.element(element) : element
    if (LikeC4DeploymentGraph.isInstance(el)) {
      return [el]
    }
    const id = el.id
    return getOrCreate(this.#nestedInstances, id, () => {
      const instances = [] as LikeC4DeploymentGraph.Instance[]
      const descendants = [...this.children(id)]
      let child
      while (child = descendants.shift()) {
        if (LikeC4DeploymentGraph.isInstance(child)) {
          instances.push(child)
        } else {
          descendants.push(...this.children(child.id))
        }
      }
      return instances
    })
  }

  public incoming(element: FqnOrElement): ReadonlySet<Relation> {
    const id = isString(element) ? element : element.id
    return getOrCreate(this.#incoming, id, () => {
      const relations = new Set<Relation>()
      for (const instance of this.allNestedInstances(id)) {
        for (const rel of this.modelGraph.incoming(instance.element)) {
          relations.add(rel)
        }
      }
      // for (const instance of this.allNestedInstances(id)) {
      //   for (const rel of this.modelGraph.outgoing(instance.element)) {
      //     relations.delete(rel)
      //   }
      // }
      return relations
    })
  }

  public outgoing(element: FqnOrElement): ReadonlySet<Relation> {
    const id = isString(element) ? element : element.id
    return getOrCreate(this.#outgoing, id, () => {
      const relations = new Set<Relation>()
      for (const instance of this.allNestedInstances(id)) {
        for (const rel of this.modelGraph.outgoing(instance.element)) {
          relations.add(rel)
        }
      }
      // for (const instance of this.allNestedInstances(id)) {
      //   for (const rel of this.modelGraph.incoming(instance.element)) {
      //     relations.delete(rel)
      //   }
      // }
      return relations
    })
  }

  /**
   * Resolve all RelationEdges between element and others (any direction)
   */
  public anyEdgesBetween(
    _element: FqnOrElement,
    others:
      | ReadonlyArray<Fqn>
      | ReadonlyArray<LikeC4DeploymentGraph.Element>
      | ReadonlySet<LikeC4DeploymentGraph.Element>
  ): Edges {
    if (isArray(others) && others.length === 0 || 'size' in others && others.size === 0) {
      return []
    }
    const element = isString(_element) ? this.element(_element) : _element
    const in_element = this.incoming(element)
    const element_out = this.outgoing(element)
    if (in_element.size === 0 && element_out.size === 0) {
      return []
    }

    const result = [] as LikeC4DeploymentGraph.Edge[]
    for (const _other of others) {
      const other = isString(_other) ? this.element(_other) : _other
      if (isSameHierarchy(element, other)) {
        continue
      }

      if (element_out.size > 0) {
        const outcoming = intersection(this.incoming(other), element_out)
        if (outcoming.size > 0) {
          result.push({
            source: element,
            target: other,
            relations: outcoming
          })
        }
      }

      if (in_element.size > 0) {
        const incoming = intersection(this.outgoing(other), in_element)
        // const incoming = filter(other_out, isIncoming)
        if (incoming.size > 0) {
          result.push({
            source: other,
            target: element,
            relations: incoming
          })
        }
      }
    }
    return result
  }

  /**
   * Resolve all RelationEdges between elements (any direction)
   */
  public edgesWithin(
    _elements: ReadonlyArray<LikeC4DeploymentGraph.Element> | ReadonlySet<LikeC4DeploymentGraph.Element>
  ): Edges {
    const elements = isArray(_elements) ? _elements : [..._elements]
    if (elements.length < 2) {
      return []
    }
    return elements.reduce((acc, el, index, array) => {
      // return acc if last element
      if (index === array.length - 1) {
        return acc
      }
      acc.push(...this.anyEdgesBetween(el, array.slice(index + 1)))
      return acc
    }, [] as LikeC4DeploymentGraph.Edge[])
  }

  // /**
  //    * Get directed RelationEdge between source and target if exists
  //    */
  //   public edgesBetween(
  //     _sources: FqnOrElement | FqnOrElement[],
  //     _targets: FqnOrElement | FqnOrElement[]
  //   ) {
  //     const sources = isArray(_sources) ? _sources : [_sources]
  //     const targets = isArray(_targets) ? _targets : [_targets]
  //     if (sources.length === 0 || targets.length === 0) {
  //       return []
  //     }

  //     const result = [] as Edges
  //     for (const _source of sources) {
  //       const source = isString(_source) ? this.element(_source) : _source
  //       const outcoming = this.outgoing(source)
  //       if (outcoming.size === 0) {
  //         continue
  //       }
  //       // const isSameAsOut = isIncludedIn(outcoming)

  //       for (const _target of targets) {
  //         const target = isString(_target) ? this.element(_target) : _target
  //         if (isSameHierarchy(source, target)) {
  //           continue
  //         }
  //         const incoming = this.incoming(target)
  //         const relations = intersection(outcoming, incoming)
  //         if (relations.size > 0) {
  //           result.push({
  //             source,
  //             target,
  //             relations: [...relations]
  //           })
  //         }
  //       }
  //     }
  //     return result
  //   }

  private addDeploymentNode(el: DeploymentNode) {
    if (this.#nodes.has(el.id)) {
      throw new Error(`DeploymentNode ${el.id} already exists`)
    }
    this.#nodes.set(el.id, el)
    const parentId = parentFqn(el.id)
    if (parentId) {
      invariant(this.#nodes.has(parentId), `Parent ${parentId} not found for ${el.id}`)
      this._childrenOf(parentId).push(el)
    } else {
      this.#rootNodes.add(el)
    }
  }

  private addInstance(el: DeployedInstance) {
    if (this.#instances.has(el.id)) {
      throw new Error(`DeployedInstance ${el.id} already exists`)
    }
    const parent = nonNullable(this.parent(el.id), 'Instance must have a parent DeploymentNode')
    const instance = new LikeC4DeploymentGraph.Instance(el, parent, this.modelGraph.element(el.element))
    this.#instances.set(el.id, instance)
    this._childrenOf(parent.id).push(instance)
  }

  private _childrenOf(id: Fqn) {
    return getOrCreate(this.#children, id, () => [])
  }

  // private _incomingTo(id: Fqn) {
  //   let incoming = this.#incoming.get(id)
  //   if (!incoming) {
  //     incoming = new RelationsSet()
  //     this.#incoming.set(id, incoming)
  //   }
  //   return incoming
  // }

  // private _outgoingFrom(id: Fqn) {
  //   let outgoing = this.#outgoing.get(id)
  //   if (!outgoing) {
  //     outgoing = new RelationsSet()
  //     this.#outgoing.set(id, outgoing)
  //   }
  //   return outgoing
  // }

  // private _internalOf(id: Fqn) {
  //   let internal = this.#internal.get(id)
  //   if (!internal) {
  //     internal = new RelationsSet()
  //     this.#internal.set(id, internal)
  //   }
  //   return internal
  // }
}

export namespace LikeC4DeploymentGraph {
  export function mkedge(edge: { source: Element; target: Element; relations: Set<Relation> }): Edge {
    const parentId = commonAncestor(edge.source.id, edge.target.id)
    const parentDepth = parentId ? parentId.split('.').length : 0
    const sourceDepth = edge.source.id.split('.').length - parentDepth
    const targetDepth = edge.target.id.split('.').length - parentDepth

    return {
      ...edge,
      parentId
    }
  }

  export const isInstance = (el: Element): el is Instance => {
    return el instanceof Instance
  }

  export type Element = DeploymentNode | Instance

  export class Instance {
    constructor(
      public instance: DeployedInstance,
      public parent: DeploymentNode,
      public element: ModelElement
    ) {
    }

    public get id() {
      return this.instance.id
    }
  }

  export interface Edge {
    source: Element
    target: Element
    relations: Set<Relation>
    parentId?: Fqn | null
  }
}
