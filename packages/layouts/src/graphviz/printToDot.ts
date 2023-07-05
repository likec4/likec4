/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Colors,
  RelationColors
} from '@likec4/core'
import type { ComputedEdge, ComputedNode, ComputedView, Fqn } from '@likec4/core/types'
import { isTruthy } from 'remeda'
import invariant from 'tiny-invariant'
import {
  attribute as _,
  digraph,
  toDot,
  type GraphBaseModel,
  type NodeModel,
  type SubgraphModel
} from 'ts-graphviz'
import { edgeLabel, nodeLabel, sanitize } from './dot-labels'
import type { DotSource } from './graphviz-types'
import { pxToInch, pxToPoints } from './graphviz-utils'

function isLeaf(value: ComputedNode) {
  return value.children.length === 0
}
function isRootCluster(value: ComputedNode) {
  return value.parent === null && value.children.length > 0
}

export function printToDot({ autoLayout, nodes, edges }: ComputedView): DotSource {

  const G = digraph({
    [_.compound]: true,
    [_.pad]: 0.08,
    [_.rankdir]: autoLayout,
    [_.nodesep]: pxToInch(100),
    [_.ranksep]: pxToInch(100),
    [_.layout]: 'dot',
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(16),
  })

  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.labelloc]: 'c',
    [_.shape]: 'rect',
    [_.width]: pxToInch(320),
    [_.height]: pxToInch(180),
    [_.style]: 'filled,rounded',
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

  const gvSubgraphs = new Map<Fqn, SubgraphModel>()
  const gvNodes = new Map<Fqn, NodeModel>()

  let sequence = 1

  const traverseNodes = (node: ComputedNode, parent: GraphBaseModel) => {
    if (node.children.length === 0) {
      const gNode = gvNodes.get(node.id)
      invariant(gNode, 'Node not found')
      parent.node(gNode.id)
      return
    }

    const subgraph = parent.createSubgraph('cluster_' + sequence++, {
      [_.id]: node.id,
      [_.labeljust]: 'l',
      [_.fontsize]: pxToPoints(12),
      [_.margin]: node.children.length > 2 ? 30 : 20
    })
    const label = sanitize(node.title.toUpperCase())
    if (isTruthy(label)) {
      subgraph.set(_.label, `<<B>${label}</B>>`)
    }
    gvSubgraphs.set(node.id, subgraph)

    for (const child of nodes.filter(n => n.parent === node.id)) {
      traverseNodes(child, subgraph)
    }
  }

  nodes.filter(isLeaf).forEach((node) => {
    const gNode = G.createNode('nd' + sequence++, {
      [_.id]: node.id,
      [_.label]: nodeLabel(node)
    })
    if (node.color !== 'primary') {
      gNode.attributes.set(_.fillcolor, Colors[node.color].fill)
    }
    switch (node.shape) {
      case 'cylinder':
      case 'storage': {
        gNode.attributes.set(_.color, Colors[node.color].stroke)
        gNode.attributes.set(_.shape, 'cylinder')
        break
      }
      default:
        break
    }
    gvNodes.set(node.id, gNode)
  })

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const source = gvNodes.get(edge.source)
    // if (!source) {
    //   const firstleaf = leafs.find(n => isAncestor(edge.source, n.id))
    //   source = firstleaf && gvNodes.get(firstleaf.id)
    // }
    const target = gvNodes.get(edge.target)
    // if (!target) {
    //   const firstleaf = leafs.find(n => isAncestor(edge.target, n.id))
    //   target = firstleaf && gvNodes.get(firstleaf.id)
    // }
    if (source && target) {
      const e = parent.edge([source, target], {
        [_.id]: edge.id
      })
      const { label } = edge
      if (isTruthy(label)) {
        e.attributes.set(_.label, edgeLabel(label))
      }
    }
  }

  for (const cluster of nodes.filter(isRootCluster)) {
    traverseNodes(cluster, G)
  }

  for (const edge of edges) {
    const parent = (edge.parent && gvSubgraphs.get(edge.parent)) ?? G
    addEdge(edge, parent)
  }

  return toDot(G) as DotSource
}
