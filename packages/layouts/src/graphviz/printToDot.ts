/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Colors, RelationColors } from '@likec4/core/colors'
import { DefaultThemeColor } from '@likec4/core/types'
import type { ComputedEdge, ComputedNode, ComputedView, Fqn } from '@likec4/core/types'
import { countBy, isTruthy } from 'remeda'
import {
  attribute as _,
  digraph,
  toDot,
  type $keywords,
  type GraphBaseModel,
  type NodeModel,
  type SubgraphModel,
  type RootGraphModel
} from 'ts-graphviz'
import { edgeLabel, nodeLabel, sanitize } from './dot-labels'
import type { DotSource } from './types'
import { pxToInch, pxToPoints } from './graphviz-utils'
import { nameFromFqn } from '@likec4/core'

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

export function toGraphvisModel({ autoLayout, nodes, edges }: ComputedView): RootGraphModel {
  const G = digraph({
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.pad]: pxToInch(20),
    [_.rankdir]: autoLayout,
    [_.outputorder]: 'nodesfirst',
    [_.nodesep]: pxToInch(90)
    // [_.pack]: pxToPoints(30),
    // [_.packmode]: packmode({autoLayout, nodes}),
  })
  G.apply({
    //@ts-expect-error - ts-graphviz does not support ranksep equally
    [_.ranksep]: `${pxToInch(90)} equally`
  })
  G.attributes.graph.apply({
    [_.fontname]: 'Helvetica',
    [_.labeljust]: 'l',
    [_.fontsize]: pxToPoints(12)
  })

  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: pxToPoints(19),
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

  const subgraphs = new Map<Fqn, SubgraphModel>()
  const graphvizNodes = new Map<Fqn, NodeModel>()

  let sequence = 1

  /**
   * returns recursion depth
   */
  const traverseNodes = (elementNode: ComputedNode, parent: GraphBaseModel, level = 0): number => {
    if (elementNode.children.length === 0) {
      let name = nameFromFqn(elementNode.id).toLowerCase()
      if (name.startsWith('cluster')) {
        name = 'nd_' + name
      }
      let id = name
      let uniqueNumber = 1
      while (G.getNode(id)) {
        id = name + '_' + uniqueNumber++
      }

      const node = G.createNode(id, {
        [_.likec4_id]: elementNode.id,
        [_.likec4_level]: level,
        [_.label]: nodeLabel(elementNode)
      })
      if (elementNode.color !== DefaultThemeColor) {
        node.attributes.apply({
          [_.fillcolor]: Colors[elementNode.color].fill
        })
      }
      switch (elementNode.shape) {
        case 'cylinder':
        case 'storage': {
          node.attributes.apply({
            [_.color]: Colors[elementNode.color].stroke,
            [_.penwidth]: 2,
            [_.shape]: 'cylinder'
          })
          break
        }
        default:
          break
      }
      if (parent !== G) {
        parent.node(id)
      }
      graphvizNodes.set(elementNode.id, node)
      return 0
    }

    const subgraph = parent.createSubgraph('cluster_' + sequence++, {
      [_.likec4_id]: elementNode.id,
      [_.likec4_level]: level,
      [_.style]: 'rounded',
      [_.margin]: pxToPoints(40)
    })

    const label = sanitize(elementNode.title.toUpperCase())
    if (isTruthy(label)) {
      subgraph.apply({
        [_.fontsize]: pxToPoints(13),
        [_.label]: `<<B>${label}</B>>`
      })
    }

    subgraphs.set(elementNode.id, subgraph)

    let depth = 1
    for (const child of nodes.filter(n => n.parent === elementNode.id)) {
      depth = Math.max(traverseNodes(child, subgraph, level + 1) + 1, depth)
    }
    subgraph.set(_.likec4_depth, depth)

    // TODO: calculate color here
    return depth
  }

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const source = graphvizNodes.get(edge.source)
    const target = graphvizNodes.get(edge.target)
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
    const parent = (edge.parent && subgraphs.get(edge.parent)) ?? G
    addEdge(edge, parent)
  }

  return G
}

export function printToDot(view: ComputedView): DotSource {
  return toDot(toGraphvisModel(view)) as DotSource
}
