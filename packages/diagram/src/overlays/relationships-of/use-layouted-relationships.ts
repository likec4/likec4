import dagre, { type GraphLabel, type Label } from '@dagrejs/dagre'
import {
  compareFqnHierarchically,
  type DiagramNode,
  type DiagramView,
  type Fqn,
  invariant,
  isAncestor,
  type LikeC4Model,
  type NonEmptyArray,
  type Relation
} from '@likec4/core'
import { MarkerType } from '@xyflow/system'
import { useMemo } from 'react'
import {
  entries,
  filter,
  find,
  first,
  forEach,
  fromKeys,
  groupBy,
  isTruthy,
  map,
  only,
  pipe,
  prop,
  reverse,
  sort,
  sortBy,
  takeWhile,
  tap
} from 'remeda'
import { useDiagramState } from '../../hooks/useDiagramState'
import { useLikeC4Model } from '../../likec4model'
import type { XYFlowTypes } from './_types'

const graphColumn = <C extends 'incomers' | 'subject' | 'outgoers'>(c: C) => ({
  name: c,
  id: `__${c}`,
  anchor: `__${c}::anchor`
})

/**
 * All constants related to the layout
 */
const Sizes = {
  dagre: {
    ranksep: 40,
    nodesep: 20,
    edgesep: 20
  } satisfies GraphLabel,
  edgeLabel: {
    width: 60
  } satisfies Label,

  emptyNodeOffset: 100,

  nodeWidth: 270,
  hodeHeight: 160,

  // Spacer between elements in a compound node
  // 0 means no spacer
  spacerHeight: 0,

  compoundLabelHeight: 5
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

  const columns = ['incomers', 'subject', 'outgoers'] as const
  columns.reduce((prev, column) => {
    const c = graphColumn(column)
    g.setNode(c.id, {})
    g.setNode(c.anchor, { width: 50, height: 5 })
    g.setParent(c.anchor, c.id)
    if (prev) {
      g.setEdge(prev, c.anchor)
    }
    return c.anchor
  }, null as string | null)

  return g
}

type LikeC4ModelElement = LikeC4Model.ElementModel
// type LikeC4ModelElement = LikeC4ViewModel.Element

type Context = {
  g: dagre.graphlib.Graph
  subjectId: Fqn
  diagramNodes: Map<Fqn, DiagramNode>

  // likec4model: LikeC4Model
  // subject: XYFlowTypes.ElementNode
  // Model
  // subject: LikeC4ModelElement
  connected: {
    incomers: Set<Fqn>
    outgoers: Set<Fqn>
  }
  columns: {
    // left
    incomers: Map<string, XYFlowTypes.Node>
    // right
    outgoers: Map<string, XYFlowTypes.Node>
  }
  edges: XYFlowTypes.Edge[]
}

type ColumnKey = keyof Context['columns']

const sized = (height: number = Sizes.hodeHeight) => ({
  width: Sizes.nodeWidth,
  height
})

const graphId = (node: XYFlowTypes.Node) => ({
  id: node.id,
  port: node.type === 'compound' ? `${node.id}::port` : node.id,
  // port: `${node.id}::port`,
  // For nested nodes
  body: `${node.id}`,
  spacer: `${node.id}:spacer`
})

function nodeData(
  element: LikeC4Model.ElementModel,
  ctx: Context
): Omit<XYFlowTypes.NonEmptyNode['data'], 'column'> {
  // We try to inherit style from existing diagram node
  let diagramNode = ctx.diagramNodes.get(element.id)

  // Ansector separetely, because we want to inherit
  // color from it if there is no diagram node
  const ancestor = diagramNode ?? pipe(
    element.ancestors(),
    map(ancestor => ctx.diagramNodes.get(ancestor.id)),
    filter(isTruthy),
    first()
  )

  return {
    fqn: element.id,
    existsInCurrentView: ctx.diagramNodes.has(element.id),
    element: {
      kind: element.kind,
      title: diagramNode?.title ?? element.title,
      description: diagramNode?.description ?? element.element.description,
      color: diagramNode?.color ?? ancestor?.color ?? element.color,
      shape: diagramNode?.shape ?? element.shape
    },
    ports: {
      left: [],
      right: []
    }
  }
}

function createEmptyNode(
  column: ColumnKey,
  ctx: Context
): XYFlowTypes.EmptyNode {
  const id = `${column}::empty`
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

  ctx.g.setNode(k.id, {
    width: 230,
    height: 130
  })
  ctx.g.setParent(k.id, graphColumn(column).id)
  return xynode
}

function createNode(
  column: ColumnKey,
  nodeType: Exclude<XYFlowTypes.Node['type'], 'empty'>,
  element: LikeC4Model.ElementModel,
  ctx: Context
): XYFlowTypes.ElementNode | XYFlowTypes.CompoundNode {
  const xynodes = ctx.columns[column]
  let node = xynodes.get(element.id)
  if (node) {
    invariant(node.type !== 'empty', `Node ${element.id} is empty`)
    return node
  }
  const g = ctx.g

  // Create parent node
  const parent = pipe(
    element.ancestors(),
    takeWhile(ancestor => !isAncestor(ancestor.id, ctx.subjectId)),
    find(ancestor => ctx.diagramNodes.has(ancestor.id) || ctx.connected[column].has(ancestor.id)),
    found => found ? createNode(column, 'compound', found, ctx) : null
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
    g.setNode(k.id, {
      padding: 40
    })
    g.setNode(k.port, {
      width: Sizes.nodeWidth - Sizes.dagre.ranksep,
      height: Sizes.compoundLabelHeight
    })
    g.setParent(k.port, k.id)
  }

  const parentGraphId = parent ? graphId(parent).body : graphColumn(column).id
  g.setParent(k.id, parentGraphId)

  // Add spacer after the last element
  if (Sizes.spacerHeight > 0 && parent) {
    g.setNode(k.spacer, {
      width: Sizes.nodeWidth - Sizes.dagre.ranksep,
      height: Sizes.compoundLabelHeight
    })
    g.setParent(k.spacer, parentGraphId)
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

function addEdge(
  ctx: Context,
  props: {
    source: string
    target: string
    relations: XYFlowTypes.Edge['data']['relations']
  }
) {
  const { source, target, relations } = props
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
      relations
    },
    label: isMultiple ? `${relations.length} relationships` : label,
    zIndex: ZIndexes.edge,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: isMultiple ? 8 : 10
      // height: isMultiple ? 8 : 10,
    },
    style: {
      strokeWidth: isMultiple ? 5 : 2
    }
    // pathOptions: {
    //   curvature: 0.4
    // }
  }
  ctx.edges.push(edge)
}

function processRelations(props: {
  incoming: Relation[]
  forEachIncoming: (sourceId: string, relations: NonEmptyArray<Relation>) => void
  outgoing: Relation[]
  forEachOutgoing: (targetId: string, relations: NonEmptyArray<Relation>) => void
}) {
  // Group by source, because might be multiple relations between the same elements
  pipe(
    props.incoming,
    groupBy(r => r.source),
    tap(v => console.log('incoming', v)),
    entries(),
    sort((a, b) => compareFqnHierarchically(a[0], b[0])),
    reverse(),
    forEach(([sourceId, relations]) => {
      try {
        props.forEachIncoming(sourceId, relations)
      } catch (e) {
        console.error('Error in forEachIncoming', e)
      }
    })
  )
  // Group by target
  pipe(
    props.outgoing,
    groupBy(r => r.target),
    tap(v => console.log('incoming', v)),
    entries(),
    sort((a, b) => compareFqnHierarchically(a[0], b[0])),
    reverse(),
    forEach(([targetId, relations]) => {
      try {
        props.forEachOutgoing(targetId, relations)
      } catch (e) {
        console.error('Error in forEachOutgoing', e)
      }
    })
  )
}

function layout(
  subjectId: Fqn,
  diagram: DiagramView,
  likec4model: LikeC4Model,
  scope: 'global' | 'view'
): {
  viewIncludesSubject: boolean
  subject: LikeC4ModelElement
  nodes: XYFlowTypes.Node[]
  edges: XYFlowTypes.Edge[]
} {
  const diagramNodes = new Map(diagram.nodes.map(n => [n.id, n]))
  const subjectElement = likec4model.element(subjectId)

  if (!diagramNodes.has(subjectId)) {
    // Reset scope to global if subject is not in the view
    scope = 'global'
  }

  const g = createGraph()

  const ctx: Context = {
    g,
    diagramNodes,
    subjectId,
    connected: fromKeys(
      ['incomers', 'outgoers'] as const,
      (column) => new Set(subjectElement[column]().map(m => m.id))
    ),
    columns: {
      incomers: new Map(),
      outgoers: new Map()
    },
    edges: []
  }

  const subject: XYFlowTypes.ElementNode = {
    id: subjectElement.id,
    type: 'element',
    position: { x: 0, y: 0 },
    data: {
      ...nodeData(subjectElement, ctx),
      column: 'subject'
    },
    zIndex: 3,
    selectable: false,
    focusable: false,
    ...sized()
  }
  g.setNode(subject.id, sized())
  g.setParent(subject.id, graphColumn('subject').id)

  processRelations({
    // Based on the scope we pick relationships
    ...(scope === 'global'
      ? {
        incoming: subjectElement.incoming().map(r => r.relationship),
        outgoing: subjectElement.outgoing().map(r => r.relationship)
      }
      : {
        incoming: likec4model.view(diagram.id).element(subjectId)
          .incoming()
          .flatMap(c => c.relationships().map(r => r.relationship)),
        outgoing: likec4model.view(diagram.id).element(subjectId)
          .outgoing()
          .flatMap(c => c.relationships().map(r => r.relationship))
      }),

    forEachIncoming(sourceId, relations) {
      const source = createNode('incomers', 'element', likec4model.element(sourceId), ctx)
      g.setEdge(graphId(source).port, subject.id, {
        weight: source.type === 'compound' ? 0 : 1
      })

      const op = source.type === 'compound' ? 'unshift' : 'push'

      subject.data.ports.left[op]({
        id: source.id,
        type: 'in'
      })
      source.data.ports.right.push({
        id: subject.id,
        type: 'out'
      })
      addEdge(ctx, {
        source: source.id,
        target: subject.id,
        relations
      })
    },

    forEachOutgoing(targetId, relations) {
      const target = createNode('outgoers', 'element', likec4model.element(targetId), ctx)
      g.setEdge(subjectElement.id, graphId(target).port, {
        weight: target.type === 'compound' ? 2 : 1
      })

      const op = target.type === 'compound' ? 'unshift' : 'push'
      subject.data.ports.right[op]({
        id: target.id,
        type: 'out'
      })
      target.data.ports.left.push({
        id: subject.id,
        type: 'in'
      })
      addEdge(ctx, {
        source: subjectElement.id,
        target: target.id,
        relations
      })
    }
  })

  if (ctx.columns.incomers.size == 0) {
    const source = createEmptyNode('incomers', ctx)
    g.setEdge(graphId(source).port, subject.id)
  }
  if (ctx.columns.outgoers.size == 0) {
    const target = createEmptyNode('outgoers', ctx)
    g.setEdge(subject.id, graphId(target).port)
  }

  const subjectPortsCount = Math.max(subject.data.ports.left.length, subject.data.ports.right.length)
  if (subjectPortsCount > 2) {
    g.node(subjectElement.id).height = Sizes.hodeHeight + (subjectPortsCount - 2) * 10
  }

  const nodebounds = applyDagreLayout(ctx.g)

  const xynodes = [
    subject,
    ...ctx.columns.incomers.values(),
    ...ctx.columns.outgoers.values()
  ].map((node) => {
    return {
      ...node,
      ...nodebounds(node.id, node.parentId)
    }
  })

  // Sort ports in subject vertically
  const sortedPorts = (ports: XYFlowTypes.Port[]) => {
    if (ports.length < 2) {
      return ports
    }
    return pipe(
      ports,
      map(port => {
        return {
          port,
          topY: nodebounds(port.id).position.y
        }
      }),
      sortBy(prop('topY')),
      map(prop('port'))
    )
  }

  // Sort ports by their position
  for (const node of xynodes) {
    if (node.type === 'empty') {
      const subjectPosition = nodebounds(subject.id)
      node.position.y = subjectPosition.position.y + subjectPosition.height / 2 - node.height / 2
      if (node.data.column === 'incomers') {
        // Place on the left
        node.position.x = subjectPosition.position.x - node.width - Sizes.emptyNodeOffset
      } else {
        // Place on the right
        node.position.x = subjectPosition.position.x + subjectPosition.width + Sizes.emptyNodeOffset
      }
      continue
    }
    if (node.data.ports.left.length > 0) {
      node.data.ports.left = sortedPorts(node.data.ports.left)
    }
    if (node.data.ports.right.length > 0) {
      node.data.ports.right = sortedPorts(node.data.ports.right)
    }
  }

  return {
    viewIncludesSubject: diagramNodes.has(subjectId),
    subject: subjectElement,
    edges: ctx.edges,
    nodes: xynodes
  }
}

export function useLayoutedRelationships(scope: 'global' | 'view') {
  const {
    subjectId,
    view
  } = useDiagramState(s => {
    return {
      subjectId: s.activeOverlay?.relationshipsOf,
      view: s.view
    }
  })
  invariant(subjectId, 'subject not found')
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
