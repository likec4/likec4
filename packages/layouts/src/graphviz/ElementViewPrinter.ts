import type { ComputedEdge, ComputedElementView, ComputedNode, Fqn } from '@likec4/core'
import { compareFqnHierarchically, DefaultArrowType, defaultTheme as Theme, nonNullable } from '@likec4/core'
import { chunk, clamp, filter, first, isNonNullish, isTruthy, last, map, pipe, reverse, sort, take } from 'remeda'
import type { EdgeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { edgeLabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'
import type { DotSource } from './types'
import { isCompound, toArrowType } from './utils'

export class ElementViewPrinter extends DotPrinter<ComputedElementView> {
  static toDot(view: ComputedElementView): DotSource {
    return new ElementViewPrinter(view).print()
  }

  protected override buildGraphvizModel(G: RootGraphModel): void {
    super.buildGraphvizModel(G)

    // const compoundIds = new Set<Fqn>()
    // const compounds = this.view.nodes.reduce((acc, node) => {
    //   if (isCompound(node)) {
    //     compoundIds.add(node.id)
    //     acc.push(node)
    //   }
    //   return acc
    // }, [] as ComputedNode[])

    // for (const compound of compounds) {
    //   if (compound.depth! > 1 || this.hasInternalEdges(compound.id)) {
    //     continue
    //   }
    //   const subgraph = nonNullable(this.getSubgraph(compound.id), `Subgraph not found for ${compound.id}`)
    //   let chunkSize = 2
    //   switch (true) {
    //     case compound.children.length % 4 === 0 || compound.children.length % 4 >= 2:
    //       chunkSize = 4
    //       break
    //     case compound.children.length % 3 === 0 || compound.children.length % 3 === 2:
    //       chunkSize = 3
    //       break
    //   }
    //   if (compound.children.length <= chunkSize) {
    //     subgraph.set(_.rank, 'same')
    //     continue
    //   }
    //   chunk(compound.children, chunkSize).forEach((chunk) => {
    //     if (chunk.length <= 1) {
    //       return
    //     }
    //     const ranked = subgraph.createSubgraph({
    //       [_.rank]: 'same'
    //     })
    //     for (const child of chunk) {
    //       const nd = this.getGraphNode(child)
    //       if (nd) {
    //         ranked.node(nd.id)
    //       }
    //     }
    //   })
    // }

    this.assignGroups()
  }

  protected override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
    const viewEdges = this.view.edges
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const edgeParentId = edge.parent
    const parent = edgeParentId === null
      ? G
      : nonNullable(this.getSubgraph(edgeParentId), `Parent not found for edge ${edge.id}`)

    const e = parent.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail)

    if (hasCompoundEndpoint) {
      const sourceId = source.attributes.get(_.likec4_id) as Fqn
      const targetId = target.attributes.get(_.likec4_id) as Fqn
      const existingVisibleEdge = viewEdges.find(e => e.source === sourceId && e.target === targetId)
      if (existingVisibleEdge) {
        e.attributes.set(_.weight, 0)
      }
    }

    if (!hasCompoundEndpoint) {
      let weight = 1
      // "Strengthen" edges that are single in/out
      switch (true) {
        case sourceNode.outEdges.length === 1 && targetNode.inEdges.length === 1:
          weight = Math.max(targetNode.outEdges.length + sourceNode.inEdges.length, 2)
          break
        case sourceNode.outEdges.length === 1 && sourceNode.inEdges.length <= 1:
          weight = targetNode.inEdges.length - sourceNode.inEdges.length
          break
        case targetNode.inEdges.length === 1 && targetNode.outEdges.length <= 1:
          weight = sourceNode.outEdges.length - targetNode.outEdges.length
          break
      }
      if (weight > 1) {
        e.attributes.set(_.weight, weight)
      }
    }

    const label = isTruthy(edge.label) ? edgeLabel(edge.label) : null
    if (isTruthy(label)) {
      if (lhead || ltail) {
        e.attributes.set(_.xlabel, label)
      } else {
        e.attributes.set(_.label, label)
      }
    }
    if (edge.color) {
      e.attributes.apply({
        [_.color]: Theme.relationships[edge.color].lineColor,
        [_.fontcolor]: Theme.relationships[edge.color].labelColor
      })
    }

    let [head, tail] = [edge.head ?? DefaultArrowType, edge.tail ?? 'none']

    if (edge.dir === 'back') {
      e.attributes.apply({
        [_.arrowtail]: toArrowType(head),
        [_.dir]: 'back'
      })
      if (tail !== 'none') {
        e.attributes.apply({
          [_.arrowhead]: toArrowType(tail),
          [_.dir]: 'both'
        })
      }
      return e
    }

    if (head === 'none' && tail === 'none') {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.constraint]: false
      })
      return e
    }

    if (head !== 'none' && tail !== 'none') {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both',
        [_.minlen]: 0
      })
      return e
    }

    if (head !== DefaultArrowType) {
      e.attributes.set(_.arrowhead, toArrowType(head))
    }
    if (tail !== 'none') {
      e.attributes.set(_.arrowtail, toArrowType(tail))
    }

    // Skip the following heuristic if this is the only edge in view
    if (viewEdges.length === 1) {
      return e
    }

    // This heuristic removes the rank constraint from the edge
    // if it is the only edge within container.
    let otherEdges
    if (edgeParentId === null && sourceNode.parent == null && targetNode.parent == null) {
      otherEdges = viewEdges.filter(e => {
        // exclude self
        if (e.id === edge.id) {
          return false
        }
        // exclude edges inside clusters
        if (e.parent !== null) {
          return false
        }
        // exclude edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        const edgeSource = this.viewElement(e.source)
        const edgeTarget = this.viewElement(e.target)
        // hide edges with compound endpoints
        if (isCompound(edgeSource) || isCompound(edgeTarget)) {
          return false
        }
        // only edges between top-level nodes
        return edgeSource.parent == null && edgeTarget.parent == null
      })
    } else {
      otherEdges = this.findInternalEdges(edgeParentId).filter(e => {
        // exclude self
        if (e.id === edge.id) {
          return false
        }
        // exclude edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        return true
      })
    }
    const isTheOnlyEdge = otherEdges.length === 0
    if (isTheOnlyEdge) {
      if (edgeParentId === null || this.leafElements(edgeParentId).length <= 3) {
        // don't rank the edge
        e.attributes.set(_.minlen, 1)
        e.attributes.set(_.constraint, false)
      }
    }

    return e
  }
}
