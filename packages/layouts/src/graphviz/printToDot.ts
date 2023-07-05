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
  type NodeModel
} from 'ts-graphviz'
import { edgeLabel, nodeLabel } from './dot-labels'
import type { DotSource } from './graphviz-types'
import { pxToInch, pxToPoints } from './graphviz-utils'

function isLeaf(value: ComputedNode) {
  return value.children.length === 0
}
function isRootCluster(value: ComputedNode) {
  return value.parent === null && value.children.length > 0
}

export function printToDot({ autoLayout, nodes, edges }: ComputedView): DotSource {

  const gvNodes = new Map<Fqn, NodeModel>()

  let sequence = 1

  const processCluster = (node: ComputedNode, parent: GraphBaseModel) => {
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
      [_.label]: `<<B>${node.title.toUpperCase()}</B>>`,
      [_.margin]: node.children.length > 2 ? 30 : 20
    })

    for (const child of nodes.filter(n => n.parent === node.id)) {
      processCluster(child, subgraph)
    }

    for (const edge of edges.filter(e => e.parent === node.id)) {
      addEdge(edge, subgraph)
    }
  }

  const G = digraph({
    [_.compound]: true,
    [_.pad]: 0.08,
    [_.rankdir]: autoLayout,
    [_.nodesep]: pxToInch(100),
    [_.ranksep]: pxToInch(100),
    [_.layout]: 'dot',
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(16),
    [_.packmode]: 'array'
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

  const leafs = nodes.filter(isLeaf)

  leafs.forEach((node, i) => {
    const gNode = G.createNode('nd' + sequence++, {
      [_.id]: node.id,
      [_.label]: nodeLabel(node),
      [_.sortv]: i,
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

  for (const rootEdge of edges.filter(e => e.parent === null)) {
    addEdge(rootEdge, G)
  }

  for (const cluster of nodes.filter(isRootCluster)) {
    processCluster(cluster, G)
  }

  return toDot(G) as DotSource
}
