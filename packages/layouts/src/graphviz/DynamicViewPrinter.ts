import type { ComputedDynamicView, ComputedEdge } from '@likec4/core'
import { DefaultArrowType, DefaultRelationshipColor, defaultTheme as Theme, extractStep } from '@likec4/core'
import { difference, first, isNonNullish, last, unique } from 'remeda'
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

  protected override buildGraphvizModel(G: RootGraphModel): void {
    super.buildGraphvizModel(G)
    this.assignGroups()
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
      e.attributes.apply({
        [_.color]: Theme.relationships[edge.color].lineColor,
        [_.fontcolor]: Theme.relationships[edge.color].labelColor
      })
    }

    const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail)

    const step = extractStep(edge.id)
    const label = stepEdgeLabel(step, edge.label?.trim())
    if (hasCompoundEndpoint) {
      e.attributes.set(_.xlabel, label)
    } else {
      e.attributes.set(_.label, label)
    }

    let weight = 1
    if (!hasCompoundEndpoint) {
      const cleanSourceNode = this.withoutCompoundEdges(sourceNode)
      const cleanTargetNode = this.withoutCompoundEdges(targetNode)
      // "Strengthen" edges that are single in/out
      switch (true) {
        case cleanSourceNode.outEdges.length === 1 && targetNode.inEdges.length === 1:
          weight = unique([...cleanSourceNode.inEdges, ...targetNode.outEdges]).length + 1
          break
        case cleanSourceNode.outEdges.length === 1:
          weight = difference(unique([...cleanTargetNode.outEdges, ...cleanTargetNode.inEdges]), [
            ...cleanSourceNode.inEdges,
            ...cleanSourceNode.outEdges
          ]).length
          break
        case cleanTargetNode.inEdges.length === 1:
          weight = difference(unique([...cleanSourceNode.inEdges, ...cleanSourceNode.outEdges]), [
            ...cleanTargetNode.inEdges,
            ...cleanTargetNode.outEdges
          ]).length
          break
      }
      if (weight > 1) {
        e.attributes.set(_.weight, weight)
      }
    }

    // IF we already have "seen" the target node in previous steps
    // We don't want constraints to be applied
    const sourceIdx = viewNodes.findIndex(n => n.id === sourceFqn)
    const targetIdx = viewNodes.findIndex(n => n.id === targetFqn)
    if (targetIdx < sourceIdx || targetIdx === sourceIdx) {
      e.attributes.apply({
        [_.constraint]: false,
        [_.minlen]: targetIdx === sourceIdx ? 0 : 1
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
          [_.constraint]: false,
          [_.dir]: 'both'
        })
      }
      return e
    }

    if ((head === 'none' && tail === 'none') || (head !== 'none' && tail !== 'none')) {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both',
        [_.constraint]: false,
        [_.minlen]: 1
      })
      return e
    }

    if (head === 'none') {
      e.attributes.delete(_.arrowhead)
      e.attributes.apply({
        [_.arrowtail]: toArrowType(tail),
        [_.constraint]: false,
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
