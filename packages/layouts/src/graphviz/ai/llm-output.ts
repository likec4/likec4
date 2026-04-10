import { type ComputedView, type EdgeId, type NonEmptyArray, exact, nonNullable } from '@likec4/core'
import type { NodeId } from '@likec4/core/types'
import {
  filter,
  hasAtLeast,
  isTruthy,
  map,
  mapKeys,
  pipe,
  unique,
} from 'remeda'
import * as z from 'zod/v4'
import type { prepareLLMInput } from './llm-input'
import { logger } from './logger'
import type { AIEnforcementEdge, AiLayoutHints } from './types'

const direction = z.enum(['TB', 'BT', 'LR', 'RL'])

const nodeId = z.string().nonempty().brand<'NodeId'>()

const rank = z.enum(['same', 'source', 'sink', 'min', 'max'])

const nodesWithRank = z.object({
  rank: rank,
  nodes: z.array(nodeId),
})

const edge = {
  id: z.string().nonempty().brand<'EdgeId'>(),
  weight: z.coerce.number().int().min(0).max(20),
  minlen: z.coerce.number().int().min(0).max(4),
}

const invisibleEdge = z
  .object({
    source: nodeId,
    target: nodeId,
    weight: edge.weight.optional(),
    minlen: edge.minlen.optional(),
  })

const responseSchema = z
  .object({
    direction: direction.optional(),
    ranks: z.array(nodesWithRank).default([]),
    edgeWeight: z
      .record(edge.id, edge.weight)
      .default({}),
    edgeMinlen: z
      .record(edge.id, edge.minlen)
      .default({}),
    reverseRank: z.array(edge.id).default([]),
    excludeFromRanking: z.array(edge.id).default([]),
    edgeOrder: z.array(edge.id).default([]),
    nodeOrder: z.array(nodeId).default([]),
    invisibleEdges: z
      .array(invisibleEdge)
      .default([]),
    reasoning: z.string().default(''),
  })

type LLMOutput = z.infer<typeof responseSchema>

/**
 * Extract JSON from a string that may contain markdown code fences.
 */
const jsonRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/
function extractJson(text: string): string {
  const match = jsonRegex.exec(text)
  if (match && match[1]) {
    return match[1]
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
 * Returns undefined on any failure (malformed JSON, invalid structure, etc.)
 * @param response - The raw text response from the LLM, potentially containing JSON with layout hints
 */
export function parseOutput(
  response: string,
  params: {
    view: ComputedView
    mapping: ReturnType<typeof prepareLLMInput>['mapping']
  },
): AiLayoutHints | undefined {
  try {
    const jsonStr = extractJson(response)
    const parsed = JSON.parse(jsonStr)
    logger.trace`Parsed LLM response: ${parsed}`
    const result = responseSchema.safeParse(parsed)
    if (!result.success) {
      logger.warn('Failed to validate LLM response\n' + z.prettifyError(result.error))
      return undefined
    }
    return restoreIdsAndMapToHints(result.data, params)
  } catch (error) {
    logger.warn('Failed to parse LLM response\n{response}', { error, response })
    return undefined
  }
}

/**
 * Restore original NodeIds and EdgeIds in the parsed response using the mapping from serialization.
 * Filters out any hints that reference nodes/edges not present in the original view.
 */
function restoreIdsAndMapToHints(
  parsed: LLMOutput,
  params: {
    view: ComputedView
    mapping: ReturnType<typeof prepareLLMInput>['mapping']
  },
): AiLayoutHints {
  const { mapping } = params
  const nodeId = (id: string & z.$brand<'NodeId'>): NodeId =>
    nonNullable(mapping.nodes[id]?.id, `Unknown node ID ${id} in LLM output`)
  const mapToNodeId = (ids: (string & z.$brand<'NodeId'>)[]) => ids.map(nodeId)

  const edgeId = (id: string & z.$brand<'EdgeId'>): EdgeId =>
    nonNullable(mapping.edges[id]?.id, `Unknown edge ID ${id} in LLM output`)

  const mapToNonEmpty = <A, O>(ids: A[], fn: (id: A) => O): NonEmptyArray<O> | undefined => {
    const result = map(ids, fn)
    return hasAtLeast(result, 1) ? result : undefined
  }

  const excludeFromRanking = pipe(
    parsed.excludeFromRanking,
    map(edgeId),
    unique(),
    x => hasAtLeast(x, 1) ? x : undefined,
  )

  const reverseRank = pipe(
    parsed.reverseRank,
    map(edgeId),
    unique(),
    x => hasAtLeast(x, 1) ? x : undefined,
  )

  const ranks = pipe(
    parsed.ranks,
    map(r => {
      const nodes = mapToNodeId(r.nodes)
      if (hasAtLeast(nodes, 1)) {
        return {
          rank: r.rank,
          nodes,
        }
      }
      return null
    }),
    filter(isTruthy),
  )

  const invisibleEdges = mapToNonEmpty(
    parsed.invisibleEdges,
    ({ source, target, minlen = 1, weight = 1 }): AIEnforcementEdge =>
      exact({
        weight: weight !== 1 ? weight : undefined,
        minlen: minlen !== 1 ? minlen : undefined,
        source: nodeId(source),
        target: nodeId(target),
      }),
  )

  return exact({
    direction: parsed.direction,
    ranks,
    edgeWeight: mapKeys(parsed.edgeWeight, edgeId),
    edgeMinlen: mapKeys(parsed.edgeMinlen, edgeId),
    excludeFromRanking,
    reverseRank,
    edgeOrder: mapToNonEmpty(parsed.edgeOrder, edgeId),
    nodeOrder: mapToNonEmpty(parsed.nodeOrder, nodeId),
    invisibleEdges,
    reasoning: parsed.reasoning,
  })
}
