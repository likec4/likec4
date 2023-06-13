/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Colors, RelationColors, compareFqnHierarchically } from '@likec4/core'
import type { ComputedNode, ComputedView, Fqn } from '@likec4/core/types'
import { groupBy, sortObject, values } from 'rambdax'
import {
  attribute as _,
  digraph,
  toDot,
  type GraphBaseModel,
  type NodeModel,
  type SubgraphModel
} from 'ts-graphviz'
import type { DotSource } from './graphviz-types'
import { generateEdgeLabel, generateNodeLabel, pxToInch, pxToPoints } from './graphviz-utils'

export function printToDot({ autoLayout, nodes, edges }: ComputedView): DotSource {
  const gvSubgraphs = new Map<Fqn, SubgraphModel>()
  const gvNodes = new Map<Fqn, NodeModel>()

  let sequence = 1

  const processNode = (node: ComputedNode, parent: GraphBaseModel) => {
    if (node.children.length > 0) {
      const subgraph = parent.createSubgraph('cluster_' + sequence++, {
        [_.id]: node.id,
        [_.labeljust]: 'l',
        [_.fontsize]: pxToPoints(12),
        [_.label]: `<<B>${node.title.toUpperCase()}</B>>`,
        [_.margin]: node.children.length > 2 ? 30 : 20
      })
      gvSubgraphs.set(node.id, subgraph)

      for (const child of nodes.filter(n => n.parent === node.id)) {
        processNode(child, subgraph)
      }
    } else {
      const gNode = parent.createNode('nd' + sequence++, {
        [_.id]: node.id,
        [_.label]: generateNodeLabel(node)
      })
      if (node.color !== 'primary') {
        gNode.attributes.set(_.color, Colors[node.color].stroke)
        gNode.attributes.set(_.fillcolor, Colors[node.color].fill)
      }
      switch (node.shape) {
        case 'cylinder':
        case 'storage': {
          gNode.attributes.set(_.shape, 'cylinder')
          break
        }
        default:
          break
      }
      gvNodes.set(node.id, gNode)
    }
  }

  const G = digraph({
    [_.compound]: true,
    [_.pad]: 0.08,
    [_.rankdir]: autoLayout,
    [_.nodesep]: pxToInch(100),
    [_.ranksep]: pxToInch(100),
    [_.layout]: 'dot',
    [_.TBbalance]: 'min',
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(16)
  })

  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.labelloc]: 'c',
    [_.shape]: 'rect',
    [_.width]: pxToInch(320),
    [_.height]: pxToInch(180),
    [_.style]: 'filled,rounded',
    [_.color]: Colors.primary.stroke,
    [_.fillcolor]: Colors.primary.fill,
    [_.margin]: `${pxToInch(32)},${pxToInch(20)}`
  })

  G.attributes.edge.apply({
    [_.fontname]: 'Helvetica',
    [_.style]: 'solid',
    [_.penwidth]: 2,
    [_.arrowsize]: 0.7,
    [_.color]: RelationColors.lineColor,
    [_.fontcolor]: RelationColors.labelColor,
    [_.nojustify]: true
  })

  for (const root of nodes.filter(n => n.parent === null)) {
    processNode(root, G)
  }

  const sortedEdges = values(
    sortObject(
      (parentA, parentB) => compareFqnHierarchically(parentA, parentB),
      groupBy(
        e => e.parent ?? '',
        edges
      )
    )
  )

  for (const edgesPerContainer of sortedEdges) {
    for (const edge of edgesPerContainer) {
      // const container = (edge.parent && gvSubgraphs.get(edge.parent)) ?? G
      const source = gvNodes.get(edge.source)
      const target = gvNodes.get(edge.target)
      if (source && target) {
        const e = G.edge([source, target], {
          [_.id]: edge.id
        })
        const label = generateEdgeLabel(edge)
        if (label) {
          e.attributes.set(_.label, label)
        }
        // this is the only edge in the container
        // and the container has no subgraphs
        // so we can remove the constraint
        if (edgesPerContainer.length === 1) {
          const sourceNd = nodes.find(n => n.id === edge.source)
          const targetNd = nodes.find(n => n.id === edge.target)
          if (sourceNd && targetNd && sourceNd.parent === targetNd.parent) {
            e.attributes.set(_.minlen, 0)
          }
        }
      }
    }
  }

  return toDot(G) as DotSource
}
