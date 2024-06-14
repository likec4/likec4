import type { ComputedEdge, ComputedElementView, Fqn, RelationshipLineType } from '@likec4/core'
import { defaultTheme as Theme, nonNullable } from '@likec4/core'
import { first, isNullish, isTruthy, last } from 'remeda'
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

    if (lhead || ltail) {
      const sourceId = source.attributes.get(_.likec4_id) as Fqn
      const targetId = target.attributes.get(_.likec4_id) as Fqn
      const existingVisibleEdge = viewEdges.find(e => e.source === sourceId && e.target === targetId)
      if (existingVisibleEdge) {
        e.attributes.set(_.weight, 0)
      }
    }

    const label = edge.label?.trim() ?? ''
    if (isTruthy(label)) {
      e.attributes.apply({
        [_.label]: edgeLabel(label)
      })
    }
    if (edge.color) {
      e.attributes.apply({
        [_.color]: Theme.relationships[edge.color].lineColor,
        [_.fontcolor]: Theme.relationships[edge.color].labelColor
      })
    }

    if (edge.dir === 'back') {
      if (edge.head) {
        e.attributes.set(_.arrowtail, toArrowType(edge.head))
      }
      if (edge.tail && edge.tail !== 'none') {
        e.attributes.set(_.arrowhead, toArrowType(edge.tail))
      } else {
        e.attributes.set(_.arrowhead, 'none')
      }
      e.attributes.set(_.dir, 'back')
      return e
    }

    if (edge.head) {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(edge.head)
      })
    }
    if (edge.tail && edge.tail !== 'none') {
      if (edge.head === 'none') {
        e.attributes.apply({
          [_.arrowtail]: toArrowType(edge.tail),
          [_.dir]: 'back'
        })
      } else {
        e.attributes.apply({
          [_.arrowtail]: toArrowType(edge.tail),
          [_.dir]: 'both'
          // [_.constraint]: false
        })
      }
    }

    if (edge.head === 'none' && (isNullish(edge.tail) || edge.tail === 'none')) {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        // [_.minlen]: 0
        [_.constraint]: false
      })
      return e
    }

    // This heuristic removes the rank constraint from the edge
    // if it is the only edge within container.
    let otherEdges
    if (edgeParentId === null && sourceNode.parent == null && targetNode.parent == null) {
      otherEdges = viewEdges.filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        // hide edges inside clusters
        if (e.parent !== null) {
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
      otherEdges = this.findNestedEdges(edgeParentId).filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges with the same endpoints
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
        // e.attributes.set(_.minlen, 0)
        e.attributes.set(_.constraint, false)
      }
    }

    return e
  }
}
