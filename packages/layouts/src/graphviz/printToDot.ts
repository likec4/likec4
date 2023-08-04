/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Colors, RelationColors } from '@likec4/core'
import type { ComputedEdge, ComputedNode, ComputedView, EdgeId, Fqn } from '@likec4/core/types'
import { isTruthy } from 'remeda'
import { invariant } from '@likec4/core'
import {
  attribute as _,
  digraph,
  toDot,
  type $keywords,
  type GraphBaseModel,
  type NodeModel,
  type SubgraphModel
} from 'ts-graphviz'
import { edgeLabel, nodeLabel, sanitize } from './dot-labels'
import type { DotSource } from './graphviz-types'
import { pxToInch, pxToPoints } from './graphviz-utils'

// 1. Declare the 'ts-graphviz' module.
declare module 'ts-graphviz' {

  export namespace ClusterSubgraphAttributeKey {
    export interface $values extends $keywords<'likec4_id' | 'likec4_level' | 'likec4_depth'> {}
  }

  export namespace NodeAttributeKey {
    export interface $values extends $keywords<'likec4_id' | 'likec4_level'> {}
  }

  export namespace EdgeAttributeKey {
    export interface $values extends $keywords<'likec4_edge_id'> {}
  }

  export namespace Attribute {
    // 4. Define the $keys interface in the Attribute namespace.
    // 5. Inherit from $keywords<'hoge'> and specify the name of the new attribute in <...>.
    export interface $keys extends $keywords<'likec4_id' | 'likec4_level' | 'likec4_edge_id' | 'likec4_depth'> {}

    // 6. Define the $types interface in the Attribute namespace.
    // 7. Specify the new attribute in the key and define its corresponding value in the value.
    export interface $types {
      likec4_id: Fqn;
      likec4_edge_id: EdgeId;
      likec4_level: number;
      likec4_depth: number;
    }
  }
}

function isLeaf(value: ComputedNode) {
  return value.children.length === 0
}
function isRootCluster(value: ComputedNode) {
  return value.parent === null && value.children.length > 0
}

export function printToDot({ autoLayout, nodes, edges }: ComputedView): DotSource {
  const G = digraph({
    [_.compound]: true,
    [_.pad]: pxToInch(20),
    [_.rankdir]: autoLayout,
    [_.nodesep]: pxToInch(80),
    [_.ranksep]: pxToInch(80),
    [_.layout]: 'dot',
  })

  G.attributes.graph.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(16)
  })

  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(18),
    [_.labelloc]: 'c',
    [_.shape]: 'rect',
    [_.width]: pxToInch(320),
    [_.height]: pxToInch(180),
    [_.style]: 'filled,rounded',
    [_.fillcolor]: Colors.primary.fill,
    [_.margin]: pxToInch(16)
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

  const traverseNodes = (node: ComputedNode, parent: GraphBaseModel, level = 0): number => {
    if (node.children.length === 0) {
      const gNode = parent.createNode('nd' + sequence++, {
        [_.likec4_id]: node.id,
        [_.likec4_level]: level,
        [_.label]: nodeLabel(node),
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
      return 0
    }

    const subgraph = parent.createSubgraph('cluster_' + sequence++)

    subgraph.attributes.graph.apply({
      [_.likec4_id]: node.id,
      [_.likec4_level]: level,
      [_.margin]: node.children.length > 2 ? 32 : 24
    })
    const label = sanitize(node.title.toUpperCase())
    if (isTruthy(label)) {
      subgraph.attributes.graph.apply({
        [_.labeljust]: 'l',
        [_.fontsize]: pxToPoints(12),
        [_.label]: `<<B>${label}</B>>`
      })
    }

    gvSubgraphs.set(node.id, subgraph)

    let depth = 1
    for (const child of nodes.filter(n => n.parent === node.id)) {
      depth = Math.max(traverseNodes(child, subgraph, level + 1) + 1, depth)
    }
    subgraph.attributes.graph.apply({
      [_.likec4_depth]: depth
    })
    return depth
  }

  // nodes.filter(isLeaf).forEach(node => {
  //   const gNode = G.createNode('nd' + sequence++, {
  //     [_.id]: node.id,
  //     [_.label]: nodeLabel(node)
  //   })
  //   if (node.color !== 'primary') {
  //     gNode.attributes.set(_.fillcolor, Colors[node.color].fill)
  //   }
  //   switch (node.shape) {
  //     case 'cylinder':
  //     case 'storage': {
  //       gNode.attributes.set(_.color, Colors[node.color].stroke)
  //       gNode.attributes.set(_.shape, 'cylinder')
  //       break
  //     }
  //     default:
  //       break
  //   }
  //   gvNodes.set(node.id, gNode)
  // })

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
        [_.likec4_edge_id]: edge.id
      })
      const { label } = edge
      if (isTruthy(label)) {
        e.attributes.apply({
          [_.label]: edgeLabel(label)
        })
      }
    }
  }

  for (const node of nodes) {
    if (!node.parent) {
      traverseNodes(node, G)
    }
  }

  for (const edge of edges) {
    const parent = (edge.parent && gvSubgraphs.get(edge.parent)) ?? G
    addEdge(edge, parent)
  }

  return toDot(G) as DotSource
}
