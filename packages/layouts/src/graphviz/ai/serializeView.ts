import { DefaultMap } from '@likec4/core'
import {
  type ComputedEdge,
  type ComputedNode,
  type ComputedView,
  flattenMarkdownOrString,
  NodeId,
} from '@likec4/core/types'
import { logger } from '@likec4/log'
import type * as z from 'zod/v4'

type NodeIdSerialized = `n${number}` & z.$brand<'NodeId'>
type EdgeIdSerialized = `e${number}` & z.$brand<'EdgeId'>
type CompoundIdSerialized = `c${number}` & z.$brand<'NodeId'>

interface SerializedNode {
  id: NodeIdSerialized
  kind: string
  title: string
  parent: CompoundIdSerialized | null
  level: number
}

interface SerializedCompound {
  id: CompoundIdSerialized
  kind: string
  title: string
  parent: CompoundIdSerialized | null
  children: Array<CompoundIdSerialized | NodeIdSerialized>
  level: number
}

interface SerializedEdge {
  id: EdgeIdSerialized
  source: NodeIdSerialized
  target: NodeIdSerialized
  label: string | null
}

export interface SerializedView {
  direction: string
  compounds: SerializedCompound[]
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
    nodes: Record<string & z.$brand<'NodeId'>, ComputedNode>
    edges: Record<string & z.$brand<'EdgeId'>, ComputedEdge>
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
  const nodeIds = new DefaultMap((node: ComputedNode) =>
    node.children.length === 0 ? (`n${seq++}` as NodeIdSerialized) : (`c${seq++}` as CompoundIdSerialized)
  )
  const findNodeById = (id: NodeId) => view.nodes.find(n => n.id === id)!
  const nodeId = (id: NodeId) => nodeIds.get(findNodeById(id))
  const leafs = new Set<NodeId>()

  // Pre-populate node IDs and identify leaf nodes
  view.nodes.forEach(n => {
    nodeIds.get(n)
    if (n.children.length === 0) {
      leafs.add(n.id)
    }
  })

  const nonLeafEdge = view.edges.find(e => !leafs.has(e.source) || !leafs.has(e.target))
  if (nonLeafEdge) {
    logger.error('Non-leaf edge found in view', {
      view: view.id,
      edge: { source: nonLeafEdge.source, target: nonLeafEdge.target },
    })
    throw new Error('Non-leaf edge found in view, this is not supported by the current implementation')
  }

  let edgeSeq = 1
  const edgeIds = new DefaultMap((_edge: ComputedEdge) => `e${edgeSeq++}` as EdgeIdSerialized)

  // const nestedOf = new DefaultMap((key: ComputedNode): Array<NodeId> => {
  //   return key.children.flatMap(childId => {
  //     const child = findNodeById(childId)
  //     return [childId, ...nestedOf.get(child)]
  //   })
  // })

  // const edgesBetweenLeafs =

  // const edgeId = (edge: ComputedEdge) => edgeIds.get(edge)

  // const findEdgeById = (edgeId: string) => {
  //   const edge = view.edges.find(e => e.id === edgeId)
  //   if (edge && leafs.has(edge.source) && leafs.has(edge.target)) {
  //     return edge
  //   }
  //   return null
  // }

  // Filter edges between leaf nodes and create serialized edges
  const edges = view.edges.map((e): SerializedEdge => {
    let source = nodeId(e.source) as NodeIdSerialized
    let target = nodeId(e.target) as NodeIdSerialized
    if (e.dir === 'back') {
      ;[source, target] = [target, source]
    }
    return ({
      id: edgeIds.get(e),
      label: edgeLabel(e),
      source,
      target,
    })
  })

  const serializeNode = (acc: SerializedView, nd: ComputedNode) => {
    const { id, parent, level, ...node } = nd
    const isLeaf = node.children.length === 0
    // const inEdges = node.inEdges.map(findEdgeById).filter(isNonNull).map(edgeId)
    // const outEdges = node.outEdges.map(findEdgeById).filter(isNonNull).map(edgeId)
    if (!isLeaf) {
      acc.compounds.push({
        id: nodeId(id) as CompoundIdSerialized,
        kind: node.kind,
        title: truncate(node.title),
        parent: parent ? nodeId(parent) as CompoundIdSerialized : null,
        children: node.children.map(nodeId),
        level,
      })
      return acc
    }

    acc.nodes.push({
      id: nodeId(id) as NodeIdSerialized,
      kind: node.kind,
      title: truncate(node.title),
      parent: parent ? nodeId(parent) as CompoundIdSerialized : null,
      level,
    })

    return acc
  }

  const serialized: SerializedView = view.nodes.reduce(serializeNode, {
    direction: view.autoLayout.direction,
    compounds: [],
    nodes: [],
    edges,
  })
  return {
    serialized,
    mapping: {
      nodes: mappedEntries(nodeIds),
      edges: mappedEntries(edgeIds),
    },
  }
}
