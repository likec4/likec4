import { DefaultMap } from '@likec4/core'
import {
  type ComputedEdge,
  type ComputedNode,
  type ComputedView,
  exact,
  flattenMarkdownOrString,
  NodeId,
} from '@likec4/core/types'
import { isEmptyish } from 'remeda'
import type * as z from 'zod/v4'
import { logger } from './logger'

type NodeIdSerialized = `n${number}` & z.$brand<'NodeId'>
type EdgeIdSerialized = `e${number}` & z.$brand<'EdgeId'>
type CompoundIdSerialized = `c${number}` & z.$brand<'NodeId'>

interface SerializedNode {
  id: NodeIdSerialized
  kind: string
  title: string
  description?: string
  parent?: CompoundIdSerialized
  level: number
}

interface SerializedCompound {
  id: CompoundIdSerialized
  kind: string
  title: string
  parent?: CompoundIdSerialized
  children: Array<CompoundIdSerialized | NodeIdSerialized>
  level: number
}

interface SerializedEdge {
  id: EdgeIdSerialized
  source: NodeIdSerialized
  target: NodeIdSerialized
  parent?: CompoundIdSerialized
  label?: string
}

export interface SerializedView {
  direction: string
  compounds: SerializedCompound[]
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}

function truncate(str: string, maxLen: number = 100): string {
  str = str.replaceAll(/\n/g, ' ').trim()
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '\u2026'
}

/**
 * When serializing for the LLM, we map internal NodeIds and EdgeIds to simple strings (n1, n2, e1, e2) to keep the JSON compact.
 * LLMInput provides the reverse mapping for later interpretation of LLM output.
 */
type LLMInput = {
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

function edgeLabel(edge: ComputedEdge): string | undefined {
  const label = edge.label ?? flattenMarkdownOrString(edge.description) ?? edge.technology
  return label && label !== '[...]' ? truncate(label) : undefined
}

/**
 * Serialize a ComputedView into a compact, LLM-friendly JSON string.
 * Strips cosmetic data (colors, icons, descriptions, styles) and keeps
 * only structural information relevant to layout decisions.
 *
 * Maps NodeIds and EdgeIds to simple strings (n1, n2, e1, e2) to keep the JSON compact.
 */
export function prepareViewForPrompt(view: ComputedView): LLMInput {
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

  // Filter edges between leaf nodes and create serialized edges
  const edges = view.edges.map((e): SerializedEdge => {
    let source = nodeId(e.source) as NodeIdSerialized
    let target = nodeId(e.target) as NodeIdSerialized
    const parent = e.parent ? nodeId(e.parent) as CompoundIdSerialized : null
    if (e.dir === 'back') {
      ;[source, target] = [target, source]
    }
    return ({
      id: edgeIds.get(e),
      label: edgeLabel(e),
      ...(parent && { parent }),
      source,
      target,
    })
  })

  const serializeNode = (acc: SerializedView, nd: ComputedNode) => {
    const { id, parent, level, ...node } = nd
    const isCompound = node.children.length > 0

    if (isCompound) {
      acc.compounds.push(exact({
        id: nodeId(id) as CompoundIdSerialized,
        kind: node.kind,
        title: truncate(node.title),
        parent: parent ? (nodeId(parent) as CompoundIdSerialized) : undefined,
        children: node.children.map(nodeId),
        level,
      }))
      return acc
    }

    const description = truncate(flattenMarkdownOrString(node.description) ?? '', 200)

    acc.nodes.push(
      exact({
        id: nodeId(id) as NodeIdSerialized,
        kind: node.kind,
        title: truncate(node.title),
        description: isEmptyish(description) ? undefined : description,
        parent: parent ? (nodeId(parent) as CompoundIdSerialized) : undefined,
        level,
      }),
    )

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
