import dagre, { type EdgeConfig, type GraphLabel } from '@dagrejs/dagre'
import { DefaultMap } from 'mnemonist'
import { concat, filter, forEachObj, groupBy, map, mapToObj, pipe, prop, reduce, tap } from 'remeda'
import { invariant } from '../../errors'
import type { ElementModel } from '../../model/ElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { DiagramNode, DiagramView, Fqn, NodeId } from '../../types'
import { sortParentsFirst } from '../../utils'
import { toArray } from '../../utils/iterable'
import type { RelationshipsViewData } from './_types'
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
  element: ElementModel
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
  elements: ReadonlySet<ElementModel>,
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

export function layoutRelationshipsView(data: RelationshipsViewData): Pick<DiagramView, 'nodes' | 'edges' | 'bounds'> {
  const g = createGraph()

  const incomers = createNodes('in', data.incomers, g),
    subjects = createNodes('subject', data.subjects, g),
    outgoers = createNodes('out', data.outgoers, g)

  const edges = [] as Array<{
    name: string
    source: string // node id
    target: string // node id
    relations: RelationshipModel[]
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

    return {
      id: id as NodeId,
      parent: parentId as NodeId ?? null,
      position: [position.x, position.y],
      title: element.title,
      description: element.description,
      technology: element.technology,
      tags: null,
      links: null,
      color: element.color,
      shape: element.shape,
      modelRef: element.id,
      kind: element.kind,
      level: nodeLevel(id),
      labelBBox: {
        x: position.x,
        y: position.y,
        width: width,
        height: height,
      },
      style: {
        ...element.$element.style,
      },
      inEdges: [],
      outEdges: [],
      ...(children.length > 0 && { depth: nodeDepth(id) }),
      children,
      width,
      height,
    }
  })

  return {
    bounds: {
      x: 0,
      y: 0,
      width: g.graph().width ?? 100,
      height: g.graph().height ?? 100,
    },
    nodes,
    edges: [],
  }
}
