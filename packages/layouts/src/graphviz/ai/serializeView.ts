import type { ComputedView } from '@likec4/core/types'

interface SerializedNode {
  id: string
  kind: string
  title: string
  parent: string | null
  children: string[]
  level: number
  shape: string
}

interface SerializedEdge {
  id: string
  source: string
  target: string
  label: string | null
}

export interface SerializedView {
  viewId: string
  direction: string
  nodeCount: number
  edgeCount: number
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '\u2026'
}

/**
 * Serialize a ComputedView into a compact, LLM-friendly JSON string.
 * Strips cosmetic data (colors, icons, descriptions, styles) and keeps
 * only structural information relevant to layout decisions.
 */
export function serializeViewForPrompt(view: ComputedView): string {
  const serialized: SerializedView = {
    viewId: view.id,
    direction: view.autoLayout.direction,
    nodeCount: view.nodes.length,
    edgeCount: view.edges.length,
    nodes: view.nodes.map(n => ({
      id: n.id,
      kind: n.kind,
      title: truncate(n.title, 40),
      parent: n.parent,
      children: n.children.slice(),
      level: n.level,
      shape: n.shape,
    })),
    edges: view.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ? truncate(e.label, 40) : null,
    })),
  }
  return JSON.stringify(serialized, null, 2)
}
