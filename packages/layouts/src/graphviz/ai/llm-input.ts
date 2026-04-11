import { DefaultMap } from '@likec4/core'
import {
  type ComputedEdge,
  type ComputedNode,
  type ComputedView,
  exact,
  flattenMarkdownOrString,
  NodeId,
} from '@likec4/core/types'
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
  return str.slice(0, maxLen - 1) + '\u2026' // ellipsis at the end
}

/**
 * When serializing for the LLM, we map internal NodeIds and EdgeIds to simple strings (n1, n2, e1, e2) to keep the JSON compact.
 * LLMInput provides the reverse mapping for later interpretation of LLM output.
 */
export interface LLMInput {
  serialized: SerializedView
  mapping: {
    nodes: Readonly<Record<string & z.$brand<'NodeId'>, ComputedNode>>
    edges: Readonly<Record<string & z.$brand<'EdgeId'>, ComputedEdge>>
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
  let label = edge.label && edge.label !== '[...]' ? edge.label : undefined
  if (!label && edge.description) {
    label = flattenMarkdownOrString(edge.description)
  }
  label ??= edge.technology ?? undefined
  return label ? truncate(label) : undefined
}

/**
 * Serialize a ComputedView into a compact, LLM-friendly JSON string.
 * Strips cosmetic data (colors, icons, descriptions, styles) and keeps
 * only structural information relevant to layout decisions.
 *
 * Maps NodeIds and EdgeIds to simple strings (n1, n2, e1, e2) to keep the JSON compact.
 */
export function prepareLLMInput(view: ComputedView): LLMInput {
  let seqC = 1, seqN = 1
  const nodeIds = new DefaultMap((node: ComputedNode) =>
    node.children.length === 0 ? (`n${seqN++}` as NodeIdSerialized) : (`c${seqC++}` as CompoundIdSerialized)
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
    const label = edgeLabel(e)
    return ({
      id: edgeIds.get(e),
      ...(label && { label }),
      ...(parent && { parent }),
      source,
      target,
    })
  })

  const reduceNodes = (acc: SerializedView, nd: ComputedNode): SerializedView => {
    const { level, kind, ...node } = nd
    const id = nodeIds.get(nd)
    const isCompound = node.children.length > 0
    const parent = node.parent ? nodeId(node.parent) as CompoundIdSerialized : undefined
    const title = truncate(node.title)

    if (isCompound) {
      acc.compounds.push(exact({
        id: id as CompoundIdSerialized,
        title,
        parent,
        children: node.children.map(nodeId),
        level,
      }))
      return acc
    }

    const description = node.description ? truncate(flattenMarkdownOrString(node.description), 200) : undefined

    acc.nodes.push(
      exact({
        id: id as NodeIdSerialized,
        kind,
        title,
        description,
        parent,
        level,
      }),
    )

    return acc
  }

  const serialized: SerializedView = view.nodes.reduce(reduceNodes, {
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
