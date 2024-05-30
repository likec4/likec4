/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedEdge, ComputedNode, ComputedView, EdgeId, Fqn, RelationshipLineType } from '@likec4/core'
import {
  DefaultRelationshipColor,
  defaultTheme,
  DefaultThemeColor,
  invariant,
  nameFromFqn,
  nonNullable,
  parentFqn
} from '@likec4/core'
import { first, isNullish as isNil, isNumber, isTruthy, last } from 'remeda'
import {
  attribute as _,
  digraph,
  type GraphBaseModel,
  type NodeModel,
  type RootGraphModel,
  type SubgraphModel,
  toDot as modelToDot
} from 'ts-graphviz'
import { edgeLabel, nodeLabel, sanitize } from './dot-labels'
import type { DotSource } from './types'
import { compoundColor, compoundLabelColor, isCompound, pxToInch, pxToPoints, toArrowType } from './utils'

const DefaultEdgeStyle = 'dashed' satisfies RelationshipLineType

export function toGraphvisModel({
  __: $type,
  autoLayout,
  nodes: viewNodes,
  edges: viewEdges
}: ComputedView): RootGraphModel {
  function leafElements(parentId: Fqn | null): ComputedNode[] {
    if (parentId === null) {
      return viewNodes.filter(n => !isCompound(n))
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

  /**
   * At the moment, we don't show edges between clusters.
   * But they are still used to calculate the rank of nodes.
   * UPDATE: we show edges between clusters now.
   */
  function isEdgeVisible(_edge: ComputedEdge | EdgeId) {
    // const edge = getEdge(_edge)
    // if (cacheIsEdgeVisible.has(edge)) {
    //   return cacheIsEdgeVisible.get(edge)!
    // }
    // const hasCompoundEndpoint = viewNodes.some(
    //   n => (n.id === edge.source || n.id === edge.target) && isCompound(n)
    // )
    // cacheIsEdgeVisible.set(edge, !hasCompoundEndpoint)
    // return !hasCompoundEndpoint
    return true
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

  const Theme = defaultTheme
  const G = digraph({
    [_.bgcolor]: 'transparent',
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.rankdir]: autoLayout,
    [_.TBbalance]: $type === 'element' ? 'min' : 'max',
    [_.splines]: 'spline',
    [_.outputorder]: 'nodesfirst',
    [_.nodesep]: pxToInch(100),
    [_.ranksep]: pxToInch(110),
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
    [_.fontcolor]: Theme.elements[DefaultThemeColor].hiContrast,
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
    [_.style]: DefaultEdgeStyle,
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

  function resolveEdgeSource(sourceId: Fqn) {
    let sourceNode = getComputedNode(sourceId)
    let source = graphvizNodes.get(sourceId)
    let ltail: string | undefined
    if (!source) {
      invariant(isCompound(sourceNode), 'source node should be compound')
      // Edge with cluster as source
      ltail = subgraphs.get(sourceId)?.id
      invariant(ltail, `subgraph ${sourceId} not found`)
      sourceNode = nonNullable(
        last(leafElements(sourceId)),
        `last leaf element in ${sourceId} not found`
      )
      source = nonNullable(
        graphvizNodes.get(sourceNode.id),
        `source graphviz node ${sourceNode.id} not found`
      )
    }
    return [sourceNode, source, ltail] as const
  }

  function resolveEdgeTarget(targetFqn: Fqn) {
    let targetNode = getComputedNode(targetFqn)
    let target = graphvizNodes.get(targetFqn)
    let lhead: string | undefined
    if (!target) {
      invariant(isCompound(targetNode), 'target node should be compound')
      // Edge with cluster as target
      lhead = subgraphs.get(targetFqn)?.id
      invariant(lhead, `subgraph ${targetFqn} not found`)
      targetNode = nonNullable(
        first(leafElements(targetFqn)),
        `first leaf element in ${targetFqn} not found`
      )
      target = nonNullable(
        graphvizNodes.get(targetNode.id),
        `target graphviz node ${targetNode.id} not found`
      )
    }
    return [targetNode, target, lhead] as const
  }

  function addEdge<E extends ComputedEdge>(edge: E, parent: GraphBaseModel) {
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = resolveEdgeSource(sourceFqn)
    const [targetNode, target, lhead] = resolveEdgeTarget(targetFqn)

    const edgeParentId = edge.parent

    const e = parent.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    if (lhead || ltail) {
      const sourceId = source.attributes.get(_.likec4_id) as Fqn
      const targetId = target.attributes.get(_.likec4_id) as Fqn
      const existingVisibleEdge = viewEdges.find(e => e.source === sourceId && e.target === targetId)
      if (existingVisibleEdge) {
        e.attributes.set(_.weight, 0)
      }
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

    if (edge.dir === 'back') {
      if (edge.head) {
        e.attributes.set(_.arrowtail, toArrowType(edge.head))
      }
      if (edge.tail && edge.tail !== 'none') {
        e.attributes.set(_.arrowhead, toArrowType(edge.tail))
      } else {
        e.attributes.set(_.arrowhead, 'none')
      }
      e.attributes.set(_.dir, 'back')
      return
    }

    if (edge.head) {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(edge.head)
      })
    }
    if (edge.tail && edge.tail !== 'none') {
      if (edge.head === 'none') {
        e.attributes.apply({
          [_.arrowtail]: toArrowType(edge.tail),
          [_.dir]: 'back'
        })
      } else {
        e.attributes.apply({
          [_.arrowtail]: toArrowType(edge.tail),
          [_.dir]: 'both'
          // [_.constraint]: false
        })
      }
    }

    if (edge.head === 'none' && (isNil(edge.tail) || edge.tail === 'none')) {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        // [_.minlen]: 0
        [_.constraint]: false
      })
      return
    }

    // Don't do further processing for dynamic views
    if ($type === 'dynamic') {
      return
    }

    let otherEdges
    if (edgeParentId === null && sourceNode.parent == null && targetNode.parent == null) {
      otherEdges = viewEdges.filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        // hide edges inside clusters
        if (e.parent !== null) {
          return false
        }
        const edgeSource = getComputedNode(e.source)
        const edgeTarget = getComputedNode(e.target)
        // hide edges with compound endpoints
        if (isCompound(edgeSource) || isCompound(edgeTarget)) {
          return false
        }
        // only edges between top-level nodes
        return edgeSource.parent == null && edgeTarget.parent == null
      })
    } else {
      otherEdges = findNestedEdges(edgeParentId).filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        return true
      })
    }
    const isTheOnlyEdge = otherEdges.length === 0
    if (isTheOnlyEdge) {
      if (edgeParentId === null || leafElements(edgeParentId).length <= 3) {
        // don't rank the edge
        // e.attributes.set(_.minlen, 0)
        e.attributes.set(_.constraint, false)
      }
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

export function printToDot(view: ComputedView): DotSource {
  return modelToDot(toGraphvisModel(view)) as DotSource
}

export function toDot(graphviz: Graphviz, computedView: ComputedView) {
  const initial = printToDot(computedView)

  // if (computedView.__ === 'dynamic') {
  //   return initial
  // }

  // const acyclicResult = graphviz.acyclic(initial, true)
  // const acyclicDot = acyclicResult.outFile ?? initial

  // console.log('acyclicDot ---------------')
  // console.log(acyclicDot)
  // console.log('acyclicDot ---------------')

  const unflattened = graphviz.unflatten(initial, 1, true, 2)
  return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ')
}
