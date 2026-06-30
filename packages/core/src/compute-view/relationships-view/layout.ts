// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import dagre, { type EdgeConfig, type GraphLabel } from '@dagrejs/dagre'
import {
  concat,
  filter,
  find,
  forEachObj,
  groupBy,
  hasAtLeast,
  map,
  mapToObj,
  pipe,
  prop,
  reduce,
  tap,
} from 'remeda'
import type { ElementModel, LikeC4ViewModel } from '../../model'
import type { RelationshipModel } from '../../model/RelationModel'
import {
  type AnyAux,
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type NodeId,
  type NonEmptyArray,
  type Point,
  exact,
} from '../../types'
import { invariant, sortParentsFirst } from '../../utils'
import { toArray } from '../../utils/iterable'
import { DefaultMap } from '../../utils/mnemonist'
import type { RelationshipsViewData } from './_types'
import { resolveRelationshipNodeStyle } from './resolve-node-style'
import { treeFromElements } from './utils'

/**
 * All constants related to the layout
 */
const Sizes = {
  dagre: {
    ranksep: 60,
    nodesep: 35,
    edgesep: 25,
  } satisfies GraphLabel,
  edgeLabel: {
    width: 120,
    height: 10,
    minlen: 1,
    weight: 1,
  } satisfies EdgeConfig,

  emptyNodeOffset: 120,

  nodeWidth: 320,
  nodeHeight: 180,

  // Spacer between elements in a compound node
  // 0 means no spacer
  spacerHeight: 0,

  compound: {
    labelHeight: 1,
    paddingTop: 60,
    paddingBottom: 32,
  },
}
type NodeData = {
  portId: string
  element: ElementModel<any>
  isCompound: boolean
}
function createGraph() {
  const g = new dagre.graphlib.Graph<NodeData>({
    directed: true,
    compound: true,
    multigraph: true,
  })
  g.setGraph({
    ...Sizes.dagre,
    rankdir: 'LR',
  })
  g.setDefaultEdgeLabel(() => ({ ...Sizes.edgeLabel }))
  g.setDefaultNodeLabel(() => ({}))

  // columns.reduce((prev, column) => {
  //   const c = graphColumn(column)
  //   g.setNode(c.id, {})
  //   g.setNode(c.anchor, { width: 40, height: 2 })
  //   g.setParent(c.anchor, c.id)
  //   if (prev) {
  //     g.setEdge(prev, c.anchor, {
  //       width: 0
  //     })
  //   }
  //   return c.anchor
  // }, null as string | null)

  return g
}
type G = ReturnType<typeof createGraph>

const PortSuffix = '-port'

function createNodes(
  prefix: string,
  elements: ReadonlySet<ElementModel<any>>,
  g: G,
) {
  const graphNodes = new DefaultMap<Fqn, { id: string; portId: string }>(key => ({
    id: `${prefix}-${key}`,
    portId: `${prefix}-${key}`,
  }))
  const tree = treeFromElements(elements)
  for (const element of tree.sorted) {
    const isCompound = tree.children(element).length > 0
    const fqn = element.id
    const id = `${prefix}-${fqn}`
    const portId = isCompound ? `${id}${PortSuffix}` : id
    graphNodes.set(fqn, {
      id,
      portId,
    })
    g.setNode(id, {
      element,
      isCompound,
      portId,
      width: Sizes.nodeWidth,
      height: Sizes.nodeHeight,
    })

    if (isCompound) {
      g.setNode(portId, {
        element,
        portId,
        isCompound,
        width: Sizes.nodeWidth - Sizes.dagre.ranksep,
        height: Sizes.compound.labelHeight,
      })
      g.setParent(portId, id)
      // g.node(id).padding = 60
    }

    const parent = tree.parent(element)
    if (parent) {
      g.setParent(id, `${prefix}-${parent.id}`)
    }
  }
  return {
    ...tree,
    byId: (id: string) => {
      const element = tree.byId(id)
      const graph = graphNodes.get(element.id)
      return {
        element,
        graph,
      }
    },
    graphNodes,
  }
}

/**
 * Apply dagre layout to the graph
 * And return a function to get node bounds for xyflow
 */
function applyDagreLayout(g: G) {
  dagre.layout(g, {
    // disableOptimalOrderHeuristic: true,
  })
  return (nodeId: string) => {
    const node = g.node(nodeId)
    const { x, y, width, height } = node
    return {
      position: {
        x: x - Math.round(width / 2),
        y: y - Math.round(height / 2),
      },
      width,
      height,
    }
  }
}

function toStraightBezierSpline(points: Point[]): NonEmptyArray<Point> {
  invariant(hasAtLeast(points, 2), 'relationship edge should have at least two points')
  const [start, ...rest] = points
  const spline: NonEmptyArray<Point> = [start]

  for (const end of rest) {
    const previous = spline[spline.length - 1]
    invariant(previous, 'relationship edge spline should have a previous point')
    const dx = end[0] - previous[0]
    const dy = end[1] - previous[1]
    spline.push(
      [previous[0] + dx / 3, previous[1] + dy / 3],
      [previous[0] + dx * 2 / 3, previous[1] + dy * 2 / 3],
      end,
    )
  }

  return spline
}

type Bounds = Pick<DiagramNode, 'x' | 'y' | 'width' | 'height'>
type BoundsSide = 'top' | 'bottom' | 'left' | 'right'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampPointToBounds([x, y]: Point, { x: minX, y: minY, width, height }: Bounds): Point {
  return [
    clamp(x, minX, minX + width),
    clamp(y, minY, minY + height),
  ]
}

function overflowSide([x, y]: Point, { x: minX, y: minY, width, height }: Bounds): BoundsSide | null {
  const maxX = minX + width
  const maxY = minY + height
  switch (true) {
    case y < minY:
      return 'top'
    case y > maxY:
      return 'bottom'
    case x < minX:
      return 'left'
    case x > maxX:
      return 'right'
    default:
      return null
  }
}

function overlapsSide([x, y]: Point, { x: minX, y: minY, width, height }: Bounds, side: BoundsSide) {
  const maxX = minX + width
  const maxY = minY + height
  switch (side) {
    case 'top':
      return y < minY && x >= minX && x <= maxX
    case 'bottom':
      return y > maxY && x >= minX && x <= maxX
    case 'left':
      return x < minX && y >= minY && y <= maxY
    case 'right':
      return x > maxX && y >= minY && y <= maxY
  }
}

function clampPointToSide([x, y]: Point, { x: minX, y: minY, width, height }: Bounds, side: BoundsSide): Point {
  switch (side) {
    case 'top':
      return [x, minY]
    case 'bottom':
      return [x, minY + height]
    case 'left':
      return [minX, y]
    case 'right':
      return [minX + width, y]
  }
}

function clampTerminalSegmentToBounds(points: Point[], bounds: Bounds, terminal: 'start' | 'end') {
  const terminalIndex = terminal === 'start' ? 0 : points.length - 1
  const side = overflowSide(points[terminalIndex]!, bounds)
  points[terminalIndex] = clampPointToBounds(points[terminalIndex]!, bounds)
  if (!side) {
    return
  }

  if (terminal === 'start') {
    for (let i = 1; i < points.length && overlapsSide(points[i]!, bounds, side); i++) {
      points[i] = clampPointToSide(points[i]!, bounds, side)
    }
    return
  }

  for (let i = points.length - 2; i >= 0 && overlapsSide(points[i]!, bounds, side); i--) {
    points[i] = clampPointToSide(points[i]!, bounds, side)
  }
}

export function layoutRelationshipsView<M extends AnyAux>(
  data: RelationshipsViewData<M>,
  scope: LikeC4ViewModel<M> | null = null,
): Pick<DiagramView, 'nodes' | 'edges' | 'bounds'> {
  const g = createGraph()

  const incomers = createNodes('in', data.incomers, g),
    subjects = createNodes('subject', data.subjects, g),
    outgoers = createNodes('out', data.outgoers, g)

  const edges = [] as Array<{
    name: string
    source: string // node id
    target: string // node id
    relations: RelationshipModel<M>[]
  }>

  pipe(
    concat(
      pipe(
        toArray(data.incoming),
        map(r => ({
          id: r.source.id,
          source: incomers.byId(r.source.id).graph,
          target: subjects.byId(r.target.id).graph,
          relation: r,
        })),
        // Sort by source
        sortParentsFirst,
      ),
      pipe(
        toArray(data.outgoing),
        map(r => ({
          id: r.target.id,
          source: subjects.byId(r.source.id).graph,
          target: outgoers.byId(r.target.id).graph,
          relation: r,
        })),
        // Sort by target
        sortParentsFirst,
      ),
    ),
    map(r => ({
      ...r,
      expr: `${r.source.id}->${r.target.id}`,
    })),
    // Group if same source and target
    groupBy(prop('expr')),
    forEachObj((grouped) => {
      const source = grouped[0].source
      const target = grouped[0].target
      const name = grouped[0].expr

      g.setEdge(source.portId, target.portId, {
        ...Sizes.edgeLabel,
      }, name)
      edges.push({
        name,
        source: source.id,
        target: target.id,
        relations: map(grouped, prop('relation')),
      })
    }),
  )

  // Grow nodes with more than 2 ports
  for (const subjectNode of subjects.graphNodes.values()) {
    const nodeId = subjectNode.id
    const node = g.node(nodeId)
    if (node.isCompound) {
      continue
    }
    const edgeCount = Math.max(g.inEdges(nodeId)?.length ?? 0, g.outEdges(nodeId)?.length ?? 0)
    if (edgeCount > 2) {
      node.height = node.height + (edgeCount - 3) * 14
    }
  }

  const dagreBounds = applyDagreLayout(g)

  const nodeIds = [
    ...incomers.graphNodes.values(),
    ...subjects.graphNodes.values(),
    ...outgoers.graphNodes.values(),
  ]

  // Calculate bounds for all nodes except compounds
  // We shrink compounds to fit their children
  const _calculatedNodeBounds = pipe(
    nodeIds,
    // Compound nodes have different portId
    filter(n => n.id === n.portId),
    mapToObj(n => [n.id, dagreBounds(n.id)]),
  )

  function nodeBounds(nodeId: string): ReturnType<typeof dagreBounds> {
    return _calculatedNodeBounds[nodeId] ??= pipe(
      g.children(nodeId) as string[] | undefined ?? [],
      filter(id => !id.endsWith(PortSuffix)),
      map(id => nodeBounds(id)),
      tap(bounds => {
        invariant(bounds.length > 0, `Node ${nodeId} has no nested nodes`)
      }),
      reduce((acc, bounds) => {
        return {
          minY: Math.min(acc.minY, bounds.position.y),
          maxY: Math.max(acc.maxY, bounds.position.y + bounds.height),
        }
      }, { minY: Infinity, maxY: -Infinity }),
      ({ minY, maxY }) => {
        const {
          position: { x },
          width,
        } = dagreBounds(nodeId)
        minY = minY - Sizes.compound.paddingTop
        maxY = maxY + Sizes.compound.paddingBottom

        return {
          position: {
            x,
            y: minY,
          },
          width,
          height: maxY - minY,
        }
      },
    )
  }

  function nodeLevel(nodeId: string): number {
    const parent = g.parent(nodeId)
    if (parent) {
      return nodeLevel(parent) + 1
    }
    return 0
  }
  function nodeDepth(nodeId: string): number {
    const children = g.children(nodeId) as string[] | undefined ?? []
    if (children.length === 0) {
      return 0
    }
    return 1 + Math.max(...children.map(nodeDepth))
  }

  const nodes = nodeIds.map(({ id }): DiagramNode => {
    const { element } = g.node(id)
    let { position, width, height } = nodeBounds(id)
    const parentId = g.parent(id)
    // if (parentId) {
    //   const parentPos = nodeBounds(parentId).position
    //   position = {
    //     x: position.x - parentPos.x,
    //     y: position.y - parentPos.y,
    //   }
    // }
    const children = (g.children(id) as NodeId[] | undefined ?? []).filter(c => !c.endsWith(PortSuffix))

    const resolvedStyle = resolveRelationshipNodeStyle(scope, element)

    return exact({
      id: id as NodeId,
      parent: parentId as NodeId ?? null,
      title: element.title,
      x: position.x,
      y: position.y,
      description: element.summary.$source ?? null,
      technology: element.technology,
      tags: [],
      links: null,
      color: resolvedStyle.color,
      icon: resolvedStyle.icon,
      shape: resolvedStyle.shape,
      modelRef: element.id,
      kind: element.kind,
      level: nodeLevel(id),
      labelBBox: {
        x: position.x,
        y: position.y,
        width: width,
        height: height,
      },
      style: resolvedStyle.style,
      inEdges: [],
      outEdges: [],
      depth: children.length > 0 ? nodeDepth(id) : 0,
      children,
      width,
      height,
    })
  })

  const nodesById = new Map(nodes.map(node => [node.id, node]))

  const diagramEdges = g.edges().reduce((acc, e) => {
    const edge = g.edge(e)
    const ename = e.name
    if (!ename) {
      return acc
    }
    const edgeData = find(edges, edge => edge.name === ename)
    invariant(edgeData, `Edge ${ename} has no relationship data`)
    const onlyRelation = edgeData.relations.length === 1 ? edgeData.relations[0] : null
    const edgeId = edgeData.name as EdgeId
    const source = nodesById.get(edgeData.source as NodeId)
    const target = nodesById.get(edgeData.target as NodeId)
    invariant(source, `Edge ${ename} has no source node ${edgeData.source}`)
    invariant(target, `Edge ${ename} has no target node ${edgeData.target}`)

    // Keep exported geometry valid for direct LayoutedView consumers, even though current source generators ignore it.
    const points = edge.points.map(p => [p.x, p.y] as Point)
    clampTerminalSegmentToBounds(points, source, 'start')
    clampTerminalSegmentToBounds(points, target, 'end')

    acc.push(exact({
      id: edgeId,
      parent: null,
      source: edgeData.source as NodeId,
      target: edgeData.target as NodeId,
      label: onlyRelation ? onlyRelation.title ?? 'untitled' : `${edgeData.relations.length} relationships`,
      description: onlyRelation?.description.$source ?? null,
      technology: onlyRelation?.technology ?? null,
      relations: edgeData.relations.map(r => r.id),
      kind: onlyRelation?.kind ?? undefined,
      color: onlyRelation?.color ?? 'gray',
      line: onlyRelation?.line ?? 'dashed',
      head: onlyRelation?.head,
      tail: onlyRelation?.tail,
      navigateTo: onlyRelation?.navigateTo?.id ?? null,
      points: toStraightBezierSpline(points),
      labelBBox: null,
    }))
    return acc
  }, [] as DiagramEdge[])

  const nodeEdges = new Map<NodeId, { inEdges: EdgeId[]; outEdges: EdgeId[] }>()
  const edgesOf = (nodeId: NodeId) => {
    let edges = nodeEdges.get(nodeId)
    if (!edges) {
      edges = { inEdges: [], outEdges: [] }
      nodeEdges.set(nodeId, edges)
    }
    return edges
  }
  for (const edge of diagramEdges) {
    edgesOf(edge.source).outEdges.push(edge.id)
    edgesOf(edge.target).inEdges.push(edge.id)
  }

  return {
    bounds: {
      x: 0,
      y: 0,
      width: g.graph().width ?? 100,
      height: g.graph().height ?? 100,
    },
    nodes: nodes.map(node => ({
      ...node,
      inEdges: nodeEdges.get(node.id)?.inEdges ?? [],
      outEdges: nodeEdges.get(node.id)?.outEdges ?? [],
    })),
    edges: diagramEdges,
  }
}
