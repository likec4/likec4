import dagre, { type GraphLabel, type Label } from '@dagrejs/dagre'
import {
  type AbstractRelation,
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type LikeC4Model,
  type XYPoint,
  compareFqnHierarchically,
  compareRelations,
  invariant,
  isAncestor,
} from '@likec4/core'
import { useMemo } from 'react'
import { filter, first, forEach, isTruthy, map, pipe, prop, reverse, sort, sortBy, takeWhile } from 'remeda'
import { useLikeC4Model } from '../../likec4model'
import type { RelationshipDetailsTypes } from './_types'

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
  } satisfies Label,

  nodeWidth: 330,
  hodeHeight: 180,

  // Spacer between elements in a compound node
  // 0 means no spacer
  spacerHeight: 0,

  compoundLabelHeight: 5,
}

export const ZIndexes = {
  compound: 2,
  edge: 3,
  element: 4,

  max: 5,
}

// type DagreNodeData = {
//   portId: string
//   element: LikeC4Model.Element
//   isCompound: boolean
//   inPorts: string[]
//   outPorts: string[]
// }

function createGraph() {
  const g = new dagre.graphlib.Graph({
    directed: true,
    compound: true,
  })
  g.setGraph({
    ...Sizes.dagre,
    rankdir: 'LR',
  })
  g.setDefaultEdgeLabel(() => ({ ...Sizes.edgeLabel }))
  g.setDefaultNodeLabel(() => ({}))

  return g
}
type G = ReturnType<typeof createGraph>

type Context = {
  g: ReturnType<typeof createGraph>
  diagramNodes: Map<Fqn, DiagramNode>
  xynodes: Map<Fqn, RelationshipDetailsTypes.Node>
  edge: DiagramEdge
  xyedges: RelationshipDetailsTypes.Edge[]
}
const sized = (height: number = Sizes.hodeHeight) => ({
  width: Sizes.nodeWidth,
  height,
})

const graphId = (node: RelationshipDetailsTypes.Node) => ({
  id: node.id,
  port: node.type === 'compound' ? `${node.id}::port` : node.id,
})

function nodeData(
  element: LikeC4Model.Element,
  ctx: Context,
): RelationshipDetailsTypes.ElementNodeData & RelationshipDetailsTypes.CompoundNodeData {
  // We try to inherit style from existing diagram node
  let diagramNode = ctx.diagramNodes.get(element.id)

  // Ansector separetely, because we want to inherit
  // color from it if there is no diagram node
  const ancestor = diagramNode ?? pipe(
    element.ancestors().toArray(),
    map(ancestor => ctx.diagramNodes.get(ancestor.id)),
    filter(isTruthy),
    first(),
  )

  return {
    fqn: element.id,
    title: diagramNode?.title ?? element.title,
    technology: diagramNode?.technology ?? element.technology,
    description: diagramNode?.description ?? element.description,
    color: diagramNode?.color ?? ancestor?.color ?? element.color,
    shape: diagramNode?.shape ?? element.shape,
    icon: diagramNode?.icon ?? element.icon,
    style: diagramNode?.style ?? element.$element.style ?? {},
    navigateTo: diagramNode?.navigateTo ?? first(element.scopedViews().take(1).toArray())?.id ?? null,
    width: 0,
    height: 0,
    depth: 1,
    ports: {
      in: [],
      out: [],
    },
  }
}

function createXYNode(
  nodeType: RelationshipDetailsTypes.Node['type'],
  element: LikeC4Model.Element,
  ctx: Context,
): RelationshipDetailsTypes.Node {
  let node = ctx.xynodes.get(element.id)
  if (node) {
    return node
  }
  const g = ctx.g

  // Create parent node
  const parent = pipe(
    [...element.ancestors()],
    takeWhile(ancestor => !isAncestor(ancestor.id, ctx.edge.source) && !isAncestor(ancestor.id, ctx.edge.target)),
    first(),
    found => found ? createXYNode('compound', found, ctx) : null,
  )

  const isCompound = nodeType === 'compound'

  const base = {
    id: element.id,
    draggable: false,
    selectable: true,
    focusable: true,
    deletable: false,
    position: { x: 0, y: 0 },
    zIndex: ZIndexes[nodeType],
    initialWidth: 0,
    initialHeight: 0,
    ...(!!parent && { parentId: parent.id }),
  } satisfies Omit<RelationshipDetailsTypes.Node, 'data' | 'type'>

  const xynode: RelationshipDetailsTypes.Node = {
    ...base,
    type: nodeType,
    data: nodeData(element, ctx),
  }
  ctx.xynodes.set(element.id, xynode)
  const k = graphId(xynode)
  g.setNode(k.id, sized())

  // There is one-to-one mapping between XYFlow node and dagre node
  // Compound node has two nodes: body and port (for edges)
  if (xynode.type === 'compound') {
    g.setNode(k.port, {
      width: Sizes.nodeWidth - Sizes.dagre.ranksep,
      height: Sizes.compoundLabelHeight,
    })
    g.setParent(k.port, k.id)
  }

  if (parent) {
    const parentGraphId = graphId(parent).id
    g.setParent(k.id, parentGraphId)
  }

  return xynode
}

/**
 * Apply dagre layout to the graph
 * And return a function to get node bounds for xyflow
 */
function applyDagreLayout(g: G) {
  dagre.layout(g)
  return function nodeBounds(nodeId: string, relativeTo?: string): {
    position: XYPoint
    width: number
    height: number
  } {
    const { x, y, width, height } = g.node(nodeId)
    const pos = {
      position: {
        x: x - Math.round(width / 2),
        y: y - Math.round(height / 2),
      },
      width,
      height,
    }
    if (!relativeTo) {
      return pos
    }
    const offset = nodeBounds(relativeTo).position
    return {
      position: {
        x: pos.position.x - offset.x,
        y: pos.position.y - offset.y,
      },
      width: pos.width,
      height: pos.height,
    }
  }
}

function layout(
  edge: DiagramEdge,
  view: DiagramView,
  likec4model: LikeC4Model,
): {
  edge: DiagramEdge
  xynodes: RelationshipDetailsTypes.Node[]
  xyedges: RelationshipDetailsTypes.Edge[]
  bounds: { x: number; y: number; width: number; height: number }
} {
  const all = new Set([edge.source, edge.target])

  const relations = edge.relations
    .map(r => {
      const relation = likec4model.relationship(r)
      all.add(relation.source.id)
      all.add(relation.target.id)
      return {
        source: relation.source.id,
        target: relation.target.id,
        relation: relation.$relationship as AbstractRelation,
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
    xyedges: [],
  }

  pipe(
    [...all],
    sort(compareFqnHierarchically),
    reverse(),
    forEach(id => {
      const element = likec4model.element(id)
      createXYNode('element', element, ctx)
    }),
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
    const edge: RelationshipDetailsTypes.Edge = {
      id: relation.id,
      type: 'relationship',
      source: source.id,
      target: target.id,
      sourceHandle: source.id + '_out' + (source.data.ports.out.length - 1),
      targetHandle: target.id + '_in' + (target.data.ports.in.length - 1),
      data: {
        relationId: relation.id,
        color: relation.color,
        label: relation.title ?? null,
        technology: relation.technology,
        description: relation.description,
        navigateTo: relation.navigateTo ?? null,
        line: relation.line ?? 'dashed',
      },
      zIndex: ZIndexes.edge,
    }
    ctx.xyedges.push(edge)
  }

  const nodebounds = applyDagreLayout(ctx.g)

  // Sort ports
  const sortedPorts = (nodeId: string, type: 'in' | 'out', ports: string[]) => {
    return pipe(
      ports,
      map((port, index) => {
        return {
          port: nodeId + '_' + type + index,
          topY: nodebounds(port).position.y,
        }
      }),
      sortBy(prop('topY')),
      map(prop('port')),
    )
  }

  const xynodes = [...ctx.xynodes.values()].map((node) => {
    const { position, width, height } = nodebounds(node.id, node.parentId)
    node.data.ports.in = sortedPorts(node.id, 'in', node.data.ports.in)
    node.data.ports.out = sortedPorts(node.id, 'out', node.data.ports.out)
    if (node.type === 'element') {
      node.data.width = width
      node.data.height = height
    }
    node.position = position
    node.initialHeight = height
    node.initialWidth = width
    node.style = {
      width,
      height,
    }
    return node
  })

  return {
    edge,
    xyedges: ctx.xyedges,
    xynodes,
    bounds: {
      x: 0,
      y: 0,
      width: g.graph().width ?? 0,
      height: g.graph().height ?? 0,
    },
  }
}

export function useLayoutedDetails(edgeId: EdgeId, view: DiagramView): {
  edge: DiagramEdge
  xynodes: RelationshipDetailsTypes.Node[]
  xyedges: RelationshipDetailsTypes.Edge[]
  bounds: { x: number; y: number; width: number; height: number }
} {
  const edge = view.edges.find(e => e.id === edgeId)
  invariant(edge, `edge ${edgeId} not found in ${view.id}`)
  const likec4model = useLikeC4Model(true)
  return useMemo(() =>
    layout(
      edge,
      view,
      likec4model,
    ), [
    edge,
    view,
    layout,
  ])
}
