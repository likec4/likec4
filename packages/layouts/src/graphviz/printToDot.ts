/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  ComputedEdge,
  ComputedNode,
  ComputedView,
  EdgeId,
  Fqn,
  RelationshipArrowType
} from '@likec4/core'
import {
  DefaultLineStyle,
  DefaultRelationshipColor,
  DefaultThemeColor,
  defaultTheme,
  invariant,
  nameFromFqn,
  parentFqn,
  nonNullable,
  compareFqnHierarchically,
  compareByFqnHierarchically,
  isAncestor,
  isSameHierarchy
} from '@likec4/core'
import {
  filter,
  first,
  flatMap,
  groupBy,
  identity,
  isNil,
  isNumber,
  isTruthy,
  keys,
  last,
  length,
  map,
  omitBy,
  pipe,
  reverse,
  sort,
  uniq
} from 'remeda'
import {
  attribute as _,
  digraph,
  toDot,
  type $keywords,
  type ArrowType,
  type GraphBaseModel,
  type NodeModel,
  type RootGraphModel,
  type SubgraphModel
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

export function toGraphvisModel({
  autoLayout,
  nodes: viewNodes,
  edges: viewEdges
}: ComputedView): RootGraphModel {
  const Theme = defaultTheme
  const G = digraph({
    [_.bgcolor]: 'transparent',
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.TBbalance]: 'min',
    [_.rankdir]: autoLayout,
    [_.splines]: 'spline',
    // [_.outputorder]: 'nodesfirst',
    [_.nodesep]: pxToInch(100),
    [_.ranksep]: pxToInch(90),
    [_.size]: `${pxToInch(300)},${pxToInch(200)}!`,
    // [_.ratio]: 'fill',
    // [_.concentrate]: false,
    // [_.mclimit]: 3,
    // [_.nslimit]: 10,
    // [_.nslimit1]: 10,
    // [_.searchsize]: Math.max(50, viewNodes.length + viewEdges.length),
    // [_.nslimit1]: 10,
    // [_.newrank]: true,
    [_.pack]: pxToPoints(120),
    [_.packmode]: 'array_3'
  })

  G.attributes.graph.apply({
    [_.margin]: pxToPoints(40),
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(13),
    [_.labeljust]: autoLayout === 'RL' ? 'r' : 'l',
    [_.labelloc]: autoLayout === 'BT' ? 'b' : 't',
    [_.style]: 'filled,rounded'
  })

  G.attributes.node.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(18),
    [_.fontcolor]: Theme.elements[DefaultThemeColor].hiContrast,
    [_.shape]: 'rect',
    [_.width]: pxToInch(320),
    [_.height]: pxToInch(180),
    [_.fixedsize]: false,
    [_.style]: 'filled,rounded',
    [_.fillcolor]: Theme.elements[DefaultThemeColor].fill,
    [_.color]: Theme.elements[DefaultThemeColor].stroke,
    [_.penwidth]: 0,
    [_.nojustify]: true
    // [_.margin]: pxToInch(26)
    // [_.ordering]: 'out'
  })

  G.attributes.edge.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(13),
    [_.style]: DefaultLineStyle,
    [_.weight]: 1,
    [_.penwidth]: pxToPoints(1),
    [_.arrowsize]: 0.85,
    [_.nojustify]: true,
    [_.color]: Theme.relationships[DefaultRelationshipColor].lineColor,
    [_.fontcolor]: Theme.relationships[DefaultRelationshipColor].labelColor
  })

  const ids = new Set<string>()
  const subgraphs = new Map<Fqn, SubgraphModel>()
  const graphvizNodes = new Map<Fqn, NodeModel>()

  function checkNodeId(name: string, isCompound = false) {
    if (isCompound) {
      name = 'cluster_' + name
    } else if (name.startsWith('cluster')) {
      name = 'nd_' + name
    }
    if (!ids.has(name)) {
      ids.add(name)
      return name
    }
    return null
  }

  function nodeId(node: ComputedNode) {
    const _compound = isCompound(node)
    let elementName = nameFromFqn(node.id).toLowerCase()
    let name = checkNodeId(elementName, _compound)
    if (name !== null) {
      return name
    }
    // try to use parent name
    let fqn = node.id
    let parentId
    while ((parentId = parentFqn(fqn))) {
      elementName = nameFromFqn(parentId).toLowerCase() + '_' + elementName
      name = checkNodeId(elementName, _compound)
      if (name !== null) {
        return name
      }
      fqn = parentId
    }
    // use post-index
    elementName = nameFromFqn(node.id).toLowerCase()
    let i = 1
    do {
      name = checkNodeId(elementName + '_' + i++, _compound)
    } while (name === null)
    return name
  }

  function addNode(elementNode: ComputedNode) {
    invariant(!isCompound(elementNode), 'compound node should be added by traverseClusters')
    const id = nodeId(elementNode)
    const parentGraph = elementNode.parent ? subgraphs.get(elementNode.parent) : G
    invariant(parentGraph, 'parentGraph should be defined')
    const node = parentGraph.node(id, {
      [_.likec4_id]: elementNode.id,
      [_.likec4_level]: elementNode.level,
      [_.margin]: pxToInch(26)
    })
    if (elementNode.color !== DefaultThemeColor) {
      node.attributes.apply({
        [_.fillcolor]: Theme.elements[elementNode.color].fill
      })
    }
    if (elementNode.icon) {
      node.attributes.apply({
        [_.imagescale]: true
      })
    }
    switch (elementNode.shape) {
      case 'browser': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(26)},${pxToInch(30)}`
        })
        break
      }
      case 'queue': {
        node.attributes.apply({
          [_.width]: pxToInch(320),
          [_.height]: pxToInch(160),
          [_.margin]: `${pxToInch(30)},${pxToInch(26)}`
        })
        break
      }
      case 'cylinder':
      case 'storage': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(26)},${pxToInch(30)}`,
          [_.color]: Theme.elements[elementNode.color].stroke,
          [_.penwidth]: pxToPoints(2),
          [_.shape]: 'cylinder'
        })
        break
      }
      default:
        break
    }
    // add label to the end
    node.attributes.set(_.label, nodeLabel(elementNode))
    graphvizNodes.set(elementNode.id, node)
    return node
  }

  let maxDepth = 0
  /**
   * returns recursion depth
   */
  function traverseClusters(elementNode: ComputedNode, parent: GraphBaseModel) {
    invariant(isCompound(elementNode), 'node should be compound')
    invariant(isNumber(elementNode.depth), 'node.depth should be defined')
    const id = nodeId(elementNode)
    const subgraph = parent.subgraph(id, {
      [_.likec4_id]: elementNode.id,
      [_.likec4_level]: elementNode.level,
      [_.likec4_depth]: elementNode.depth,
      [_.margin]: elementNode.children.length > 2 ? pxToPoints(40) : pxToPoints(32)
    })
    const label = sanitize(elementNode.title.toUpperCase())
    if (isTruthy(label)) {
      subgraph.apply({
        [_.label]: `<<B>${label}</B>>`
      })
    }
    subgraphs.set(elementNode.id, subgraph)
    maxDepth = Math.max(maxDepth, elementNode.depth)
    // Traverse nested clusters
    for (const child of viewNodes.filter(n => isCompound(n) && n.parent === elementNode.id)) {
      traverseClusters(child, subgraph)
    }
  }

  function leafElements(parentId: Fqn | null): ComputedNode[] {
    if (parentId === null) {
      return viewNodes.filter(n => !isCompound(n))
    }
    const prefix = parentId + '.'
    return viewNodes.filter(
      n => !isCompound(n) && (n.parent === parentId || n.parent?.startsWith(prefix))
    )
  }

  function getEdge(_edge: ComputedEdge | EdgeId) {
    return typeof _edge === 'string' ? nonNullable(viewEdges.find(e => e.id === _edge)) : _edge
  }

  /**
   * At the moment, we don't show edges between clusters.
   * But they are still used to calculate the rank of nodes.
   */
  function isEdgeVisible(_edge: ComputedEdge | EdgeId) {
    const edge = getEdge(_edge)
    const hasCompoundEndpoint = viewNodes.some(
      n => (n.id === edge.source || n.id === edge.target) && isCompound(n)
    )
    return !hasCompoundEndpoint
  }

  function findNestedEdges(parentId: Fqn | null): ComputedEdge[] {
    if (parentId === null) {
      return viewEdges.filter(isEdgeVisible)
    }
    const prefix = parentId + '.'
    return viewEdges.filter(
      e => e.parent && (e.parent === parentId || e.parent.startsWith(prefix)) && isEdgeVisible(e)
    )
  }

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const sourceNode = viewNodes.find(n => n.id === edge.source)
    const targetNode = viewNodes.find(n => n.id === edge.target)
    if (!sourceNode || !targetNode) {
      return
    }
    let source = graphvizNodes.get(edge.source)
    let target = graphvizNodes.get(edge.target)

    let lhead, ltail: string | undefined

    if (!source) {
      // Edge with cluster as source
      ltail = subgraphs.get(edge.source)?.id
      const sourceElement = last(leafElements(edge.source))
      source = !!ltail && !!sourceElement ? graphvizNodes.get(sourceElement.id) : undefined
    }
    if (!target) {
      // Edge with cluster as target
      lhead = subgraphs.get(edge.target)?.id
      const targetElement = first(leafElements(edge.target))
      target = !!lhead && !!targetElement ? graphvizNodes.get(targetElement.id) : undefined
    }

    if (!source || !target) {
      return
    }

    if (lhead || ltail) {
      const sourceId = source.attributes.get(_.likec4_id)
      const targetId = target.attributes.get(_.likec4_id)
      if (viewEdges.some(e => e.source === sourceId && e.target === targetId)) {
        return
      }
    }

    const e = parent.edge([source, target], {
      [_.likec4_id]: edge.id
    })

    // Hide edges between clusters
    if (lhead || ltail) {
      lhead && e.attributes.set(_.lhead, lhead)
      ltail && e.attributes.set(_.ltail, ltail)
      e.attributes.apply({
        [_.weight]: 0,
        [_.minlen]: 1,
        [_.style]: 'invis'
      })
      e.attributes.delete(_.likec4_id)
      return
    }

    const label = edge.label?.trim() ?? ''
    if (isTruthy(label)) {
      e.attributes.apply({
        [_.label]: edgeLabel(label)
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
        [_.arrowtail]: toArrowType(edge.tail)
      })
      if (edge.head === 'none') {
        e.attributes.set(_.dir, 'back')
      } else {
        e.attributes.apply({
          [_.dir]: 'both',
          [_.minlen]: 0
        })
      }
    }
    if (edge.head === 'none' && (isNil(edge.tail) || edge.tail === 'none')) {
      e.attributes.delete(_.arrowhead)
      e.attributes.delete(_.arrowtail)
      e.attributes.apply({
        [_.dir]: 'none',
        [_.weight]: 0,
        [_.minlen]: 0
        // [_.constraint]: false
      })
      return
    }

    const parentId = edge.parent

    let otherEdges
    if (parentId === null && sourceNode.parent == null && targetNode.parent == null) {
      otherEdges = viewEdges.filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges inside clusters
        if (e.parent !== null) {
          return false
        }
        const edgeSource = viewNodes.find(n => n.id === e.source)
        const edgeTarget = viewNodes.find(n => n.id === e.target)
        // hide edges with compound endpoints
        if (!edgeSource || !edgeTarget || isCompound(edgeSource) || isCompound(edgeTarget)) {
          return false
        }
        // only edges between top-level nodes
        return edgeSource.parent == null && edgeTarget.parent == null
      })
    } else {
      otherEdges = findNestedEdges(parentId).filter(e => e.id !== edge.id)
    }
    const isTheOnlyEdge = otherEdges.length === 0

    function filterNeighboursEdges(_edgeId: EdgeId) {
      if (_edgeId === edge.id) {
        return false
      }
      const _edge = getEdge(_edgeId)
      if (!isEdgeVisible(_edge)) {
        return false
      }
      return true
      // if (_edge.parent === parentId) {
      //   return true
      // }
      // if (parentId === null || _edge.parent === null) {
      //   return false
      // }
      // return isSameHierarchy(parentId, _edge.parent)
    }

    let weight = [...sourceNode.outEdges, ...targetNode.inEdges].filter(
      filterNeighboursEdges
    ).length
    const weightMinus = [...sourceNode.inEdges, ...targetNode.outEdges].filter(
      filterNeighboursEdges
    ).length

    weight = Math.max(weight - weightMinus, 1)

    if (isTheOnlyEdge) {
      if (parentId === null || leafElements(parentId).length <= 3) {
        // don't rank the edge
        e.attributes.set(_.minlen, 0)
      }
      weight += 1
    }

    if (parentId !== null) {
      const parentNode = viewNodes.find(n => n.id === parentId)
      invariant(parentNode, 'parentNode should be defined')
      weight += parentNode.level + 1
    }

    if (weight > 0) {
      e.attributes.set(_.weight, weight)
    }
  }

  // ----------------------------------------------
  // Traverse clusters first

  const leafNodes = [] as ComputedNode[]
  for (const node of viewNodes) {
    if (isCompound(node)) {
      if (isNil(node.parent)) {
        traverseClusters(node, G)
      }
    } else {
      leafNodes.push(node)
    }
  }
  for (const node of leafNodes) {
    addNode(node)
  }
  for (const edge of viewEdges) {
    const parent = edge.parent ? subgraphs.get(edge.parent) : G
    invariant(parent, 'Edge parent graph should be defined')
    addEdge(edge, parent)
  }

  // const groupIds = pipe(
  //   viewEdges,
  //   filter(e => !!e.parent && isEdgeVisible(e)),
  //   groupBy(e => e.parent!),
  //   omitBy((v,_k) => v.length <= 1),
  //   keys,
  //   map(k => k as Fqn),
  //   sort<Fqn>(compareFqnHierarchically),
  //   reverse(),
  //   // flatMap(e => (e.parent && isEdgeVisible(e) ? [e.parent] : [])),
  //   // uniq(),
  //   // sort<Fqn>(compareFqnHierarchically),
  //   // reverse()
  // )

  // const processed = new Set<Fqn>()
  // for (const groupId of groupIds) {
  //   const id = nameFromFqn(groupId).toLowerCase()
  //   for (const element of leafElements(groupId)) {
  //     if (processed.has(element.id)) {
  //       continue
  //     }
  //     processed.add(element.id)
  //     graphvizNodes.get(element.id)?.attributes.set(_.group, id)
  //   }
  // }

  return G
}

export function printToDot(view: ComputedView): DotSource {
  return toDot(toGraphvisModel(view)) as DotSource
}
