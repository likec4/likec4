import type { ComputedDynamicView, ComputedEdge } from '@likec4/core'
import { DefaultArrowType, DefaultRelationshipColor, defaultTheme as Theme, extractStep } from '@likec4/core'
import { difference, first, intersection, isNonNullish, last, unique } from 'remeda'
import type { EdgeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { stepEdgeLabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'
import type { DotSource } from './types'
import { toArrowType } from './utils'

export class DynamicViewPrinter extends DotPrinter<ComputedDynamicView> {
  static toDot(view: ComputedDynamicView): DotSource {
    return new DynamicViewPrinter(view).print()
  }

  protected override createGraph(): RootGraphModel {
    const G = super.createGraph()
    G.set(_.TBbalance, 'max')
    return G
  }

  protected override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
    const { nodes: viewNodes } = this.view
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    if (edge.color && edge.color !== DefaultRelationshipColor) {
      const colorValues = this.getRelationshipColorValues(edge.color)
      e.attributes.apply({
        [_.color]: colorValues.lineColor,
        [_.fontcolor]: colorValues.labelColor
      })
    }

    const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail)

    const step = extractStep(edge.id)
    const label = stepEdgeLabel(step, edge.label?.trim())
    e.attributes.set(_.label, label)

    if (!hasCompoundEndpoint) {
      const connected = new Set([
        // ...sourceNode.inEdges,
        ...sourceNode.outEdges,
        ...targetNode.inEdges,
        ...intersection(targetNode.outEdges, sourceNode.inEdges)
        // ...targetNode.outEdges
      ].filter(e => !this.edgesWithCompounds.has(e)))
      e.attributes.set(_.weight, connected.size)
    }

    // IF we already have "seen" the target node in previous steps
    // We don't want constraints to be applied
    const sourceIdx = viewNodes.findIndex(n => n.id === sourceFqn)
    const targetIdx = viewNodes.findIndex(n => n.id === targetFqn)
    if (targetIdx < sourceIdx && edge.dir !== 'back') {
      e.attributes.apply({
        [_.constraint]: false
      })
    }

    let [head, tail] = [edge.head ?? DefaultArrowType, edge.tail ?? 'none']

    if (edge.dir === 'back') {
      e.attributes.apply({
        [_.arrowtail]: toArrowType(head),
        [_.minlen]: 0,
        [_.dir]: 'back'
      })
      if (tail !== 'none') {
        e.attributes.apply({
          [_.arrowhead]: toArrowType(tail),
          // [_.constraint]: false,
          [_.dir]: 'both'
        })
      }
      return e
    }

    if ((head === 'none' && tail === 'none') || (head !== 'none' && tail !== 'none')) {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both'
        // [_.constraint]: false,
        // [_.minlen]: 1
      })
      return e
    }

    if (head === 'none') {
      e.attributes.delete(_.arrowhead)
      e.attributes.apply({
        [_.arrowtail]: toArrowType(tail),
        [_.minlen]: 0,
        [_.dir]: 'back'
      })
      return e
    }
    if (head !== DefaultArrowType) {
      e.attributes.set(_.arrowhead, toArrowType(head))
    }

    return e
  }
}
