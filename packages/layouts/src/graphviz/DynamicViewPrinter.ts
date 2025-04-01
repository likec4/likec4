import type { ComputedDynamicView, ComputedEdge } from '@likec4/core'
import { DefaultArrowType, DefaultRelationshipColor, extractStep, isome } from '@likec4/core'
import { first, isTruthy, last } from 'remeda'
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

  protected override postBuild(G: RootGraphModel): void {
    G.delete(_.TBbalance)
  }

  protected override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
    const { nodes: viewNodes } = this.view
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle,
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    if (edge.color && edge.color !== DefaultRelationshipColor) {
      const colorValues = this.getRelationshipColorValues(edge.color)
      e.attributes.apply({
        [_.color]: colorValues.lineColor,
        [_.fontcolor]: colorValues.labelColor,
      })
    }

    const labelText = [
      edge.label?.trim(),
      edge.technology?.trim(),
    ].filter(isTruthy).join('\n')

    const step = extractStep(edge.id)
    const label = stepEdgeLabel(step, labelText)
    e.attributes.set(_.label, label)

    const weight = this.graphology.getEdgeAttribute(edge.id, 'weight')

    if (edge.source !== edge.target && weight > 1) {
      e.attributes.set(_.weight, weight)
    }

    // IF we already have "seen" the target node in previous steps
    // We don't want constraints to be applied
    const sourceIdx = viewNodes.findIndex(n => n.id === sourceFqn)
    const targetIdx = viewNodes.findIndex(n => n.id === targetFqn)
    if (targetIdx < sourceIdx && edge.dir !== 'back') {
      e.attributes.apply({
        [_.constraint]: false,
      })
    }

    let [head, tail] = [edge.head ?? DefaultArrowType, edge.tail ?? 'none']

    if (edge.dir === 'back') {
      e.attributes.apply({
        [_.arrowtail]: toArrowType(head),
        [_.minlen]: 0,
        [_.dir]: 'back',
      })
      if (tail !== 'none') {
        e.attributes.apply({
          [_.arrowhead]: toArrowType(tail),
          // [_.constraint]: false,
          [_.dir]: 'both',
        })
      }
      return e
    }

    if ((head === 'none' && tail === 'none') || (head !== 'none' && tail !== 'none')) {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both',
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
        [_.dir]: 'back',
      })
      return e
    }
    if (head !== DefaultArrowType) {
      e.attributes.set(_.arrowhead, toArrowType(head))
    }

    return e
  }
}
