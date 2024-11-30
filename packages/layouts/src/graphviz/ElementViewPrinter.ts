import type { ComputedEdge, ComputedElementView, ComputedNode, ComputedView, Fqn } from '@likec4/core'
import { DefaultArrowType, nonNullable } from '@likec4/core'
import { chunk, filter, first, isNonNullish, last, map, pipe } from 'remeda'
import type { EdgeModel, NodeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { edgelabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'
import { isCompound, toArrowType } from './utils'

export class ElementViewPrinter<V extends ComputedView = ComputedElementView> extends DotPrinter<V> {
  protected override postBuild(_g: RootGraphModel): void {
    this.assignGroups()

    // Below is custom made "tile" layout for compound nodes
    const compoundIds = new Set<Fqn>()
    const compounds = this.view.nodes.reduce((acc, node) => {
      if (isCompound(node)) {
        compoundIds.add(node.id)
        acc.push(node)
      }
      return acc
    }, [] as ComputedNode[])

    for (const compound of compounds) {
      const children = pipe(
        compound.children,
        filter(id => !this.compoundIds.has(id)),
        map(id => this.viewElement(id)),
        filter(nd => nd.inEdges.length === 0 && nd.outEdges.length === 0)
      )
      if (children.length <= 2) {
        continue
      }

      let chunkSize = 2
      switch (true) {
        case children.length > 11:
          chunkSize = 4
          break
        case children.length > 4:
          chunkSize = 3
          break
      }
      const subgraph = nonNullable(this.getSubgraph(compound.id), `Subgraph not found for ${compound.id}`)
      let prevChunkHead: NodeModel | null = null
      chunk(children, chunkSize).forEach((chunk) => {
        const ranked = chunk.length > 1
          ? subgraph.createSubgraph({ [_.rank]: 'same' })
          : null
        chunk.forEach((child, i) => {
          const nd = this.getGraphNode(child.id)
          if (!nd) {
            return
          }
          ranked?.node(nd.id)
          // Make invisible edges between chunks (link heads)
          if (i === 0) {
            if (prevChunkHead) {
              subgraph.edge([prevChunkHead, nd], {
                [_.style]: 'invis'
                // [_.weight]: 0 /
              })
            }
            prevChunkHead = nd
          }
        })
      })
    }
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

    if (!hasCompoundEndpoint) {
      const connected = new Set([
        ...sourceNode.inEdges,
        ...sourceNode.outEdges,
        ...targetNode.inEdges,
        ...targetNode.outEdges
      ].filter(e => !this.edgesWithCompounds.has(e)))
      e.attributes.set(_.weight, connected.size)
    }

    const label = edgelabel(edge)
    if (label) {
      if (hasCompoundEndpoint) {
        e.attributes.set(_.xlabel, label)
      } else {
        e.attributes.set(_.label, label)
      }
    }
    if (edge.color) {
      const colorValues = this.getRelationshipColorValues(edge.color)
      e.attributes.apply({
        [_.color]: colorValues.lineColor,
        [_.fontcolor]: colorValues.labelColor
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
          [_.dir]: 'both',
          [_.minlen]: 0
        })
      }
      return e
    }

    if (head === 'none' && tail === 'none') {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.minlen]: 0,
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

    if (!hasCompoundEndpoint && targetNode.outEdges.length === 0) {
      e.attributes.set(_.dir, 'both')
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
        e.attributes.set(_.minlen, 0)
        // e.attributes.set(_.constraint, false)
      }
    }

    return e
  }
}
