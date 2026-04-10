import {
  type AnyAux,
  type ComputedEdge,
  type ComputedNode,
  type ComputedView,
  type EdgeId,
  type HexColor,
  type LikeC4Styles,
  nonNullable,
} from '@likec4/core'
import { entries, first, isEmptyish, isNonNullish, isNumber, last } from 'remeda'
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

  protected override createGraph(): RootGraphModel {
    const G = super.createGraph()
    G.delete(_.TBbalance)
    return G
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
      .applyNodeRanks()
      .addInvisibleEdges()
      .enableNewRankIfNeeded()
    // .reduceDefaultRankSeparation()
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
    const isReverse = this.aiHints.reverseRank?.includes(edge.id) ?? false
    const [sourceFqn, targetFqn] = isReverse ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
    })
    if (edge.line && edge.line !== DefaultEdgeStyle) {
      e.attributes.set(_.style, edge.line)
    }

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
    if (weight !== undefined && weight !== 1) {
      e.attributes.set(_.weight, weight)
    }

    const minlen = this.aiHints.edgeMinlen[edge.id]
    if (minlen !== undefined && minlen !== 1) {
      e.attributes.set(_.minlen, minlen)
    }

    if (this.aiHints.excludeFromRanking?.includes(edge.id)) {
      e.attributes.set(_.constraint, false)
    }

    if (isReverse) {
      e.attributes.set(_.dir, 'back')
    }

    return e
  }

  protected addInvisibleEdges(): this {
    if (!this.aiHints.invisibleEdges) {
      return this
    }
    const G = this.G
    for (const { source, target, ...edge } of this.aiHints.invisibleEdges) {
      const gsource = this.getGraphNode(source)
      const gtarget = this.getGraphNode(target)
      if (!gsource || !gtarget) {
        continue
      }
      const edgeId = `invisible_${source}->${target}` as EdgeId
      if (this.edges.has(edgeId)) {
        this.logger
          .trace`invisible edge ${source} -> ${target} already exists with id ${edgeId}, skipping creation`
        continue
      }

      this.graphology.addEdgeWithKey(edgeId, source, target, {
        hierarchyDistance: 0,
        origin: 'invisible' as any,
        weight: edge.weight ?? 1,
      })
      const ge = G.edge([gsource, gtarget], {
        [_.style]: 'invis',
      })
      this.edges.set(edgeId, ge)
      if (edge.minlen !== undefined && edge.minlen !== 1) {
        ge.attributes.set(_.minlen, edge.minlen)
      }
      if (edge.weight !== undefined && edge.weight !== 1) {
        ge.attributes.set(_.weight, edge.weight)
      }
    }
    return this
  }

  protected reduceDefaultRankSeparation(): this {
    const autoLayout = this.view.autoLayout
    const G = this.G

    // If rankSep is set explicitly - use it
    if (isNumber(autoLayout.rankSep)) {
      return this
    }

    const hasMinlenAbove1 =
      // If any edge has minlen above 1
      entries(this.aiHints.edgeMinlen).some(([_, minlen]) => minlen > 1)
      // Or any invisible edge has minlen above 1
      || (
        this.aiHints.invisibleEdges?.some((edge) => edge.minlen && edge.minlen > 1)
          ?? false
      )

    if (!hasMinlenAbove1) {
      return this
    }

    // Reduce rank separation, as AI tends to spread nodes too far apart
    G.set(_.ranksep, pxToInch(80))

    return this
  }
}
