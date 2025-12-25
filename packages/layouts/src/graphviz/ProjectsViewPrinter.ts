import type { HexColor } from '@likec4/core'
import type { ComputedProjectEdge, ComputedProjectNode, ComputedProjectsView } from '@likec4/core/compute-view'
import { LikeC4Styles } from '@likec4/core/styles'
import { nonNullable } from '@likec4/core/utils'
import { chunk, map } from 'remeda'
import type { EdgeModel, NodeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { edgelabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'

export class ProjectsViewPrinter extends DotPrinter<ComputedProjectsView> {
  static toDot(view: ComputedProjectsView) {
    return new ProjectsViewPrinter(view).print()
  }

  constructor(view: ComputedProjectsView) {
    super(view, LikeC4Styles.DEFAULT)
  }

  protected override createGraph(): RootGraphModel {
    const G = super.createGraph()
    G.delete(_.TBbalance)
    return G
  }

  protected override postBuild(G: RootGraphModel): void {
    // Below is custom made "tile" layout
    const withoutRelationships = this.view
      .nodes
      .filter(node => node.inEdges.length === 0 && node.outEdges.length === 0)
      .map(node => nonNullable(this.getGraphNode(node.id), `Node not found for ${node.id}`))

    let chunkSize = 2
    switch (true) {
      case withoutRelationships.length > 15:
        chunkSize = 4
        break
      case withoutRelationships.length > 5:
        chunkSize = 3
        break
      case withoutRelationships.length > 3:
        chunkSize = 2
        break
      default:
        return
    }

    const container = G.createSubgraph('cluster_without_relationships')

    let prevRow: [NodeModel, ...NodeModel[]] | null = null
    for (const row of chunk(withoutRelationships, chunkSize)) {
      const ranked = row.length > 1
        ? container.createSubgraph({ [_.rank]: 'same' })
        : container
      prevRow = map(row, (nd, i) => {
        ranked.node(nd.id)
        // Make invisible edges between same column nodes (link heads)
        const prevRowSameColumn = prevRow?.at(i)
        if (prevRowSameColumn) {
          container.edge([prevRowSameColumn, nd], {
            [_.style]: 'invis',
          })
        }
        return nd
      })
    }
  }

  protected override elementToNode(element: ComputedProjectNode, node: NodeModel) {
    node.attributes.apply({
      [_.likec4_id]: element.id,
      [_.likec4_project]: element.projectId,
    })
    return super.elementToNode(element, node)
  }

  protected override addEdge(edge: ComputedProjectEdge, G: RootGraphModel): EdgeModel | null {
    const source = nonNullable(this.getGraphNode(edge.source), `Node not found for ${edge.source}`)
    const target = nonNullable(this.getGraphNode(edge.target), `Node not found for ${edge.target}`)

    const edgeAttrs = this.graphology.getEdgeAttributes(edge.id)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.likec4_project]: edge.projectId,
      [_.style]: edge.line ?? DefaultEdgeStyle,
    })

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
