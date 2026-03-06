import { type EdgeId, type NodeId, exact } from '@likec4/core/types'
import { identity, isNonNullish } from 'remeda'
import * as z from 'zod/v4'

/**
 * Graph-level layout hints
 */
export interface AIGraphHint {
  /** Override auto-layout direction */
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
  /** Override node separation in pixels */
  nodeSep?: number
  /** Override rank separation in pixels */
  rankSep?: number
}

/**
 * Rank group constraint produced by AI analysis.
 * Mirrors ComputedRankConstraint from core types.
 */
export interface AIRankConstraint {
  /** Graphviz rank type */
  type: 'same' | 'min' | 'max' | 'source' | 'sink'
  /** Node IDs that should share this rank */
  nodes: NodeId[]
}

/**
 * Per-node layout hint
 */
export interface AINodeHint {
  id: NodeId
  /** Group name — nodes with the same group are placed closer together */
  group: string
}

/**
 * Per-edge layout hint
 */
export interface AIEdgeHint {
  id: EdgeId
  /** Higher weight = shorter/straighter edge */
  weight?: number
  /** Minimum length in ranks */
  minlen?: number
  /** Whether this edge constrains rank assignment */
  constraint?: boolean
}

/**
 * Complete set of AI-generated layout hints.
 * This is the JSON schema the LLM must produce.
 */
export interface LayoutHints {
  /** Graph-level overrides */
  graph?: AIGraphHint
  /** Rank constraints (groups of nodes at same rank) */
  ranks?: AIRankConstraint[]
  /** Per-node hints */
  nodes?: AINodeHint[]
  /** Per-edge hints */
  edges?: AIEdgeHint[]
  /** LLM reasoning for debugging/display */
  reasoning?: string
}

// Use .catch(undefined) on fields where LLM may produce out-of-range values,
// so invalid fields are silently dropped instead of failing the entire parse.

const direction = z.enum(['TB', 'BT', 'LR', 'RL'])
const rankType = z.enum(['same', 'min', 'max', 'source', 'sink'])

const nodeId = z.string().nonempty().transform((id) => id as NodeId)
const edgeId = z.string().nonempty().transform((id) => id as EdgeId)

const AIGraphHintSchema = z
  .object({
    direction: direction,
    nodeSep: z.number().min(10).max(500).optional().catch(undefined),
    rankSep: z.number().min(10).max(500).optional().catch(undefined),
  })
  .transform((data): AIGraphHint => exact(data))

const AIRankConstraintSchema = z
  .object({
    type: rankType,
    nodes: z.array(nodeId).min(1),
  })
  .transform(identity()<AIRankConstraint>)

const AINodeHintSchema = z
  .object({
    id: nodeId,
    group: z.string(),
  })
  .transform(identity()<AINodeHint>)

const AIEdgeHintSchema = z
  .object({
    id: edgeId,
    weight: z.coerce.number().min(0).max(100).optional().catch(undefined),
    minlen: z.coerce.number().min(0).max(10).optional().catch(undefined),
    constraint: z.boolean().optional().catch(undefined),
  })
  .transform((data): AIEdgeHint => exact(data))

export const LayoutHintsSchema = z
  .object({
    graph: AIGraphHintSchema.optional().catch(undefined),
    ranks: z
      .array(AIRankConstraintSchema.nullable().catch(null))
      .transform(arr => {
        const filtered = arr.filter(isNonNullish)
        return filtered.length > 0 ? filtered : undefined
      }),
    nodes: z.array(AINodeHintSchema),
    edges: z.array(AIEdgeHintSchema),
    reasoning: z.string(),
  })
  .partial()
  .transform((data): LayoutHints => exact(data))

/**
 * Extract JSON from a string that may contain markdown code fences.
 */
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (match) {
    return match[1]!.trim()
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }
  return text.trim()
}

/**
 * Parse raw LLM text output into validated LayoutHints.
 * Returns null on any failure (malformed JSON, invalid structure, etc.)
 */
export function parseLayoutHints(raw: string): LayoutHints | null {
  try {
    const jsonStr = extractJson(raw)
    const parsed = JSON.parse(jsonStr)
    const result = LayoutHintsSchema.safeParse(parsed)
    if (!result.success) {
      return null
    }
    return result.data
  } catch {
    return null
  }
}
