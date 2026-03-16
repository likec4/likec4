import type {
  AnyAux,
  ComputedEdge,
  ComputedView,
  HexColor,
  LikeC4Styles,
} from '@likec4/core'
import { first, isNonNullish, last } from 'remeda'
import type { EdgeModel, NodeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import type { AISuggestedLayoutHints } from './ai/types'
import { edgelabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'

export class AiLayoutViewPrinter<A extends AnyAux> extends DotPrinter<ComputedView<A>> {
  protected readonly aiHints: AISuggestedLayoutHints

  constructor(
    view: ComputedView<A>,
    styles: LikeC4Styles,
    aiHints: AISuggestedLayoutHints,
  ) {
    super(view, styles)
    this.aiHints = aiHints
  }

  protected override postBuild(G: RootGraphModel): void {
    this
      .applyNodeRanks()
      .enableNewRankIfNeeded()
  }

  private applyNodeRanks(): this {
    let applied = 0
    for (const constraint of this.aiHints.ranks) {
      const nodes = [...new Set(constraint.nodes)]
        .map(id => this.getGraphNode(id))
        .filter((node): node is NodeModel => Boolean(node))
      if (nodes.length === 0) {
        continue
      }
      const rankSubgraph = this.graphvizModel.createSubgraph({ [_.rank]: constraint.rank })
      nodes.forEach(node => rankSubgraph.node(node.id))
      applied += 1
    }
    return this
  }

  protected override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle,
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail)

    const label = edgelabel(edge)
    if (label) {
      e.attributes.set(
        hasCompoundEndpoint ? _.xlabel : _.label,
        label,
      )
    }
    if (edge.color && edge.color !== this.$defaults.relationship.color) {
      const colorValues = this.styles.colors(edge.color).relationships
      e.attributes.apply({
        [_.color]: colorValues.line,
        [_.fontcolor]: colorValues.label as HexColor,
      })
    }

    const weight = this.aiHints.edgeWeight[edge.id] ?? 1

    if (weight !== 1) {
      e.attributes.set(_.weight, weight)
    }

    const minlen = this.aiHints.edgeMinlen[edge.id]

    if (minlen !== undefined) {
      e.attributes.set(_.minlen, minlen)
    }

    return e
  }
}
