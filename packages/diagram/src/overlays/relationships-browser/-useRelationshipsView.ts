import { computeRelationshipsView } from '@likec4/core'
import type {
  DiagramEdge,
  DiagramNode,
  DiagramView,
  EdgeId,
  ElementKind,
  Fqn,
  IconUrl,
  NodeId,
  Point,
  ViewId,
} from '@likec4/core/types'
import { useMemo } from 'react'

import dagre, { type EdgeConfig, type GraphLabel } from '@dagrejs/dagre'
import type { ElementModel, RelationshipModel } from '@likec4/core'
import {
  DefaultMap,
  invariant,
  isAncestor,
  isDescendantOf,
  nonNullable,
  sortParentsFirst,
  toArray,
} from '@likec4/core'
import {
  concat,
  filter,
  find,
  forEachObj,
  groupBy,
  hasAtLeast,
  map,
  mapToObj,
  only,
  pipe,
  prop,
  reduce,
  sortBy,
  tap,
} from 'remeda'
import { useLikeC4Model } from '../../likec4model/useLikeC4Model'
import type { RelationshipsBrowserTypes } from './_types'

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
type NodeData = {
  column: RelationshipsBrowserTypes.Column
  portId: string
  element: ElementModel | null
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

function treeFromElements(elements: Iterable<ElementModel>) {
  const sorted = sortParentsFirst([...elements]) as ReadonlyArray<ElementModel>
  const root = new Set(sorted)
  const map = new Map(sorted.map(e => [e.id, e]))
  const parents = new DefaultMap<ElementModel, ElementModel | null>(() => null)
  const children = sorted.reduce((acc, parent, index, all) => {
    acc.set(
      parent,
      all
        .slice(index + 1)
        .filter(isDescendantOf(parent))
        .map(e => {
          root.delete(e)
          return e
        })
        .reduce((acc, el) => {
          if (!acc.some(isAncestor(el))) {
            acc.push(el)
            parents.set(el, parent)
          }
          return acc
        }, [] as ElementModel[]),
    )
    return acc
  }, new DefaultMap<ElementModel, ElementModel[]>(() => []))

  return {
    sorted,
    byId: (id: string) => nonNullable(map.get(id as Fqn), `Element not found by id: ${id}`),
    root: root as ReadonlySet<ElementModel>,
    parent: (el: ElementModel) => parents.get(el),
    children: (el: ElementModel): ReadonlyArray<ElementModel> => children.get(el),
  }
}

function createNodes(
  column: RelationshipsBrowserTypes.Column,
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

export type RelationshipsViewData = {
  incomers: ReadonlySet<ElementModel>
  incoming: ReadonlySet<RelationshipModel>
  subjects: ReadonlySet<ElementModel>
  outgoing: ReadonlySet<RelationshipModel>
  outgoers: ReadonlySet<ElementModel>
}

export type LayoutRelationshipsViewResult = {
  nodes: LayoutRelationshipsViewResult.Node[]
  edges: LayoutRelationshipsViewResult.Edge[]
  bounds: DiagramView['bounds']
}

export namespace LayoutRelationshipsViewResult {
  export const Empty = '@empty' as ElementKind

  export type Node = DiagramNode & {
    column: RelationshipsBrowserTypes.Column
    ports: RelationshipsBrowserTypes.Ports
  }
  export type Edge = DiagramEdge & {
    sourceHandle: string
    targetHandle: string
    // column: RelationshipsBrowserTypes.Column
  }
}

export function layoutRelationshipsView(data: RelationshipsViewData): LayoutRelationshipsViewResult {
  const g = createGraph()

  const incomers = createNodes('incomers', data.incomers, g),
    subjects = createNodes('subjects', data.subjects, g),
    outgoers = createNodes('outgoers', data.outgoers, g)

  const edges = [] as Array<{
    name: string
    source: string // node id
    target: string // node id
    sourceHandle: string
    targetHandle: string
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

      g.node(source.id).outPorts.push(target.id)
      g.node(target.id).inPorts.push(source.id)

      g.setEdge(source.portId, target.portId, {
        ...Sizes.edgeLabel,
      }, name)
      edges.push({
        name,
        source: source.id,
        sourceHandle: source.id + '_out' + (g.node(source.id).outPorts.length - 1),
        target: target.id,
        targetHandle: target.id + '_in' + (g.node(target.id).inPorts.length - 1),
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

  const nodeIds = [
    ...incomers.graphNodes.values(),
    ...subjects.graphNodes.values(),
    ...outgoers.graphNodes.values(),
  ]

  if (incomers.graphNodes.size == 0) {
    const id = 'incomers-empty'
    g.setNode(id, {
      column: 'incomers',
      element: null,
      isCompound: false,
      portId: id,
      inPorts: [],
      outPorts: [],
      width: Sizes.nodeWidth,
      height: Sizes.nodeHeight,
    })
    for (const subjectNode of subjects.graphNodes.values()) {
      g.setEdge(id, subjectNode.portId)
    }
    nodeIds.push({
      id,
      portId: id,
    })
  }
  if (outgoers.graphNodes.size == 0) {
    const id = 'outgoers-empty'
    g.setNode(id, {
      column: 'outgoers',
      element: null,
      isCompound: false,
      portId: id,
      inPorts: [],
      outPorts: [],
      width: Sizes.nodeWidth,
      height: Sizes.nodeHeight,
    })
    for (const subjectNode of subjects.graphNodes.values()) {
      g.setEdge(subjectNode.portId, id)
    }
    nodeIds.push({
      id,
      portId: id,
    })
  }

  const edgeCount = g.edgeCount()
  if (edgeCount > 10) {
    for (const edge of g.edges()) {
      g.setEdge(edge, {
        ...Sizes.edgeLabel,
        width: edgeCount > 30 ? 800 : 400,
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

  const [subject] = [...subjects.root]
  invariant(subject, 'Subjects should not be empty')
  let subjectBounds = nodeBounds(subjects.graphNodes.get(subject.id).id)
  // let subjectBounds = rest.reduce((bounds, el) => {
  //   const elBounds = nodeBounds(subjects.graphNodes.get(el.id).id)
  //   return {
  //     position: {
  //       x: Math.min(bounds.position.x, elBounds.position.x),
  //       y: Math.min(bounds.position.y, elBounds.position.y),
  //     },
  //     width: Math.max(bounds.width, elBounds.width),
  //     height: Math.max(bounds.height, elBounds.height),
  //   }
  // }, nodeBounds(subjects.graphNodes.get(subject.id).id))

  const nodes = nodeIds.map(({ id }): LayoutRelationshipsViewResult.Node => {
    const { element, inPorts, outPorts, column } = g.node(id)
    let { position, width, height } = nodeBounds(id)

    if (!element) {
      height = Math.min(subjectBounds.height, 300)
      position.y = subjectBounds.position.y + subjectBounds.height / 2 - height / 2
      if (column === 'incomers') {
        width = subjectBounds.position.x - Sizes.emptyNodeOffset - position.x
      } else {
        const rightX = position.x + width!
        position.x = subjectBounds.position.x + subjectBounds.width + Sizes.emptyNodeOffset
        width = rightX - position.x
      }
      return {
        id: id as NodeId,
        parent: null,
        position: [position.x, position.y],
        title: 'empty node',
        description: null,
        technology: null,
        tags: null,
        links: null,
        color: 'muted',
        shape: 'rectangle',
        style: {
          border: 'dashed',
          opacity: 50,
        },
        kind: LayoutRelationshipsViewResult.Empty,
        level: 0,
        labelBBox: {
          x: position.x,
          y: position.y,
          width: width,
          height: height,
        },
        inEdges: [],
        outEdges: [],
        children: [],
        width,
        height,
        column,
        ports: {
          in: [],
          out: [],
        },
      }
    }
    const parentId = g.parent(id)

    const children = (g.children(id) as NodeId[] | undefined ?? []).filter(c => !c.endsWith(PortSuffix))

    minX = Math.min(minX, position.x)
    minY = Math.min(minY, position.y)

    const navigateTo = element.defaultView?.id ?? null

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
      icon: element.icon ?? 'none' as IconUrl,
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
      navigateTo,
      inEdges: [],
      outEdges: [],
      ...(children.length > 0 && { depth: nodeDepth(id) }),
      children,
      width,
      height,
      column,
      ports: {
        in: sortedPorts(id, 'in', inPorts),
        out: sortedPorts(id, 'out', outPorts),
      },
    }
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
      const { name, source, target, relations, sourceHandle, targetHandle } = find(edges, e => e.name === ename)!
      const onlyRelation = only(relations)
      const label = onlyRelation?.title ?? 'untitled'
      const isMultiple = relations.length > 1
      const points = edge.points.map(p => [p.x, p.y] as Point)
      if (!hasAtLeast(points, 1)) {
        return acc
      }
      const navigateTo = onlyRelation?.navigateTo?.id ?? null
      // edge.points
      // const edge = g.edge(name)
      acc.push({
        id: name as EdgeId,
        source: source as NodeId,
        sourceHandle,
        target: target as NodeId,
        targetHandle,
        label: isMultiple ? `${relations.length} relationships` : label,
        relations: relations.map(r => r.id),
        parent: null,
        points,
        ...(navigateTo && { navigateTo }),
        head: 'normal',
        tail: 'none',
        line: onlyRelation?.$relationship.line ?? 'dashed',
      })
      return acc
    }, [] as LayoutRelationshipsViewResult.Edge[]),
  }
}

export function useRelationshipsView(fqn: Fqn) {
  const model = useLikeC4Model(true)
  return useMemo(() => {
    return {
      id: `relationships-${fqn}` as ViewId,
      title: `Relationships of ${fqn}`,
      description: null,
      autoLayout: {
        direction: 'LR',
      },
      tags: null,
      links: null,
      hash: 'empty',
      customColorDefinitions: {},
      ...layoutRelationshipsView(computeRelationshipsView(fqn, model)),
    }
  }, [model, fqn, computeRelationshipsView])
}
