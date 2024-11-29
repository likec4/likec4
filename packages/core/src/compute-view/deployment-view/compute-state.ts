import {
  dropWhile,
  filter,
  flatMap,
  forEach,
  forEachObj,
  groupBy,
  hasAtLeast,
  map,
  omit,
  partition,
  pipe,
  prop,
  sort
} from 'remeda'
import type { Fqn } from '../../types'
import type { Relation } from '../../types/relation'
import { commonAncestor, compareFqnHierarchically, getOrCreate, isAncestor } from '../../utils'
import type { LikeC4DeploymentGraph } from '../LikeC4DeploymentGraph'
import type { Node } from './_types'

type DeploymentEdge = LikeC4DeploymentGraph.Edge
// interface Connection {
//   source: DeploymentElement
//   target: DeploymentElement
//   basedOn: Array<Relation>
// }

type Rel = LikeC4DeploymentGraph.EdgeRelation

// class Node {
//   constructor(
//     public readonly element: DeploymentElement,
//   ) {}

//   get id(): Fqn {
//     return this.element.id;
//   }
// }

// interface TreeNode {
//   id: Fqn
//   element: DeploymentElement
//   children: Array<TreeNode>
// }

export function cleanEdges(elements: ReadonlyArray<Node>, edges: ReadonlyArray<DeploymentEdge>): DeploymentEdge[] {
  const [compounds, leafs] = partition([...elements], (el, _, all) => {
    return all.some(a => isAncestor(el.id, a.id))
  })

  // Keep only connections between leafs
  // Also find connections based on same relation
  const groupedByRelation = new Map<Rel, Array<DeploymentEdge & { commonAncestor: Fqn }>>()
  const result = pipe(
    edges,
    filter(conn => leafs.includes(conn.source) && leafs.includes(conn.target)),
    // Clone
    map(edge => ({
      ...edge,
      relations: new Set(edge.relations),
      commonAncestor: commonAncestor(edge.source.id, edge.target.id) ?? '$' as Fqn
    })),
    forEach(conn => {
      for (const relation of conn.relations) {
        getOrCreate(groupedByRelation, relation, () => []).push(conn)
      }
    })
  )

  // In each group, find connected to same leaf
  for (const [relation, group] of groupedByRelation) {
    if (!hasAtLeast(group, 2)) {
      continue
    }

    // Connected to same source / target
    pipe(
      group,
      flatMap(conn => [
        { id: '_s_' + conn.source.id, conn },
        { id: '_t_' + conn.target.id, conn }
      ]),
      groupBy(conn => conn.id),
      forEachObj((connections) => {
        if (connections.length > 1) {
          pipe(
            connections,
            map(prop('conn')),
            sort((a, b) => compareFqnHierarchically(a.commonAncestor, b.commonAncestor) * -1),
            // Skip connections in same deployment node
            dropWhile((conn, i, all) => i === 0 || conn.commonAncestor === all[i - 1]!.commonAncestor),
            // Clean relations from the rest
            forEach((conn) => {
              conn.relations.delete(relation)
              // const idx =  conn.basedOn.indexOf(relation)
              // invariant(idx >= 0, 'Should not happen')
              // conn.basedOn.splice(idx, 1)
            })
          )
        }
      })
    )
  }

  return pipe(
    result,
    filter(conn => conn.relations.size > 0),
    map(omit(['commonAncestor']))
  )
}

// class ComputeState {

//   #nodes = new Map<Fqn, Node>()
//   #children = new Map<Fqn, Set<Node>>()

//   constructor() {
//   }

//   get nodes(): ReadonlyMap<Fqn, Node> {
//     return this.#nodes;
//   }

// }

class Patch {
  // Intermediate state
  readonly #explicits = new Map<Fqn, Node>()

  // Implicit elements (initiator -> what added)
  readonly #implicits = new Map<Fqn, Node>()

  readonly #excluded = new Set<Node>()

  // constructor() {}

  public addExplicit(elements: Node | Node[]): void {
    if (!Array.isArray(elements)) {
      elements = [elements]
    }
    for (const el of elements) {
      this.#explicits.set(el.id, el)
      this.#implicits.delete(el.id)
    }
  }

  public addImplicit(elements: Node | Node[]): void {
    if (!Array.isArray(elements)) {
      elements = [elements]
    }
    for (const el of elements) {
      if (this.#explicits.has(el.id)) {
        continue
      }
      this.#implicits.set(el.id, el)
    }
  }

  public excludeElement(elements: Node | Node[]): void {
    if (!Array.isArray(elements)) {
      elements = [elements]
    }
    const excluded = new Set<Fqn>()
    for (const el of elements) {
      let done = this.#explicits.delete(el.id)
      done = this.#implicits.delete(el.id) || done
      if (done) {
        excluded.add(el.id)
        this.#excluded.add(el)
      }
    }
    // this._edges = this._edges.filter(e => !excluded.has(e.source.id) && !excluded.has(e.target.id))
  }

  public excludeImplicit(elements: Node | Node[]): void {
    if (!Array.isArray(elements)) {
      elements = [elements]
    }
    for (const el of elements) {
      if (this.#implicits.delete(el.id)) {
        this.#excluded.add(el)
      }
    }
  }

  // public addEdges(edges: Edges) {
  //   const added = [] as DeploymentEdge[]
  //   for (const e of edges) {
  //     if (e.relations.size === 0) {
  //       continue
  //     }
  //     const existing = this._edges.find(
  //       _e => _e.source.id === e.source.id && _e.target.id === e.target.id
  //     )
  //     if (existing) {
  //       existing.relations = new Set([...existing.relations, ...e.relations])
  //       added.push(existing)
  //       continue
  //     }
  //     added.push(e)
  //     this._edges.push(e)
  //   }
  //   return added as ReadonlyArray<DeploymentEdge>
  // }

  // public removeEdges<E extends Pick<DeploymentEdge, 'source' | 'target'>>(edges: ReadonlyArray<E>) {
  //   const ids = pipe(
  //     edges,
  //     // flatMap(([source, target]) => [
  //     //   [source, target],
  //     //   ...this.ancestors(source.id).map(e => [e, target] as const),
  //     //   ...this.ancestors(target.id).map(e => [source, e] as const)
  //     // ]),
  //     map(({ source, target }) => `${source.id}:${target.id}`)
  //   )
  //   const removed = [] as DeploymentEdge[]
  //   this._edges = this._edges.reduce((acc, e) => {
  //     if (ids.includes(`${e.source.id}:${e.target.id}`)) {
  //       removed.push(e)
  //       return acc
  //     }
  //     acc.push(e)
  //     return acc
  //   }, removed.slice())
  //   return removed as ReadonlyArray<DeploymentEdge>
  // }
}
