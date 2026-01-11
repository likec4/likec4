import {
  treeFromElements,
} from '@likec4/core/compute-view'
import type {
  AnyAux,
  DiagramEdge,
  DiagramNode,
  DiagramView,
  EdgeId,
  Fqn,
  IconUrl,
  MarkdownOrString,
  NodeId,
  NonEmptyArray,
  Point,
  RelationId,
} from '@likec4/core/types'
import { exact, preferSummary } from '@likec4/core/types'

import dagre, { type EdgeConfig, type GraphLabel } from '@dagrejs/dagre'
import type { ElementModel, LikeC4ViewModel, RelationshipModel } from '@likec4/core/model'
import {
  DefaultMap,
  ifind,
  invariant,
} from '@likec4/core/utils'
import {
  filter,
  find,
  map,
  mapToObj,
  omit,
  pipe,
  prop,
  reduce,
  sortBy,
  tap,
} from 'remeda'
import type { Except } from 'type-fest'
import type { RelationshipDetailsTypes } from './_types'
import type { RelationshipDetailsViewData } from './compute'

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
    width: 220,
    height: 14,
    // minlen: 1,
  } satisfies EdgeConfig,

  nodeWidth: 330,
  nodeHeight: 180,

  // Spacer between elements in a compound node
  // 0 means no spacer
  spacerHeight: 0,

  compound: {
    labelHeight: 2,
    paddingTop: 50,
    paddingBottom: 32,
  },
}

// /**
//  * All constants related to the layout
//  */
// const Sizes = {
//   dagre: {
//     ranksep: 60,
//     nodesep: 35,
//     edgesep: 25,
//   } satisfies GraphLabel,
//   edgeLabel: {
//     width: 120,
//     height: 10,
//     minlen: 1,
//     weight: 1,
//   } satisfies EdgeConfig,

//   emptyNodeOffset: 120,

//   nodeWidth: 330,
//   nodeHeight: 180,

//   // Spacer between elements in a compound node
//   // 0 means no spacer
//   spacerHeight: 0,

//   compound: {
//     labelHeight: 2,
//     paddingTop: 50,
//     paddingBottom: 32,
//   },
// }
type NodeData = {
  column: RelationshipDetailsTypes.Column
  portId: string
  element: ElementModel
  isCompound: boolean
  inPorts: string[]
  outPorts: string[]
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

  return g
}
type G = ReturnType<typeof createGraph>

const PortSuffix = '-port'

function createNodes(
  column: RelationshipDetailsTypes.Column,
  elements: ReadonlySet<ElementModel>,
  g: G,
) {
  const graphNodes = new DefaultMap<Fqn, { id: string; portId: string }>(key => ({
    id: `${column}-${key}`,
    portId: `${column}-${key}`,
  }))
  const tree = treeFromElements(elements)
  for (const element of tree.sorted) {
    const isCompound = tree.children(element).length > 0
    const fqn = element.id
    const id = `${column}-${fqn}`
    const portId = isCompound ? `${id}${PortSuffix}` : id
    graphNodes.set(fqn, {
      id,
      portId,
    })
    g.setNode(id, {
      column,
      element,
      isCompound,
      portId,
      inPorts: [],
      outPorts: [],
      width: Sizes.nodeWidth,
      height: Sizes.nodeHeight,
    })

    if (isCompound) {
      g.setNode(portId, {
        element,
        portId,
        isCompound,
        inPorts: [],
        outPorts: [],
        width: Sizes.nodeWidth - Sizes.dagre.ranksep,
        height: Sizes.compound.labelHeight,
      })
      g.setParent(portId, id)
      // g.node(id).padding = 60
    }

    const parent = tree.parent(element)
    if (parent) {
      g.setParent(id, `${column}-${parent.id}`)
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

export type LayoutResult = {
  // subject: Fqn
  // subjectExistsInScope: boolean
  nodes: LayoutResult.Node[]
  edges: LayoutResult.Edge[]
  bounds: DiagramView['bounds']
}

export namespace LayoutResult {
  export type Node = Except<DiagramNode, 'modelRef' | 'description' | 'deploymentRef' | 'inEdges' | 'outEdges'> & {
    description: MarkdownOrString | null
    modelRef: Fqn
    column: RelationshipDetailsTypes.Column
    ports: RelationshipDetailsTypes.Ports
    // existsInCurrentView: boolean
  }
  export type Edge = Except<DiagramEdge, 'relations' | 'description'> & {
    relationId: RelationId
    sourceHandle: string
    targetHandle: string
    description: MarkdownOrString | null
    // existsInCurrentView: boolean
    // column: RelationshipsBrowserTypes.Column
  }
}

export function layoutRelationshipDetails(
  data: RelationshipDetailsViewData,
  scope: LikeC4ViewModel<AnyAux> | null,
): LayoutResult {
  const g = createGraph()

  const sources = createNodes('sources', data.sources, g),
    targets = createNodes('targets', data.targets, g)

  const edges: Array<{
    name: string
    source: string // node id
    target: string // node id
    sourceHandle: string
    targetHandle: string
    relationship: RelationshipModel
  }> = Array.from(data.relationships).map(r => {
    const source = sources.byId(r.source.id).graph
    const target = targets.byId(r.target.id).graph
    const name = r.id

    g.node(source.id).outPorts.push(target.id)
    g.node(target.id).inPorts.push(source.id)

    g.setEdge(source.portId, target.portId, {
      ...Sizes.edgeLabel,
    }, name)
    return {
      name,
      source: source.id,
      sourceHandle: source.id + '_out' + (g.node(source.id).outPorts.length - 1),
      target: target.id,
      targetHandle: target.id + '_in' + (g.node(target.id).inPorts.length - 1),
      relationship: r,
    }
  })

  // Grow nodes with more than 2 ports
  const nodeIds = [
    ...sources.graphNodes.values(),
    ...targets.graphNodes.values(),
  ]
  for (const { id: nodeId } of nodeIds) {
    const node = g.node(nodeId)
    if (node.isCompound) {
      continue
    }
    const edgeCount = Math.max(g.inEdges(nodeId)?.length ?? 0, g.outEdges(nodeId)?.length ?? 0)
    if (edgeCount > 3) {
      node.height = node.height + (edgeCount - 4) * 14
    }
  }

  const edgeCount = g.edgeCount()
  if (edgeCount > 5) {
    for (const edge of g.edges()) {
      g.setEdge(edge, {
        ...Sizes.edgeLabel,
        width: edgeCount > 10 ? 800 : 400,
      })
    }
  }

  const dagreBounds = applyDagreLayout(g)

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

  // Sort ports in subject vertically
  const sortedPorts = (nodeId: string, type: 'in' | 'out', ports: string[]) => {
    return pipe(
      ports,
      map((port, index) => {
        return {
          port: nodeId + '_' + type + index,
          topY: nodeBounds(port).position.y,
        }
      }),
      sortBy(prop('topY')),
      map(prop('port')),
    )
  }
  // In case we got negative positions
  let minX = 0
  let minY = 0

  const nodes = nodeIds.map(({ id }): LayoutResult.Node => {
    const { element, inPorts, outPorts, column } = g.node(id)
    let { position, width, height } = nodeBounds(id)

    const parentId = g.parent(id)

    const children = (g.children(id) as NodeId[] | undefined ?? []).filter(c => !c.endsWith(PortSuffix))

    minX = Math.min(minX, position.x)
    minY = Math.min(minY, position.y)

    const navigateTo = scope ? ifind(element.scopedViews(), v => v.id !== scope.id)?.id ?? null : null

    const inheritFromNode = scope?.findNodeWithElement(element.id)
    const scopedAncestor = scope && !inheritFromNode
      ? ifind(element.ancestors(), a => !!scope.findNodeWithElement(a.id))?.id
      : null
    const inheritFromNodeOrAncestor = inheritFromNode ?? (scopedAncestor && scope?.findNodeWithElement(scopedAncestor))

    return exact({
      id: id as NodeId,
      parent: parentId as NodeId ?? null,
      x: position.x,
      y: position.y,
      title: element.title,
      description: preferSummary(element.$element) ?? null,
      technology: element.technology,
      tags: [...element.tags],
      links: null,
      color: inheritFromNodeOrAncestor?.color ?? element.color,
      shape: inheritFromNode?.shape ?? element.shape,
      icon: inheritFromNode?.icon ?? element.icon ?? 'none' as IconUrl,
      modelRef: element.id,
      kind: element.kind,
      level: nodeLevel(id),
      labelBBox: {
        x: position.x,
        y: position.y,
        width: width,
        height: height,
      },
      style: omit({
        ...(inheritFromNode ?? inheritFromNodeOrAncestor)?.style,
        ...element.$element.style,
      }, ['shape', 'color', 'icon']),
      navigateTo,
      ...(children.length > 0 && { depth: nodeDepth(id) }),
      children,
      width,
      height,
      column,
      ports: {
        in: sortedPorts(id, 'in', inPorts),
        out: sortedPorts(id, 'out', outPorts),
      },
    })
  })

  return {
    bounds: {
      x: Math.min(minX, 0),
      y: Math.min(minY, 0),
      width: g.graph().width ?? 100,
      height: g.graph().height ?? 100,
    },
    nodes,
    edges: g.edges().reduce((acc, e) => {
      const edge = g.edge(e)
      const ename = e.name
      if (!ename) {
        return acc
      }
      const { name, source, target, relationship, sourceHandle, targetHandle } = find(edges, e => e.name === ename)!
      const label = relationship.title ?? 'untitled'
      const navigateTo = relationship.navigateTo?.id ?? null
      const description = preferSummary(relationship.$relationship) ?? null
      const technology = relationship.technology ?? null
      acc.push({
        id: name as EdgeId,
        source: source as NodeId,
        sourceHandle,
        target: target as NodeId,
        targetHandle,
        label,
        color: relationship.color,
        description,
        ...(navigateTo && { navigateTo }),
        ...(technology && { technology }),
        points: edge.points.map(p => [p.x, p.y] as Point) as unknown as NonEmptyArray<Point>,
        line: relationship.line,
        relationId: relationship.id,
        parent: null,
      })
      return acc
    }, [] as LayoutResult.Edge[]),
  }
}
