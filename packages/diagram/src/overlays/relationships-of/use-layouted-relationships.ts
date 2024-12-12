import dagre, { type EdgeConfig, type GraphLabel } from '@dagrejs/dagre'
import {
  compareByFqnHierarchically,
  compareNatural,
  compareRelations,
  type DiagramNode,
  type DiagramView,
  type Fqn,
  invariant,
  isAncestor,
  type LikeC4Model,
  nonNullable,
  parentFqn,
  type RelationId
} from '@likec4/core'
import { MarkerType } from '@xyflow/system'
import { useMemo } from 'react'
import {
  filter,
  find,
  first,
  flatMap,
  forEach,
  forEachObj,
  groupBy,
  isNonNullish,
  isTruthy,
  map,
  mapToObj,
  only,
  pipe,
  prop,
  reduce,
  reverse,
  sort,
  sortBy,
  takeWhile,
  tap
} from 'remeda'
import { useLikeC4Model } from '../../likec4model'
import type { XYFlowTypes } from './_types'
import type { SharedTypes } from '../shared/xyflow/_types'

const columns = ['incomers', 'subjects', 'outgoers'] as const
type ColumnKey = typeof columns[number]

// const graphColumn = <C extends 'incomers' | 'subjects' | 'outgoers'>(c: C) => ({
//   name: c,
//   id: `__${c}`,
//   anchor: `__${c}::anchor`
// })

/**
 * All constants related to the layout
 */
const Sizes = {
  dagre: {
    ranksep: 60,
    nodesep: 35,
    edgesep: 25
  } satisfies GraphLabel,
  edgeLabel: {
    width: 120,
    height: 10,
    minlen: 1,
    weight: 1
  } satisfies EdgeConfig,

  emptyNodeOffset: 120,

  nodeWidth: 320,
  hodeHeight: 180,

  // Spacer between elements in a compound node
  // 0 means no spacer
  spacerHeight: 0,

  compound: {
    labelHeight: 1,
    paddingTop: 50,
    paddingBottom: 32
  }
}

export const ZIndexes = {
  empty: 2,
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

type Context = {
  scope: 'global' | 'view'
  g: dagre.graphlib.Graph
  subjectId: Fqn
  diagramNodes: Map<Fqn, DiagramNode>
  subjectElement: LikeC4Model.Element
  // likec4model: LikeC4Model
  // subject: XYFlowTypes.ElementNode
  // Model
  // subject: LikeC4ModelElement
  connected: {
    incomers: Set<Fqn>
    subjects: Set<Fqn>
    outgoers: Set<Fqn>
  }
  columns: {
    incomers: Map<Fqn, XYFlowTypes.Node>
    subjects: Map<Fqn, XYFlowTypes.Node>
    outgoers: Map<Fqn, XYFlowTypes.Node>
  }
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
): Omit<XYFlowTypes.NonEmptyNode['data'], 'column'> {
  // We try to inherit style from existing diagram node
  let diagramNode = ctx.diagramNodes.get(element.id)

  // Ansector separetely, because we want to inherit
  // color from it if there is no diagram node
  const ancestor = diagramNode ?? (ctx.scope === 'view'
    ? pipe(
      element.ancestors().toArray(),
      map(ancestor => ctx.diagramNodes.get(ancestor.id)),
      filter(isTruthy),
      first()
    )
    : undefined)

  return {
    fqn: element.id,
    existsInCurrentView: ctx.diagramNodes.has(element.id),
    element: {
      kind: element.kind,
      title: diagramNode?.title ?? element.title,
      description: diagramNode?.description ?? element.description,
      color: diagramNode?.color ?? ancestor?.color ?? element.color,
      shape: diagramNode?.shape ?? element.shape
    },
    navigateTo: diagramNode?.navigateTo ?? element.defaultView?.id ?? null,
    ports: {
      in: [],
      out: []
    }
  }
}

function createEmptyNode(
  column: ColumnKey,
  ctx: Context
): XYFlowTypes.EmptyNode {
  const id = `${column}__empty` as Fqn
  const xynodes = ctx.columns[column]
  let node = xynodes.get(id)
  if (node) {
    invariant(node.type === 'empty', 'Node is not empty')
    return node
  }
  const xynode: XYFlowTypes.EmptyNode = {
    type: 'empty',
    id,
    position: { x: 0, y: 0 },
    data: {
      column
    },
    zIndex: ZIndexes.empty
  }
  xynodes.set(id, xynode)
  const k = graphId(xynode)

  const emptyContainer = id + '__container'
  ctx.g.setNode(emptyContainer, {})
  ctx.g.setNode(k.id, {
    width: Sizes.nodeWidth - 20,
    height: Sizes.hodeHeight
  })
  ctx.g.setParent(k.id, emptyContainer)
  return xynode
}

function createNode(
  column: ColumnKey,
  nodeType: Exclude<XYFlowTypes.Node['type'], 'empty'>,
  element: LikeC4Model.Element,
  ctx: Context,
  depth: number = 0
): XYFlowTypes.ElementNode | XYFlowTypes.CompoundNode {
  const xynodes = ctx.columns[column]
  let node = xynodes.get(element.id)
  if (node) {
    invariant(node.type !== 'empty', `Unexpected empty Node type ${element.id}: ${node.type}, expect ${nodeType}`)
    if (node.type === 'element' && nodeType === 'compound') {
      throw new Error(`Unexpected Node type ${element.id}: ${node.type}, expect ${nodeType}`)
    }
    return node
  }
  const g = ctx.g

  // Create parent node
  const parent = pipe(
    element.ancestors().toArray(),
    takeWhile(ancestor => !isAncestor(ancestor.id, ctx.subjectId)),
    find(ancestor =>
      ctx.diagramNodes.has(ancestor.id) || ctx.connected[column].has(ancestor.id)
      || (ctx.scope === 'global' && ctx.subjectElement.ascendingSiblings().some(s => s.id === ancestor.id))
    ),
    found => found ? createNode(column, 'compound', found, ctx, depth + 2) : null
  )

  const xynode: XYFlowTypes.NonEmptyNode = {
    type: nodeType,
    id: `${column}::${element.id}`,
    position: { x: 0, y: 0 },
    data: {
      ...nodeData(element, ctx),
      column
    },
    zIndex: ZIndexes[nodeType],
    ...(!!parent && { parentId: parent.id })
  }
  xynodes.set(element.id, xynode)
  // There is one-to-one mapping between XYFlow node and dagre node
  // Compound node has two nodes: body and port (for edges)

  const k = graphId(xynode)

  g.setNode(k.id, sized())
  if (xynode.type === 'compound') {
    g.setNode(k.port, {
      width: Sizes.nodeWidth - Sizes.dagre.ranksep,
      height: Sizes.compound.labelHeight
    })
    g.setParent(k.port, k.id)
  }

  if (parent) {
    parent.data.depth = Math.min(Math.max(parent.data.depth ?? 0, depth + 1), 6)
    g.setParent(k.id, graphId(parent).body)
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
  return function nodeBounds(nodeId: string): NodeBounds {
    const { x, y, width, height } = g.node(nodeId)
    return {
      position: {
        x: x - Math.round(width / 2),
        y: y - Math.round(height / 2)
      },
      width,
      height
    }
  }
}

function addEdge(
  ctx: Context,
  props: {
    includedInCurrentView: boolean
    source: string
    target: string
    relations: XYFlowTypes.Edge['data']['relations']
  }
) {
  const { source, target, relations, includedInCurrentView } = props
  const ids = relations.map(r => r.id).join('_')
  const label = only(relations)?.title ?? 'untitled'

  const isMultiple = relations.length > 1
  const edge: XYFlowTypes.Edge = {
    id: `rel${ctx.edges.length + 1}_${ids}`,
    type: 'relation',
    source,
    target,
    sourceHandle: target,
    targetHandle: source,
    data: {
      includedInCurrentView,
      relations
    },
    label: isMultiple ? `${relations.length} relationships` : label,
    zIndex: ZIndexes.edge,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: isMultiple ? 7 : 9
    },
    style: {
      strokeWidth: isMultiple ? 5 : 2.8,
      strokeDasharray: isMultiple ? undefined : '5, 5'
    }
  }
  ctx.edges.push(edge)
}

function findNodeOrFirstAncestor<N>(fqn: Fqn, nodes: Map<Fqn, N>) {
  let node = nodes.get(fqn)
  let parent: Fqn | null = fqn
  while (!node && !!(parent = parentFqn(parent))) {
    node = nodes.get(parent)
  }
  return node
}

function layout(
  subjectId: Fqn,
  view: DiagramView,
  likec4model: LikeC4Model,
  scope: 'global' | 'view'
): {
  viewIncludesSubject: boolean
  notIncludedRelations: number
  subject: LikeC4Model.Element
  nodes: XYFlowTypes.Node[]
  edges: XYFlowTypes.Edge[]
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
} {
  const diagramNodes = new Map(view.nodes.map(n => [n.id, n]))
  const subjectElement = likec4model.element(subjectId)
  const viewIncludesSubject = diagramNodes.has(subjectId)

  const viewRelationships = new Set(
    view.edges.flatMap(e => e.relations)
  )
  // Relations that are not included in the view
  const notIncludedRelations = new Set<RelationId>()

  if (!viewIncludesSubject) {
    // Reset scope to global if subject is not in the view
    scope = 'global'
  } else {
    forEach([
      ...subjectElement.incoming().map(r => r.id),
      ...subjectElement.outgoing().map(r => r.id)
    ], (relationId) => {
      if (!viewRelationships.has(relationId)) {
        notIncludedRelations.add(relationId)
      }
    })
  }

  let relationships

  if (scope === 'global') {
    relationships = {
      incoming: subjectElement.incoming().map(r => r.$relationship).toArray(),
      outgoing: subjectElement.outgoing().map(r => r.$relationship).toArray()
    }
  } else {
    const subjectViewModel = likec4model.view(view.id).node(subjectId)
    relationships = {
      incoming: subjectViewModel.incoming()
        .flatMap(c => c.relationships('model').map(r => r.$relationship))
        .toArray(),
      outgoing: subjectViewModel.outgoing()
        .flatMap(c => c.relationships('model').map(r => r.$relationship))
        .toArray()
    }
  }

  const g = createGraph()

  const ctx: Context = {
    scope,
    g,
    diagramNodes,
    subjectElement,
    subjectId,
    connected: {
      incomers: new Set<Fqn>(),
      outgoers: new Set<Fqn>(),
      subjects: new Set<Fqn>([subjectId])
    },
    columns: {
      incomers: new Map(),
      subjects: new Map(),
      outgoers: new Map()
    },
    edges: []
  }

  relationships.incoming.forEach(incoming => {
    ctx.connected.incomers.add(incoming.source)
    ctx.connected.subjects.add(incoming.target)
  })
  relationships.outgoing.forEach(outgoing => {
    ctx.connected.subjects.add(outgoing.source)
    ctx.connected.outgoers.add(outgoing.target)
  })

  if (viewIncludesSubject) {
    const subjectViewModel = likec4model.view(view.id).node(subjectId)
    subjectViewModel.incomers().forEach(incomer => {
      ctx.connected.incomers.add(incomer.id)
    })
    subjectViewModel.outgoers().forEach(outgoer => {
      ctx.connected.outgoers.add(outgoer.id)
    })
  }

  // Created nodes per column
  columns.forEach(column => {
    pipe(
      [...ctx.connected[column].values()],
      map(id => likec4model.element(id)),
      sort((a, b) => -1 * compareNatural(a.title, b.title)),
      sort(compareByFqnHierarchically),
      reverse(),
      forEach(element => {
        createNode(column, 'element', element, ctx)
      })
    )
  })

  pipe(
    [
      // Process incoming
      {
        sources: ctx.columns.incomers,
        targets: ctx.columns.subjects,
        relationships: relationships.incoming.sort(compareRelations).reverse()
      },
      // Process outgoing
      {
        sources: ctx.columns.subjects,
        targets: ctx.columns.outgoers,
        relationships: relationships.outgoing.sort(compareRelations).reverse()
      }
    ],
    /**
     * We select relationships, sources and targets
     * If sourece or target of the relationship is not found - take first ancestor
     */
    flatMap(({ sources, targets, relationships }) => {
      return relationships.map(relation => {
        const source = findNodeOrFirstAncestor(relation.source, sources)
        if (!source || source.type === 'empty') {
          return null
        }
        const target = findNodeOrFirstAncestor(relation.target, targets)
        if (!target || target.type === 'empty') {
          return null
        }
        return ({
          relation,
          source,
          target,
          includedInCurrentView: viewRelationships.has(relation.id),
          id: `${source.id}:${target.id}`
        })
      })
    }),
    filter(isNonNullish),
    // Group relations with saame source and target - make them one edge
    groupBy(prop('id')),
    forEachObj((grouped) => {
      const { source, target } = grouped[0]
      const relations = map(grouped, g => g.relation)

      source.data.ports.out.push({
        id: target.id,
        type: 'out'
      })
      target.data.ports.in.push({
        id: source.id,
        type: 'in'
      })

      const isAnyCompound = source.type === 'compound' || target.type === 'compound'

      g.setEdge(graphId(source).port, graphId(target).port, {
        ...Sizes.edgeLabel
        // weight: isAnyCompound ? 1 : 2
      })

      addEdge(ctx, {
        // if view does not include subject - do not highlight
        includedInCurrentView: !viewIncludesSubject || grouped.every(g => g.includedInCurrentView),
        source: source.id,
        target: target.id,
        relations
      })
    })
  )

  // Create empty nodes if there are no incomers or outgoers
  const subjectPort = graphId(ctx.columns.subjects.get(subjectId)!).port

  if (ctx.columns.incomers.size == 0) {
    const source = createEmptyNode('incomers', ctx)
    g.setEdge(graphId(source).port, subjectPort)
  }
  if (ctx.columns.outgoers.size == 0) {
    const target = createEmptyNode('outgoers', ctx)
    g.setEdge(subjectPort, graphId(target).port)
  }

  // Grow nodes with more than 2 ports
  for (const subject of ctx.columns.subjects.values()) {
    if (subject.type !== 'element') {
      continue
    }
    const subjectPortsCount = Math.max(subject.data.ports.in.length, subject.data.ports.out.length)
    if (subjectPortsCount > 2) {
      g.node(subject.id).height = Sizes.hodeHeight + (subjectPortsCount - 3) * 14
    }
  }

  //
  const dagreBounds = applyDagreLayout(ctx.g)

  const xynodes = [
    ...ctx.columns.incomers.values(),
    ...ctx.columns.subjects.values(),
    ...ctx.columns.outgoers.values()
  ]

  // Calculate bounds for all nodes except compounds
  // We shrink compounds to fit their children
  const _calculatedNodeBounds = pipe(
    xynodes,
    filter(n => n.type !== 'compound'),
    mapToObj(n => [n.id, dagreBounds(n.id)])
  )

  function nodeBounds(nodeId: string): ReturnType<typeof dagreBounds> {
    return _calculatedNodeBounds[nodeId] ??= pipe(
      xynodes,
      filter(n => n.parentId === nodeId),
      map(n => nodeBounds(n.id)),
      tap(bounds => {
        invariant(bounds.length > 0, `Node ${nodeId} has no nested nodes`)
      }),
      reduce((acc, bounds) => {
        return {
          minY: Math.min(acc.minY, bounds.position.y),
          maxY: Math.max(acc.maxY, bounds.position.y + bounds.height)
        }
      }, { minY: Infinity, maxY: -Infinity }),
      ({ minY, maxY }) => {
        const {
          position: { x },
          width
        } = dagreBounds(nodeId)
        minY = minY - Sizes.compound.paddingTop
        maxY = maxY + Sizes.compound.paddingBottom

        return {
          position: {
            x,
            y: minY
          },
          width,
          height: maxY - minY
        }
      }
    )
  }

  // update xynodes
  for (const node of xynodes) {
    const { position, width, height } = nodeBounds(node.id)
    node.width = width
    node.height = height
    node.position = position
    if (node.parentId) {
      const parentPos = nodeBounds(node.parentId).position
      node.position = {
        x: position.x - parentPos.x,
        y: position.y - parentPos.y
      }
    }
  }

  // Sort ports in subject vertically
  const sortedPorts = (ports: SharedTypes.Port[]) => {
    return pipe(
      ports,
      map(port => {
        return {
          port,
          topY: nodeBounds(port.id).position.y
        }
      }),
      sortBy(prop('topY')),
      map(prop('port'))
    )
  }

  for (const node of xynodes) {
    // Grow empty nodes to fill the space
    if (node.type === 'empty') {
      const subjectBounds = nodeBounds(nonNullable(ctx.columns.subjects.get(subjectId), 'Subject node is missing').id)
      node.height = Math.min(subjectBounds.height, 300)
      node.position.y = subjectBounds.position.y + subjectBounds.height / 2 - node.height / 2
      if (node.data.column === 'incomers') {
        node.width = subjectBounds.position.x - Sizes.emptyNodeOffset - node.position.x
      } else {
        const rightX = node.position.x + node.width!
        node.position.x = subjectBounds.position.x + subjectBounds.width + Sizes.emptyNodeOffset
        node.width = rightX - node.position.x
      }
      continue
    }
    // Sort ports by their position
    if (node.data.ports.in.length > 1) {
      node.data.ports.in = sortedPorts(node.data.ports.in)
    }
    if (node.data.ports.out.length > 1) {
      node.data.ports.out = sortedPorts(node.data.ports.out)
    }
  }

  return {
    viewIncludesSubject,
    notIncludedRelations: notIncludedRelations.size,
    subject: subjectElement,
    edges: ctx.edges,
    nodes: xynodes,
    bounds: {
      x: 0,
      y: 0,
      width: g.graph().width ?? 100,
      height: g.graph().height ?? 100
    }
  }
}

export function useLayoutedRelationships(
  subjectId: Fqn,
  view: DiagramView,
  scope: 'global' | 'view'
) {
  const likec4model = useLikeC4Model(true)
  return useMemo(() =>
    layout(
      subjectId,
      view,
      likec4model,
      scope
    ), [
    subjectId,
    view,
    likec4model,
    layout,
    scope
  ])
}
