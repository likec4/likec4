import type { ComputedDynamicView, ComputedEdge, ComputedElementView } from '@likec4/core'
import { DefaultRelationshipColor, defaultTheme as Theme, extractStep } from '@likec4/core'
import { first, isNullish, last } from 'remeda'
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
    const { nodes: viewNodes, edges: viewEdges } = this.view
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    const step = extractStep(edge.id)
    const label = edge.label?.trim()
    e.attributes.apply({
      [_.label]: stepEdgeLabel(step, label)
    })
    if (edge.color && edge.color !== DefaultRelationshipColor) {
      e.attributes.apply({
        [_.color]: Theme.relationships[edge.color].lineColor,
        [_.fontcolor]: Theme.relationships[edge.color].labelColor
      })
    }

    if (edge.head === 'none' && (isNullish(edge.tail) || edge.tail === 'none')) {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.minlen]: 0,
        [_.weight]: 0
      })
      return e
    }

    // IF we already have "seen" the target node in previous steps
    // We don't want constraints to be applied
    const sourceIdx = viewNodes.findIndex(n => n.id === sourceFqn)
    const targetIdx = viewNodes.findIndex(n => n.id === targetFqn)
    if (targetIdx < sourceIdx) {
      e.attributes.apply({
        [_.minlen]: 0,
        [_.weight]: 0
      })
    }

    if (edge.dir === 'back') {
      e.attributes.set(_.arrowtail, toArrowType(edge.head ?? 'normal'))
      if (edge.tail && edge.tail !== 'none') {
        e.attributes.set(_.arrowhead, toArrowType(edge.tail))
      } else {
        e.attributes.set(_.arrowhead, 'none')
      }
      e.attributes.apply({
        [_.dir]: 'back',
        [_.weight]: 0
      })
      return e
    }

    if (edge.head && edge.head !== 'normal') {
      e.attributes.set(_.arrowhead, toArrowType(edge.head))
    }
    if (edge.tail && edge.tail !== 'none') {
      e.attributes.set(_.arrowtail, toArrowType(edge.tail))
    }

    return e
  }
}
