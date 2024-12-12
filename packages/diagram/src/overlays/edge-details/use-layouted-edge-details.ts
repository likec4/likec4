import dagre, { type GraphLabel, type Label } from '@dagrejs/dagre'
import {
  compareFqnHierarchically,
  compareRelations,
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  invariant,
  isAncestor,
  type LikeC4Model
} from '@likec4/core'
import { MarkerType } from '@xyflow/system'
import { useMemo } from 'react'
import { filter, first, forEach, isTruthy, map, pipe, prop, reverse, sort, sortBy, takeWhile } from 'remeda'
import { useDiagramState } from '../../hooks/useDiagramState'
import { useLikeC4Model } from '../../likec4model'
import type { XYFlowTypes } from './_types'

/**
 * All constants related to the layout
 */
const Sizes = {
  dagre: {
    ranksep: 40,
    nodesep: 25,
    edgesep: 15
  } satisfies GraphLabel,
  edgeLabel: {
    width: 120
  } satisfies Label,

  nodeWidth: 270,
  hodeHeight: 160,

  // Spacer between elements in a compound node
  // 0 means no spacer
  spacerHeight: 0,

  compoundLabelHeight: 5
}

export const ZIndexes = {
  compound: 2,
  edge: 3,
  element: 4,

  max: 5
}

function createGraph() {
  const g = new dagre.graphlib.Graph({
    directed: true,
    compound: true
  })
  g.setGraph({
    ...Sizes.dagre,
    rankdir: 'LR'
  })
  g.setDefaultEdgeLabel(() => ({ ...Sizes.edgeLabel }))
  g.setDefaultNodeLabel(() => ({}))

  return g
}

type Context = {
  g: dagre.graphlib.Graph
  diagramNodes: Map<Fqn, DiagramNode>
  xynodes: Map<Fqn, XYFlowTypes.Node>
  edge: DiagramEdge
  edges: XYFlowTypes.Edge[]
}
const sized = (height: number = Sizes.hodeHeight) => ({
  width: Sizes.nodeWidth,
  height
})

const graphId = (node: XYFlowTypes.Node) => ({
  id: node.id,
  port: node.type === 'compound' ? `${node.id}::port` : node.id,
  body: `${node.id}`,
  spacer: `${node.id}:spacer`
})

function nodeData(
  element: LikeC4Model.Element,
  ctx: Context
): Omit<XYFlowTypes.Node['data'], 'column'> {
  // We try to inherit style from existing diagram node
  let diagramNode = ctx.diagramNodes.get(element.id)

  // Ansector separetely, because we want to inherit
  // color from it if there is no diagram node
  const ancestor = diagramNode ?? pipe(
    element.ancestors().toArray(),
    map(ancestor => ctx.diagramNodes.get(ancestor.id)),
    filter(isTruthy),
    first()
  )

  return {
    fqn: element.id,
    element: {
      kind: element.kind,
      title: diagramNode?.title ?? element.title,
      description: diagramNode?.description ?? element.description,
      color: diagramNode?.color ?? ancestor?.color ?? element.color,
      shape: diagramNode?.shape ?? element.shape
    },
    navigateTo: diagramNode?.navigateTo ?? first(element.scopedViews().take(1).toArray())?.id ?? null,
    ports: {
      in: [],
      out: []
    }
  }
}

function createNode(
  nodeType: XYFlowTypes.Node['type'],
  element: LikeC4Model.Element,
  ctx: Context
): XYFlowTypes.Node {
  let node = ctx.xynodes.get(element.id)
  if (node) {
    return node
  }
  const g = ctx.g

  // Create parent node
  const parent = pipe(
    element.ancestors().toArray(),
    takeWhile(ancestor => !isAncestor(ancestor.id, ctx.edge.source) && !isAncestor(ancestor.id, ctx.edge.target)),
    first(),
    found => found ? createNode('compound', found, ctx) : null
  )

  const xynode: XYFlowTypes.Node = {
    type: nodeType,
    id: element.id,
    position: { x: 0, y: 0 },
    data: {
      ...nodeData(element, ctx)
    },
    zIndex: ZIndexes[nodeType],
    ...(!!parent && { parentId: parent.id })
  }
  ctx.xynodes.set(element.id, xynode)
  const k = graphId(xynode)
  g.setNode(k.id, sized())

  // There is one-to-one mapping between XYFlow node and dagre node
  // Compound node has two nodes: body and port (for edges)
  if (xynode.type === 'compound') {
    g.setNode(k.port, {
      width: Sizes.nodeWidth - Sizes.dagre.ranksep,
      height: Sizes.compoundLabelHeight
    })
    g.setParent(k.port, k.id)
  }

  if (parent) {
    const parentGraphId = graphId(parent).body
    g.setParent(k.id, parentGraphId)

    // Add spacer after the last element
    if (Sizes.spacerHeight > 0) {
      g.setNode(k.spacer, {
        width: Sizes.nodeWidth - Sizes.dagre.ranksep,
        height: Sizes.compoundLabelHeight
      })
      g.setParent(k.spacer, parentGraphId)
    }
  }

  return xynode
}

/**
 * Apply dagre layout to the graph
 * And return a function to get node bounds for xyflow
 */
function applyDagreLayout(g: dagre.graphlib.Graph) {
  type NodeBounds = Required<Pick<XYFlowTypes.Node, 'position' | 'width' | 'height'>>
  dagre.layout(g)
  return function nodeBounds(nodeId: string, relativeTo?: string): NodeBounds {
    const { x, y, width, height } = g.node(nodeId)
    const pos = {
      position: {
        x: x - Math.round(width / 2),
        y: y - Math.round(height / 2)
      },
      width,
      height
    }
    if (!relativeTo) {
      return pos
    }
    const offset = nodeBounds(relativeTo).position
    return {
      position: {
        x: pos.position.x - offset.x,
        y: pos.position.y - offset.y
      },
      width: pos.width,
      height: pos.height
    }
  }
}

function layout(
  edgeId: EdgeId,
  view: DiagramView,
  likec4model: LikeC4Model
): {
  view: DiagramView
  edge: DiagramEdge
  nodes: XYFlowTypes.Node[]
  edges: XYFlowTypes.Edge[]
  bounds: { x: number; y: number; width: number; height: number }
} {
  const edge = view.edges.find(e => e.id === edgeId)
  invariant(edge, 'edge not found')
  const all = new Set([edge.source, edge.target])

  const relations = edge.relations
    .map(r => {
      const relation = likec4model.relationship(r)
      all.add(relation.source.id)
      all.add(relation.target.id)
      return {
        source: relation.source.id,
        target: relation.target.id,
        relation: relation.$relationship
      }
    })
    .sort(compareRelations)
    .reverse()

  const diagramNodes = new Map(view.nodes.map(n => [n.id, n]))
  const g = createGraph()

  const ctx: Context = {
    g,
    xynodes: new Map(),
    edge,
    diagramNodes,
    edges: []
  }

  pipe(
    [...all],
    sort(compareFqnHierarchically),
    reverse(),
    forEach(id => {
      const element = likec4model.element(id)
      createNode('element', element, ctx)
    })
  )

  if (relations.length === 1 && all.size < 4) {
    g.setDefaultEdgeLabel(() => ({ width: 250 }))
  }

  for (const { relation, ...points } of relations) {
    const source = ctx.xynodes.get(points.source)
    invariant(source, 'source node not found')
    const target = ctx.xynodes.get(points.target)
    invariant(target, 'target node not found')

    source.data.ports.out.push(target.id)
    target.data.ports.in.push(source.id)

    g.setEdge(graphId(source).port, graphId(target).port)
    const edge: XYFlowTypes.Edge = {
      id: relation.id,
      type: 'relation',
      source: source.id,
      target: target.id,
      sourceHandle: target.id,
      targetHandle: source.id,
      data: {
        relationId: relation.id,
        navigateTo: relation.navigateTo ?? null,
        technology: relation.technology ?? null,
        description: relation.description ?? null
      },
      label: relation.title,
      zIndex: ZIndexes.edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 10
      },
      style: {
        strokeWidth: 2.2,
        strokeDasharray: '5, 5'
      }
    }
    ctx.edges.push(edge)
  }

  const nodebounds = applyDagreLayout(ctx.g)

  // Sort ports
  const sortedPorts = (ports: string[]) => {
    if (ports.length < 2) {
      return ports
    }
    return pipe(
      ports,
      map(port => {
        return {
          port,
          topY: nodebounds(port).position.y
        }
      }),
      sortBy(prop('topY')),
      map(prop('port'))
    )
  }

  const xynodes = [...ctx.xynodes.values()].map((node) => {
    if (node.data.ports.in.length > 1) {
      node.data.ports.in = sortedPorts(node.data.ports.in)
    }
    if (node.data.ports.out.length > 1) {
      node.data.ports.out = sortedPorts(node.data.ports.out)
    }
    return {
      ...node,
      ...nodebounds(node.id, node.parentId)
    }
  })

  return {
    view,
    edge,
    edges: ctx.edges,
    nodes: xynodes,
    bounds: {
      x: 0,
      y: 0,
      width: g.graph().width ?? 0,
      height: g.graph().height ?? 0
    }
  }
}

export function useLayoutedEdgeDetails(edgeId: EdgeId) {
  const view = useDiagramState(s => s.view)
  const likec4model = useLikeC4Model(true)
  return useMemo(() =>
    layout(
      edgeId,
      view,
      likec4model
    ), [
    edgeId,
    view,
    likec4model,
    layout
  ])
}
