/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  ComputedEdge,
  ComputedNode,
  ComputedView,
  Fqn,
  RelationshipArrowType
} from '@likec4/core'
import {
  DefaultLineStyle,
  DefaultRelationshipColor,
  DefaultThemeColor,
  defaultTheme,
  nameFromFqn,
  nonNullable
} from '@likec4/core'
import { isNil, isTruthy } from 'remeda'
import {
  attribute as _,
  digraph,
  toDot,
  type $keywords,
  type GraphBaseModel,
  type NodeModel,
  type RootGraphModel,
  type SubgraphModel,
  type ArrowType
} from 'ts-graphviz'
import { edgeLabel, nodeLabel, sanitize } from './dot-labels'
import { pxToInch, pxToPoints } from './graphviz-utils'
import type { DotSource } from './types'

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

function isCompound(node: ComputedNode) {
  return node.children.length > 0
}

function toArrowType(type: RelationshipArrowType): ArrowType {
  switch (type) {
    case 'open':
      return 'vee'
    default:
      return type
  }
}

export function toGraphvisModel({ autoLayout, nodes, edges }: ComputedView): RootGraphModel {
  const Theme = defaultTheme
  const G = digraph({
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.pad]: pxToInch(10),
    [_.rankdir]: autoLayout,
    [_.outputorder]: 'nodesfirst',
    [_.nodesep]: pxToInch(80),
    [_.ranksep]: pxToInch(90),
    // [_.newrank]: true,
    [_.pack]: pxToPoints(40),
    [_.packmode]: 'array_t'
  })
  G.attributes.graph.apply({
    [_.fontname]: Theme.font,
    [_.labeljust]: 'l',
    [_.fontsize]: pxToPoints(12)
  })

  G.attributes.node.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(19),
    [_.shape]: 'rect',
    [_.width]: pxToInch(320),
    [_.height]: pxToInch(180),
    [_.style]: 'filled,rounded',
    [_.fillcolor]: Theme.elements[DefaultThemeColor].fill,
    [_.margin]: pxToInch(20),
    [_.penwidth]: 0
  })

  G.attributes.edge.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(13),
    [_.style]: DefaultLineStyle,
    [_.penwidth]: 2,
    [_.arrowsize]: 0.8,
    [_.color]: Theme.relationships[DefaultRelationshipColor].lineColor,
    [_.fontcolor]: Theme.relationships[DefaultRelationshipColor].labelColor
  })

  const subgraphs = new Map<Fqn, SubgraphModel>()
  const graphvizNodes = new Map<Fqn, NodeModel>()

  let sortv = 0
  function addNode(elementNode: ComputedNode) {
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
      [_.likec4_level]: elementNode.level,
      [_.label]: nodeLabel(elementNode),
      [_.sortv]: sortv++
    })
    if (elementNode.color !== DefaultThemeColor) {
      node.attributes.apply({
        [_.fillcolor]: Theme.elements[elementNode.color].fill
      })
    }
    switch (elementNode.shape) {
      case 'queue': {
        node.attributes.apply({
          [_.width]: pxToInch(320),
          [_.height]: pxToInch(160)
        })
        break
      }
      case 'cylinder':
      case 'storage': {
        node.attributes.apply({
          [_.color]: Theme.elements[elementNode.color].stroke,
          [_.penwidth]: 2,
          [_.shape]: 'cylinder'
        })
        break
      }
      default:
        break
    }
    graphvizNodes.set(elementNode.id, node)
    return node
  }

  /**
   * returns recursion depth
   */
  function traverseClusters(elementNode: ComputedNode, parent: GraphBaseModel, level = 0): number {
    if (!isCompound(elementNode)) {
      const node = nonNullable(graphvizNodes.get(elementNode.id), "graphviz node doesn't exist")
      parent.node(node.id)
      return 0
    }
    const name = 'cluster_' + nameFromFqn(elementNode.id).toLowerCase()
    let id = name
    let uniqueNumber = 1
    while (G.getSubgraph(id)) {
      id = name + '_' + uniqueNumber++
    }

    const subgraph = parent.createSubgraph(id, {
      [_.likec4_id]: elementNode.id,
      [_.likec4_level]: level
    })

    subgraph.attributes.graph.apply({
      [_.fontsize]: pxToPoints(13),
      [_.style]: 'rounded',
      [_.margin]: pxToPoints(40)
    })

    const label = sanitize(elementNode.title.toUpperCase())
    if (isTruthy(label)) {
      subgraph.apply({
        [_.label]: `<<B>${label}</B>>`
      })
    }

    subgraphs.set(elementNode.id, subgraph)

    let depth = 0
    for (const child of nodes.filter(n => n.parent === elementNode.id)) {
      depth = Math.max(traverseClusters(child, subgraph, level + 1) + 1, depth)
    }
    subgraph.set(_.likec4_depth, depth)
    // TODO: calculate color here
    return depth
  }

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const source = graphvizNodes.get(edge.source)
    const target = graphvizNodes.get(edge.target)

    if (!source && !target) {
      return
    }
    let lhead, ltail: string | undefined
    // TODO: Edge with cluster?
    // if (!target) {
    //   const targetSubgraph = subgraphs.get(edge.target)
    //   if (!targetSubgraph?.id) {
    //     return
    //   }
    //   lhead = targetSubgraph.id
    //   const firstNode = head(
    //     nodes
    //       .filter(n => !isCompound(n) && isAncestor(edge.target, n.id))
    //       .sort((a, b) => b.inEdges.length - a.inEdges.length)
    //   )
    //   target = firstNode && graphvizNodes.get(firstNode.id)
    // }
    // if (!source) {
    //   const sourceSubgraph = subgraphs.get(edge.source)
    //   if (!sourceSubgraph?.id) {
    //     return
    //   }
    //   ltail = sourceSubgraph.id
    //   const firstNode = head(
    //     nodes
    //       .filter(n => !isCompound(n) && isAncestor(edge.source, n.id))
    //       .sort((a, b) => b.inEdges.length - a.inEdges.length)
    //   )
    //   source = firstNode && graphvizNodes.get(firstNode.id)
    // }

    if (source && target) {
      const e = parent.edge([source, target], {
        [_.likec4_id]: edge.id
        // [_.weight]: 20
      })

      const sourceLevel = source.attributes.get(_.likec4_level) ?? 0
      const targetLevel = target.attributes.get(_.likec4_level) ?? 0
      if (parent !== G) {
        e.attributes.apply({
          [_.weight]: sourceLevel === targetLevel ? 10 : 5
        })
      } else if (sourceLevel > 0 && sourceLevel == targetLevel) {
        // More weight for same level
        e.attributes.apply({
          [_.weight]: 5
        })
      }

      if (lhead) {
        e.attributes.apply({
          [_.lhead]: lhead
          // [_.weight]: 5
        })
      }
      if (ltail) {
        e.attributes.apply({
          [_.ltail]: ltail
          // [_.weight]: 5
        })
      }
      if (isTruthy(edge.label)) {
        const attr = lhead || ltail ? _.xlabel : _.label
        e.attributes.apply({
          [attr]: edgeLabel(edge.label),
          [_.nojustify]: true
        })
      }
      if (edge.color) {
        e.attributes.apply({
          [_.color]: Theme.relationships[edge.color].lineColor,
          [_.fontcolor]: Theme.relationships[edge.color].labelColor
        })
      }
      if (edge.line) {
        e.attributes.apply({
          [_.style]: edge.line
        })
      }
      if (edge.head) {
        e.attributes.apply({
          [_.arrowhead]: toArrowType(edge.head)
        })
      }
      if (edge.tail) {
        e.attributes.apply({
          [_.arrowtail]: toArrowType(edge.tail),
          [_.dir]: 'both'
        })
      }

      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      if (
        sourceNode &&
        targetNode &&
        sourceNode.parent === targetNode.parent &&
        sourceNode.parent === edge.parent
      ) {
        const parentNode = sourceNode.parent && nodes.find(n => n.id === sourceNode.parent)
        // parent has source and target as children
        const isTheOnlyChildren = parentNode?.children.length === 2

        const sourceHasOtherEdges = sourceNode.inEdges.length > 0 || sourceNode.outEdges.length > 1
        const targetHasOtherEdges = targetNode.outEdges.length > 0 || targetNode.inEdges.length > 1
        // source and target have no other edges
        const haveNoOtherEdges = !sourceHasOtherEdges && !targetHasOtherEdges

        if (isTheOnlyChildren || (isNil(parentNode) && haveNoOtherEdges)) {
          // don't rank the edge
          e.attributes.apply({
            [_.minlen]: 0
          })
        }
      }
    }
  }

  const clusters = [] as ComputedNode[]
  for (const node of nodes) {
    if (isCompound(node)) {
      if (!node.parent) {
        clusters.push(node)
      }
      continue
    }
    addNode(node)
  }
  let cluster
  while ((cluster = clusters.shift())) {
    traverseClusters(cluster, G)
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
