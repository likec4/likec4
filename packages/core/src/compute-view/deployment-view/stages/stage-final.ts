import DefaultMap from 'mnemonist/default-map'
import { forEach, only, pipe } from 'remeda'
import { differenceConnections } from '../../../model/connection'
import type { RelationshipModel } from '../../../model/RelationModel'
import { isAncestor, sortByFqnHierarchically } from '../../../utils/fqn'
import { ifilter, isome, toArray } from '../../../utils/iterable'
import { difference, union } from '../../../utils/set'
import { treeFromMemoryState } from '../../memory'
import { cleanCrossBoundary, cleanRedundantRelationships } from '../clean-connections'
import type { Ctx, Memory } from '../memory'

type Elem = Ctx['Element']
/**
 * This patch:
 * 1. Keeps connections between leafs or having direct deployment relations
 * 2. Removes cross-boundary model relations, that already exist inside boundaries
 *    (e.g. prefer relations inside same deployment node over relations between nodes)
 * 3. Removes implicit connections between elements, if their descendants have same connection
 */
export class StageFinal {
  static for(memory: Memory) {
    return new StageFinal(memory)
  }

  private constructor(
    protected readonly memory: Memory,
  ) {
  }

  public step1CleanConnections(memory: Memory): Memory {
    if (memory.connections.length < 2) {
      return memory
    }

    // const leafs = new Set<Elem>()

    // for (const element of memory.final) {
    //   // Instance is always leaf
    //   if (element.isInstance()) {
    //     leafs.add(element)
    //     continue
    //   }
    //   // Check if element is ancestor of any element in elements
    //   let isLeaf = true
    //   for (const el of memory.final) {
    //     if (isAncestor(element.id, el.id)) {
    //       isLeaf = false
    //       break
    //     }
    //   }
    //   if (isLeaf) {
    //     leafs.add(element)
    //   }
    // }

    const connections = pipe(
      memory.connections,
      // Keep connections
      // - between leafs
      // - has direct deployment relation
      // filter(c => {
      //   return (leafs.has(c.source) && leafs.has(c.target)) || c.hasDirectDeploymentRelation()
      // }),
      cleanCrossBoundary,
      cleanRedundantRelationships,
    )

    const connectionsToExclude = differenceConnections(
      memory.connections,
      connections,
    )
    if (connectionsToExclude.length === 0) {
      return memory
    }
    const stage = memory.stageExclude({} as any)
    stage.excludeConnections(connectionsToExclude, true)
    return stage.commit()
  }

  public step2ProcessImplicits(memory: Memory): Memory {
    const implicits = union(this.memory.elements, memory.elements)
    const final = union(memory.final, this.memory.explicits)

    // Find connections based on same relation but different boundaries
    const groupedByRelation = new DefaultMap<RelationshipModel, Set<Elem>>(() => new Set())
    for (const conn of memory.connections) {
      if (conn.boundary) {
        for (const relation of conn.relations.model) {
          groupedByRelation.get(relation).add(conn.boundary)
        }
      }
    }
    for (const [_, boundaries] of groupedByRelation) {
      if (boundaries.size < 2) {
        continue
      }
      for (const boundary of boundaries) {
        if (implicits.delete(boundary)) {
          final.add(boundary)
        }
      }
    }

    const snapshot = new Set(final)
    const isFinalOrHasIncludedDescendant = (el: Elem) => {
      for (const final of snapshot) {
        if (el === final || isAncestor(el, final)) {
          return true
        }
      }
      return false
    }

    // Pick from implicit elements
    pipe(
      difference(implicits, snapshot),
      ifilter(e => e.isDeploymentNode()),
      toArray(),
      sortByFqnHierarchically,
      forEach((el) => {
        // If element has more 2 or more children included
        // It can "box" around
        const childrensToWrap = [...el.children()].filter(isFinalOrHasIncludedDescendant).length
        if (childrensToWrap >= 2) {
          final.add(el)
          return
        }
        // If Element has only one child included
        // and has "similar" sibling with included descendant
        if (childrensToWrap === 1 && isome(el.siblings(), isFinalOrHasIncludedDescendant)) {
          final.add(el)
        }
      }),
    )

    return memory.update({ final })
  }

  public step3ProcessBoundaries(memory: Memory): Memory {
    const boundaries = new Set<Elem>()
    for (const conn of memory.connections) {
      if (conn.boundary) {
        boundaries.add(conn.boundary)
      }
    }
    const tree = treeFromMemoryState<Ctx>(memory, 'final')
    const stage = memory.stageExclude({} as any)

    const isRemovable = (el: Elem) =>
      !(
        boundaries.has(el)
        || memory.explicits.has(el)
        || tree.hasInOut(el)
        || tree.root.has(el)
      )

    const singleRoot = only([...tree.root])
    if (singleRoot && !memory.explicits.has(singleRoot)) {
      stage.exclude(singleRoot)
    }

    for (const el of memory.final) {
      const singleChild = only(tree.children(el))
      if (singleChild && !tree.hasInOut(singleChild) && isRemovable(el)) {
        stage.exclude(el)
      }
    }

    if (stage.isDirty()) {
      return stage.commit()
    }
    return memory
  }

  // TODO: Lot of corner cases to cover, skip for now
  // public step3FlatNodes(memory: Memory): Memory {
  //   // final implicits
  //   const explicits = new Set<Elem>([
  //     ...memory.explicits,
  //     ...memory.connections.flatMap(c => [c.source, c.target]),
  //   ])
  //   const sorted = sortParentsFirst(toArray(memory.final))

  //   const toplevel = new Set<Elem>(sorted)
  //   const children = sorted.reduce((acc, el, index, all) => {
  //     acc.set(
  //       el,
  //       new Set(
  //         all
  //           .slice(index + 1)
  //           .filter(e => isAncestor(el, e))
  //           .reduce((acc, el) => {
  //             if (!acc.some(e => isAncestor(e, el))) {
  //               toplevel.delete(el)
  //               acc.push(el)
  //             }
  //             return acc
  //           }, [] as Elem[]),
  //       ),
  //     )
  //     return acc
  //   }, new DefaultMap<Elem, Set<Elem>>(() => new Set()))

  //   const state = memory.mutableState()

  //   function flattenNode(node: Elem) {
  //     const _children = [...children.get(node)]
  //     if (_children.length > 1) {
  //       for (const child of _children) {
  //         flattenNode(child)
  //       }
  //       return !explicits.has(node)
  //     }
  //     if (hasAtLeast(_children, 1)) {
  //       if (flattenNode(_children[0])) {
  //         state.final.delete(_children[0])
  //       }
  //     }
  //     return !explicits.has(node)
  //   }

  //   const root = [...toplevel]
  //   for (const node of root) {
  //     flattenNode(node)
  //     if (!explicits.has(node) && children.get(node).size === 1) {
  //       state.final.delete(node)
  //     }
  //   }
  //   if (root.length === 1 && !explicits.has(root[0]!)) {
  //     state.final.delete(root[0]!)
  //   }

  //   return memory.update(state)
  // }

  public commit(): Memory {
    // return []
    const step1 = this.step1CleanConnections(this.memory)
    const step2 = this.step2ProcessImplicits(step1)
    return this.step3ProcessBoundaries(step2)
    // return step2memory
    // const step3m?emory = this.step3FlatNodes(step2memory)
    // return step3memory
  }
}
