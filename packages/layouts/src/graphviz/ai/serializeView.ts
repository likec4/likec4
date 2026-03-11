import { DefaultMap } from '@likec4/core'
import {
  type ComputedEdge,
  type ComputedNode,
  type ComputedView,
  type EdgeId,
  flattenMarkdownOrString,
  NodeId,
} from '@likec4/core/types'
import { fromEntries, isNonNull } from 'remeda'

interface SerializedNode {
  id: string
  kind: string
  title: string
  parent?: string
  inEdges?: string[]
  outEdges?: string[]
  level: number
}

interface SerializedContainer {
  id: string
  kind: string
  title: string
  parent?: string
  children: string[]
  // nested: string[]
  // inEdges?: string[]
  // outEdges?: string[]
  level: number
}

interface SerializedEdge {
  id: string
  label: string | null
}

export interface SerializedView {
  direction: string
  containers: SerializedContainer[]
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}

function truncate(str: string, maxLen: number = 40): string {
  str = str.replaceAll(/\n/g, ' ').trim()
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '\u2026'
}

/**
 * When serializing for the LLM, we map internal NodeIds and EdgeIds to simple strings (n1, n2, e1, e2) to keep the JSON compact.
 * SerializedResult provides the reverse mapping for later interpretation of LLM output.
 */
type SerializedResult = {
  serialized: SerializedView
  mapping: {
    nodes: Record<string, NodeId>
    edges: Record<string, EdgeId>
  }
}

function mappedEntries<T>(_map: DefaultMap<T, string>): Record<string, T> {
  const res = {} as Record<string, T>
  for (const [k, v] of _map.entries()) {
    res[v] = k
  }
  return res
}

function edgeLabel(edge: ComputedEdge): string | null {
  const label = edge.label ?? edge.technology ?? flattenMarkdownOrString(edge.description)
  return label && label !== '[...]' ? truncate(label) : null
}

/**
 * Serialize a ComputedView into a compact, LLM-friendly JSON string.
 * Strips cosmetic data (colors, icons, descriptions, styles) and keeps
 * only structural information relevant to layout decisions.
 *
 * Maps NodeIds and EdgeIds to simple strings (n1, n2, e1, e2) to keep the JSON compact.
 */
export function serializeViewForPrompt(view: ComputedView): SerializedResult {
  let seq = 1
  const nodeIds = new DefaultMap((_key: NodeId) => `n${seq++}`)
  const nodeId = (id: NodeId) => nodeIds.get(id)
  const leafs = new Set<NodeId>()

  // Pre-populate node IDs and identify leaf nodes
  view.nodes.forEach(n => {
    nodeIds.get(n.id)
    if (n.children.length === 0) {
      leafs.add(n.id)
    }
  })

  const findNodeById = (id: string) => view.nodes.find(n => n.id === id)!

  const nestedOf = new DefaultMap((key: ComputedNode): Array<NodeId> => {
    return key.children.flatMap(childId => {
      const child = findNodeById(childId)
      return [childId, ...nestedOf.get(child)]
    })
  })

  const edgesBetweenLeafs = view.edges.filter(e => leafs.has(e.source) && leafs.has(e.target))

  const edgeId = (edge: ComputedEdge) => {
    const source = nodeId(edge.source)
    const target = nodeId(edge.target)
    return `${source}->${target}`
  }
  const findEdgeById = (edgeId: string) => {
    const edge = view.edges.find(e => e.id === edgeId)
    if (edge && leafs.has(edge.source) && leafs.has(edge.target)) {
      return edge
    }
    return null
  }

  const edges = edgesBetweenLeafs
    .map((e): SerializedEdge => ({
      id: edgeId(e),
      label: edgeLabel(e),
    }))

  const serializeNode = (acc: SerializedView, nd: ComputedNode) => {
    const { id, parent, ...node } = nd
    const isLeaf = node.children.length === 0
    const inEdges = node.inEdges.map(findEdgeById).filter(isNonNull).map(edgeId)
    const outEdges = node.outEdges.map(findEdgeById).filter(isNonNull).map(edgeId)
    if (!isLeaf) {
      acc.containers.push({
        id: nodeId(id),
        kind: node.kind,
        title: truncate(node.title),
        ...(parent && { parent: nodeId(parent) }),
        children: node.children.map(nodeId),
        // nested: nestedOf.get(nd).map(nodeId),
        ...(inEdges.length > 0 && { inEdges }),
        ...(outEdges.length > 0 && { outEdges }),
        level: node.level,
      })
      return acc
    }

    acc.nodes.push({
      id: nodeId(id),
      kind: node.kind,
      title: truncate(node.title),
      ...(parent && { parent: nodeId(parent) }),
      ...(inEdges.length > 0 && { inEdges }),
      ...(outEdges.length > 0 && { outEdges }),
      level: node.level,
    })

    return acc
  }

  const serialized: SerializedView = view.nodes.reduce(serializeNode, {
    direction: view.autoLayout.direction,
    containers: [],
    nodes: [],
    edges,
  })
  return {
    serialized,
    mapping: {
      nodes: mappedEntries(nodeIds),
      edges: fromEntries(edgesBetweenLeafs.map(e => [edgeId(e), e.id])),
    },
  }
}
