import type {
  AnyAux,
  ComputedEdge,
  ComputedNode,
  ComputedView,
  EdgeId,
  HexColor,
  LikeC4Styles,
} from '@likec4/core'
import { entries, first, isNonNullish, isNumber, last } from 'remeda'
import type { EdgeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import type { AiLayoutHints } from './ai/types'
import { edgelabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'
import { pxToInch } from './utils'

export class AiLayoutViewPrinter<A extends AnyAux> extends DotPrinter<ComputedView<A>> {
  protected readonly aiHints: AiLayoutHints

  constructor(
    view: ComputedView<A>,
    styles: LikeC4Styles,
    aiHints: AiLayoutHints,
  ) {
    super(view, styles)
    this.aiHints = aiHints
  }

  protected override selectViewNodes(): Iterable<ComputedNode> {
    if (!this.aiHints.nodeOrder) {
      return this.view.nodes
    }
    const viewnodes = [...this.view.nodes]
    const sorted: ComputedNode[] = []
    for (const nodeId of this.aiHints.nodeOrder) {
      const index = viewnodes.findIndex(n => n.id === nodeId)
      if (index !== -1) {
        sorted.push(...viewnodes.splice(index, 1))
      }
    }
    sorted.push(...viewnodes)
    return sorted
  }

  protected override selectViewEdges(): Iterable<ComputedEdge> {
    if (!this.aiHints.edgeOrder) {
      return this.view.edges
    }
    const viewedges = [...this.view.edges]
    const sorted: ComputedEdge[] = []
    for (const edgeId of this.aiHints.edgeOrder) {
      const index = viewedges.findIndex(e => e.id === edgeId)
      if (index !== -1) {
        sorted.push(...viewedges.splice(index, 1))
      }
    }
    sorted.push(...viewedges)
    return sorted
  }

  protected override postBuild(G: RootGraphModel): void {
    this
      .reduceDefaultRankSeparation()
      .applyNodeRanks()
      .addInvisibleEdges()
      .enableNewRankIfNeeded()
  }

  private applyNodeRanks(): this {
    const G = this.G
    for (const constraint of this.aiHints.ranks) {
      const nodes = [...new Set(constraint.nodes)]
        .map(id => this.getGraphNode(id))
        .filter(isNonNullish)
      if (nodes.length === 0 || (constraint.rank === 'same' && nodes.length === 1)) {
        continue
      }
      const rankSubgraph = G.createSubgraph({ [_.rank]: constraint.rank })
      for (const node of nodes) {
        rankSubgraph.node(node.id)
      }
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

    const weight = this.aiHints.edgeWeight[edge.id]
    if (weight !== undefined) {
      e.attributes.set(_.weight, weight)
    }

    const minlen = this.aiHints.edgeMinlen[edge.id]
    if (minlen !== undefined) {
      e.attributes.set(_.minlen, minlen)
    }

    if (this.aiHints.excludeFromRanking?.has(edge.id)) {
      e.attributes.set(_.constraint, false)
    }

    return e
  }

  protected addInvisibleEdges(): this {
    if (!this.aiHints.invisibleEdges) {
      return this
    }
    const G = this.G
    for (const edge of this.aiHints.invisibleEdges) {
      if (this.graphology.hasEdge(edge.source, edge.target)) {
        continue
      }
      const source = this.getGraphNode(edge.source)
      const target = this.getGraphNode(edge.target)
      if (!source || !target) {
        continue
      }
      const edgeId = `invisible_${edge.source}->${edge.target}` as EdgeId
      this.graphology.addEdgeWithKey(edgeId, edge.source, edge.target, {
        hierarchyDistance: 0,
        origin: 'invisible' as any,
        weight: edge.weight ?? 1,
      })

      G.edge([source, target], {
        [_.style]: 'invis',
        [_.weight]: edge.weight ?? 1,
        [_.minlen]: edge.minlen ?? 1,
      })
    }
    return this
  }

  protected reduceDefaultRankSeparation(): this {
    const autoLayout = this.view.autoLayout
    const G = this.G

    const hasMinlenAbove1 = entries(this.aiHints.edgeMinlen).some(([_, minlen]) => minlen > 1)
      || (this.aiHints.invisibleEdges?.some((edge) => edge.minlen > 1) ?? false)

    // If rankSep is set or there are no minlen constraints, use default layout
    if (isNumber(autoLayout.rankSep) || !hasMinlenAbove1) {
      return this
    }

    // Reduce rank separation, as AI tends to spread nodes too far apart
    G.set(_.ranksep, pxToInch(80))

    return this
  }
}
