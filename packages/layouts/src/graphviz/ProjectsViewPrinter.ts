import type { HexColor } from '@likec4/core'
import type { ComputedProjectEdge, ComputedProjectsNode, ComputedProjectsView } from '@likec4/core/compute-view'
import { LikeC4Styles } from '@likec4/core/styles'
import { nonNullable } from '@likec4/core/utils'
import type { EdgeModel, NodeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { edgelabel } from './dot-labels'
import { DotPrinter } from './DotPrinter'
import { pxToInch } from './utils'

/** Pulls the layers toward one column. Real edges still compete for the x position. */
const LAYER_ALIGN_WEIGHT = 100

export class ProjectsViewPrinter extends DotPrinter<ComputedProjectsView> {
  static toDot(view: ComputedProjectsView) {
    return new ProjectsViewPrinter(view).print()
  }

  constructor(view: ComputedProjectsView) {
    super(view, LikeC4Styles.DEFAULT)
  }

  protected override createGraph(): RootGraphModel {
    const G = super.createGraph()
    G.apply({
      [_.nodesep]: pxToInch(100),
      [_.ranksep]: pxToInch(100),
    })
    G.delete(_.TBbalance)
    return G
  }

  protected override postBuild(): void {
    this.stackLayers().enableNewRankIfNeeded()
  }

  /**
   * Puts the projects of each layer on one rank, and orders the ranks with invisible edges.
   * Needs `newrank`, so the ranks hold across nested frames.
   */
  private stackLayers(): this {
    let previousAnchor: NodeModel | null = null
    for (const layerId of this.view.layers ?? []) {
      const projects = this.leafElements(layerId)
        .map(project => this.getGraphNode(project.id))
        .filter((project): project is NodeModel => project !== null)
      const [anchor] = projects
      if (!anchor) {
        continue
      }
      const rank = this.G.createSubgraph({ [_.rank]: 'same' })
      projects.forEach(project => rank.node(project.id))
      if (previousAnchor) {
        this.G.edge([previousAnchor, anchor], { [_.style]: 'invis', [_.weight]: LAYER_ALIGN_WEIGHT })
      }
      previousAnchor = anchor
    }
    return this
  }

  protected override elementToNode(element: ComputedProjectsNode, node: NodeModel) {
    if (element.kind === '@project') {
      node.attributes.apply({
        [_.likec4_id]: element.id,
        [_.likec4_project]: element.projectId,
      })
    }
    return super.elementToNode(element, node)
  }

  /**
   * Projects are rendered as cards, not as elements
   */
  protected override measureNode(): null {
    return null
  }

  protected override addEdge(edge: ComputedProjectEdge, G: RootGraphModel): EdgeModel | null {
    const source = nonNullable(this.getGraphNode(edge.source), `Node not found for ${edge.source}`)
    const target = nonNullable(this.getGraphNode(edge.target), `Node not found for ${edge.target}`)

    const edgeAttrs = this.graphology.getEdgeAttributes(edge.id)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.likec4_project]: edge.projectId,
    })
    if (edge.line && edge.line !== this.$defaults.relationship.line) {
      e.attributes.set(_.style, edge.line)
    }

    if (!this.graphology.hasDirectedEdge(edge.target, edge.source) && edgeAttrs.weight > 1) {
      e.attributes.set(_.weight, edgeAttrs.weight)
    }

    const label = edgelabel(edge)
    if (label) {
      e.attributes.set(_.label, label)
    }

    if (edge.color && edge.color !== this.$defaults.relationship.color) {
      const colorValues = this.styles.colors(edge.color).relationships
      e.attributes.apply({
        [_.color]: colorValues.line,
        [_.fontcolor]: colorValues.label as HexColor,
      })
    }

    return e
  }
}
