import { type ComputedDeploymentView, type ComputedEdge, DefaultArrowType, nonNullable } from '@likec4/core'
import { first, forEachObj, groupBy, isNonNullish, isString, last, map, pipe } from 'remeda'
import type { EdgeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { edgelabel } from './dot-labels'
import { DefaultEdgeStyle } from './DotPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { toArrowType } from './utils'

// TODO: For now we use ElementViewPrinter for DeploymentView
export class DeploymentViewPrinter extends ElementViewPrinter<ComputedDeploymentView> {
  protected override postBuild(G: RootGraphModel): void {
    pipe(
      this.view.nodes,
      map(nd => ({
        node: nd,
        graphvizNode: this.getGraphNode(nd.id)
      })),
      groupBy(({ node, graphvizNode }) => {
        if (graphvizNode === null) {
          return undefined
        }
        if (node.modelRef === 1) {
          return node.id
        }
        if (isString(node.modelRef)) {
          return node.modelRef
        }
        return undefined
      }),
      forEachObj((nodes) => {
        if (nodes.length > 1) {
          G.set(_.newrank, true)
          const subgraph = G.createSubgraph({ [_.rank]: 'same' })
          nodes.forEach(({ graphvizNode }) => {
            subgraph.node(nonNullable(graphvizNode).id)
          })
        }
      })
    )
  }

  override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
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

    const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail)

    // if (!hasCompoundEndpoint) {
    //   const connected = new Set([
    //     ...sourceNode.inEdges,
    //     ...sourceNode.outEdges,
    //     ...targetNode.inEdges,
    //     ...targetNode.outEdges
    //   ].filter(e => !this.edgesWithCompounds.has(e)))
    //   e.attributes.set(_.weight, connected.size)
    // }

    const label = edgelabel(edge)
    if (label) {
      if (hasCompoundEndpoint) {
        e.attributes.set(_.xlabel, label)
      } else {
        e.attributes.set(_.label, label)
      }
    }
    if (edge.color) {
      const colorValues = this.getRelationshipColorValues(edge.color)
      e.attributes.apply({
        [_.color]: colorValues.lineColor,
        [_.fontcolor]: colorValues.labelColor
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
          [_.dir]: 'both',
          [_.minlen]: 0
        })
      }
      return e
    }

    if (head === 'none' && tail === 'none') {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.minlen]: 0,
        [_.constraint]: false
      })
      return e
    }

    if (head !== 'none' && tail !== 'none') {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both',
        [_.minlen]: 0
      })
      return e
    }

    if (head !== DefaultArrowType) {
      e.attributes.set(_.arrowhead, toArrowType(head))
    }
    if (tail !== 'none') {
      e.attributes.set(_.arrowtail, toArrowType(tail))
    }

    return e
  }
}
