import type { ComputedDynamicView, ComputedEdge, ComputedNode, Fqn } from '@likec4/core'
import {
  DefaultRelationshipColor,
  defaultTheme,
  DefaultThemeColor,
  extractStep,
  invariant,
  nameFromFqn,
  nonNullable,
  parentFqn
} from '@likec4/core'
import { first, isNullish, isNullish as isNil, isNumber, isTruthy, last } from 'remeda'
import {
  attribute as _,
  digraph,
  type GraphBaseModel,
  type NodeModel,
  type RootGraphModel,
  type SubgraphModel,
  toDot as modelToDot
} from 'ts-graphviz'
import { nodeLabel, sanitize, stepEdgeLabel } from './dot-labels'
import { DefaultEdgeStyle } from './printElementViewToDot'
import type { DotSource } from './types'
import { compoundColor, compoundLabelColor, isCompound, pxToInch, pxToPoints, toArrowType } from './utils'

export function dynamicViewToGraphvisModel({
  autoLayout,
  nodes: viewNodes,
  edges: viewEdges
}: ComputedDynamicView): RootGraphModel {
  function leafElements(parentId: Fqn | null): ComputedNode[] {
    if (parentId === null) {
      return viewNodes.filter(n => !isCompound(n) && isNullish(n.parent))
    }
    const prefix = parentId + '.'
    return viewNodes.filter(
      n => !isCompound(n) && (n.parent === parentId || n.parent?.startsWith(prefix))
    )
  }

  function getComputedNode(id: Fqn) {
    return nonNullable(
      viewNodes.find(n => n.id === id),
      `Node ${id} not found`
    )
  }

  const Theme = defaultTheme
  const G = digraph({
    [_.bgcolor]: 'transparent',
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.rankdir]: autoLayout,
    [_.TBbalance]: 'max',
    [_.splines]: 'spline',
    [_.outputorder]: 'nodesfirst',
    [_.newrank]: true,
    [_.nodesep]: pxToInch(110),
    [_.ranksep]: pxToInch(130),
    [_.pack]: pxToPoints(180),
    [_.packmode]: 'array_3',
    [_.pad]: pxToInch(10)
  })

  G.attributes.graph.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(13),
    [_.labeljust]: autoLayout === 'RL' ? 'r' : 'l',
    [_.labelloc]: autoLayout === 'BT' ? 'b' : 't',
    [_.margin]: 33.21, // hack for svg output/*  */
    [_.penwidth]: pxToPoints(1)
  })

  G.attributes.node.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(20),
    // [_.fontcolor]: Theme.elements[DefaultThemeColor].hiContrast,
    [_.shape]: 'rect',
    [_.width]: pxToInch(330),
    [_.height]: pxToInch(185),
    [_.style]: 'filled,rounded',
    [_.fillcolor]: Theme.elements[DefaultThemeColor].fill,
    [_.color]: Theme.elements[DefaultThemeColor].stroke,
    [_.penwidth]: 0,
    [_.margin]: pxToInch(26)
  })

  G.attributes.edge.apply({
    [_.fontname]: Theme.font,
    [_.fontsize]: pxToPoints(13),
    [_.penwidth]: pxToPoints(2),
    [_.style]: 'dashed',
    [_.color]: Theme.relationships[DefaultRelationshipColor].lineColor,
    [_.fontcolor]: Theme.relationships[DefaultRelationshipColor].labelColor
  })

  const ids = new Set<string>()
  const subgraphs = new Map<Fqn, SubgraphModel>()
  const graphvizNodes = new Map<Fqn, NodeModel>()

  function checkNodeId(name: string, isCompound = false) {
    if (isCompound) {
      name = 'cluster_' + name
    } else if (name.toLowerCase().startsWith('cluster')) {
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
    switch (elementNode.shape) {
      case 'browser': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(30)},${pxToInch(32)}`
        })
        break
      }
      case 'queue': {
        node.attributes.apply({
          [_.width]: pxToInch(330),
          [_.height]: pxToInch(170),
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
      [_.fillcolor]: compoundColor(Theme.elements[elementNode.color].fill, elementNode.depth),
      [_.color]: compoundColor(Theme.elements[elementNode.color].stroke, elementNode.depth),
      [_.style]: 'filled',
      [_.margin]: pxToPoints(40)
    })
    const label = sanitize(elementNode.title.toUpperCase())
    if (isTruthy(label)) {
      const color = compoundLabelColor(Theme.elements[elementNode.color].loContrast)
      subgraph.apply({
        [_.fontcolor]: color,
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

  function resolveEdgeEndpoint(
    sourceId: Fqn,
    pickFromCluster: (data: ComputedNode[]) => ComputedNode | undefined = first
  ) {
    let computedNode = getComputedNode(sourceId)
    let endpoint = graphvizNodes.get(sourceId)
    let ltail: string | undefined
    if (!endpoint) {
      invariant(isCompound(computedNode), 'endpoint node should be compound')
      // Edge with cluster as endpoint
      ltail = subgraphs.get(sourceId)?.id
      invariant(ltail, `subgraph ${sourceId} not found`)
      computedNode = nonNullable(
        pickFromCluster(leafElements(sourceId)),
        `leaf element in ${sourceId} not found`
      )
      endpoint = nonNullable(
        graphvizNodes.get(computedNode.id),
        `source graphviz node ${computedNode.id} not found`
      )
    }
    return [endpoint, ltail] as const
  }

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [source, ltail] = resolveEdgeEndpoint(sourceFqn, nodes => last(nodes))
    const [target, lhead] = resolveEdgeEndpoint(targetFqn, first)

    const e = parent.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    const step = extractStep(edge.id)
    const label = edge.label?.trim()
    e.attributes.apply({
      [_.label]: stepEdgeLabel(step, label)
    })
    if (isTruthy(label)) {
      e.attributes.set(_.decorate, true)
    }
    if (edge.color) {
      e.attributes.apply({
        [_.color]: Theme.relationships[edge.color].lineColor,
        [_.fontcolor]: Theme.relationships[edge.color].labelColor
      })
    }

    if (edge.head === 'none' && (isNil(edge.tail) || edge.tail === 'none')) {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.minlen]: 0
      })
      return
    }

    if (edge.dir === 'back') {
      e.attributes.set(_.arrowtail, toArrowType(edge.head ?? 'normal'))
      if (edge.tail && edge.tail !== 'none') {
        e.attributes.set(_.arrowhead, toArrowType(edge.tail))
      } else {
        e.attributes.set(_.arrowhead, 'none')
      }
      e.attributes.set(_.dir, 'back')
      return
    }

    if (edge.head && edge.head !== 'normal') {
      e.attributes.set(_.arrowhead, toArrowType(edge.head))
    }
    if (edge.tail && edge.tail !== 'none') {
      e.attributes.set(_.arrowtail, toArrowType(edge.tail))
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

  // const groups = pipe(
  //   viewEdges,
  //   filter(e => !!e.parent && isEdgeVisible(e)),
  //   groupBy(e => e.parent!),
  //   omitBy((v, _k) => v.length < 2 || v.length > 6),
  //   mapValues(edges => uniq(edges.flatMap(e => [e.source, e.target]))),
  //   toPairs,
  //   map(([groupId, nodes]) => ({ id: groupId as Fqn, nodes })),
  //   sort(compareByFqnHierarchically),
  //   reverse()
  // )

  // const processed = new Set<Fqn>()
  // for (const group of groups) {
  //   for (const elementId of group.nodes) {
  //     if (processed.has(elementId)) {
  //       continue
  //     }
  //     processed.add(elementId)
  //     graphvizNodes.get(elementId)?.attributes.set(_.group, group.id)
  //   }
  // }

  return G
}

export function printDynamicViewToDot(view: ComputedDynamicView): DotSource {
  return modelToDot(dynamicViewToGraphvisModel(view)) as DotSource
}
