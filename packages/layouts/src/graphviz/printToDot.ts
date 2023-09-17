/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Colors, RelationColors } from '@likec4/core/colors'
import { DefaultThemeColor } from '@likec4/core/types'
import type { ComputedEdge, ComputedNode, ComputedView, Fqn } from '@likec4/core/types'
import { isTruthy } from 'remeda'
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
import type { DotSource } from './types'
import { pxToInch, pxToPoints } from './graphviz-utils'

// Declare custom attributes.
declare module 'ts-graphviz' {
  export namespace ClusterSubgraphAttributeKey {
    export interface $values extends $keywords<'likec4_id' | 'likec4_level' | 'likec4_depth'> {}
  }

  export namespace NodeAttributeKey {
    export interface $values extends $keywords<'likec4_id' | 'likec4_level'> {}
  }

  export namespace EdgeAttributeKey {
    export interface $values extends $keywords<'likec4_id'> {}
  }

  export namespace Attribute {
    export interface $keys extends $keywords<'likec4_id' | 'likec4_level' | 'likec4_depth'> {}

    export interface $types {
      likec4_id: string
      likec4_level: number
      likec4_depth: number
    }
  }
}

export function printToDot({ autoLayout, nodes, edges }: ComputedView): DotSource {
  const G = digraph({
    [_.compound]: true,
    [_.pad]: pxToInch(20),
    [_.rankdir]: autoLayout,
    [_.layout]: 'dot',
    [_.outputorder]: 'nodesfirst'
  })
  G.apply({
    [_.nodesep]: pxToInch(90),
    //@ts-expect-error - ts-graphviz does not support ranksep equally
    [_.ranksep]: `${pxToInch(90)} equally`
  })
  G.attributes.graph.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(12)
  })

  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(19),
    [_.labelloc]: 'c',
    [_.shape]: 'rect',
    [_.width]: pxToInch(320),
    [_.height]: pxToInch(180),
    [_.style]: 'filled,rounded',
    [_.fillcolor]: Colors[DefaultThemeColor].fill,
    [_.margin]: pxToInch(20),
    [_.penwidth]: 0
  })

  G.attributes.edge.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(14),
    [_.style]: 'solid',
    [_.penwidth]: 2,
    [_.arrowsize]: 0.75,
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
        [_.label]: nodeLabel(node)
      })
      if (node.color !== DefaultThemeColor) {
        gNode.attributes.apply({
          [_.fillcolor]: Colors[node.color].fill
        })
      }
      switch (node.shape) {
        case 'cylinder':
        case 'storage': {
          gNode.attributes.apply({
            [_.color]: Colors[node.color].stroke,
            [_.penwidth]: 2,
            [_.shape]: 'cylinder'
          })
          break
        }
        default:
          break
      }
      gvNodes.set(node.id, gNode)
      return 0
    }

    const subgraph = parent.createSubgraph('cluster_' + sequence++, {
      [_.likec4_id]: node.id,
      [_.likec4_level]: level
    })
    subgraph.attributes.graph.apply({
      [_.style]: 'rounded',
      [_.margin]: pxToPoints(40)
    })

    const label = sanitize(node.title.toUpperCase())
    if (isTruthy(label)) {
      subgraph.attributes.graph.apply({
        [_.fontname]: 'Helvetica',
        [_.fontsize]: pxToPoints(13),
        [_.labeljust]: 'l',
        [_.label]: `<<B>${label}</B>>`
      })
    }

    gvSubgraphs.set(node.id, subgraph)

    let depth = 1
    for (const child of nodes.filter(n => n.parent === node.id)) {
      depth = Math.max(traverseNodes(child, subgraph, level + 1) + 1, depth)
    }
    subgraph.set(_.likec4_depth, depth)

    // TODO: calculate color here
    return depth
  }

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const source = gvNodes.get(edge.source)
    const target = gvNodes.get(edge.target)
    // TODO: Edge with cluster?
    // if (!source) {
    //   const firstleaf = leafs.find(n => isAncestor(edge.source, n.id))
    //   source = firstleaf && gvNodes.get(firstleaf.id)
    // }
    // if (!target) {
    //   const firstleaf = leafs.find(n => isAncestor(edge.target, n.id))
    //   target = firstleaf && gvNodes.get(firstleaf.id)
    // }
    if (source && target) {
      const e = parent.edge([source, target], {
        [_.likec4_id]: edge.id
      })
      if (isTruthy(edge.label)) {
        e.attributes.apply({
          [_.label]: edgeLabel(edge.label)
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
