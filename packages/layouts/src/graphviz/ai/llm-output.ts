import { type ComputedView, type NonEmptyArray, exact, nonNullable } from '@likec4/core'
import { filter, hasAtLeast, isNonNullish, map, mapKeys, pickBy } from 'remeda'
import * as z from 'zod/v4'
import type { prepareViewForPrompt } from './llm-input'
import { logger } from './logger'
import type { AIEnforcementEdge, AiLayoutHints } from './types'

const direction = z.enum(['TB', 'BT', 'LR', 'RL'])

const nodeId = z.string().nonempty().brand<'NodeId'>()
const edgeId = z.string().nonempty().brand<'EdgeId'>()

const rank = z.enum(['same', 'source', 'sink'])

const nodesWithRank = z.object({
  rank: rank,
  nodes: z.array(nodeId),
})

const edgeAttrs = {
  weight: z.coerce.number().int().min(0).max(20),
  minlen: z.coerce.number().int().min(0).max(3),
}

const invisibleEdge = z
  .object({
    source: nodeId,
    target: nodeId,
    weight: edgeAttrs.weight.default(1),
    minlen: edgeAttrs.minlen.default(1),
  })
  .transform(pickBy(isNonNullish))

const responseSchema = z
  .object({
    direction: direction.optional(),
    ranks: z.array(nodesWithRank).default([]),
    edgeWeight: z.record(edgeId, edgeAttrs.weight.default(1)).default({}),
    edgeMinlen: z.record(edgeId, edgeAttrs.minlen.default(1)).default({}),
    excludeFromRanking: z.array(edgeId).default([]),
    edgeOrder: z.array(edgeId).default([]),
    nodeOrder: z.array(nodeId).default([]),
    invisibleEdges: z
      .array(invisibleEdge.nullable().catch(null))
      .default([])
      .transform(filter(isNonNullish)),
    reasoning: z.string(),
  })
  .transform(pickBy(isNonNullish))

// const edgeattrs = z
//   .object({
//     weight: z.coerce.number().int().min(0).max(100),
//     minlen: z.coerce.number().int().min(0).max(20),
//     constraint: z.boolean(),
//   })
//   .partial()

// const edgeHintSchema = edgeattrs
//   .extend({
//     id: edgeId,
//   })
//   .refine(data => data.weight !== undefined || data.minlen !== undefined || data.constraint !== undefined, {
//     message: 'At least one of weight, minlen, or constraint must be specified',
//   })
//   .transform(pickBy(isNonNullish))

// // const enforcementSchema = edgeattrs
// //   .extend({
// //     source: nodeId,
// //     target: nodeId,
// //   })
// //   .transform(pickBy(isNonNullish))

// const responseSchema = z.object({
//   direction: direction.optional().catch(undefined),
//   edges: z
//     .array(
//       edgeHintSchema.nullable().catch(null),
//     )
//     .default([])
//     .transform(filter(isNonNullish)),
//   sources: z.array(nodeId).catch([]),
//   sinks: z.array(nodeId).catch([]),
//   enforcements: z
//     .array(edgeHintSchema.nullable().catch(null))
//     .default([])
//     .transform(filter(isNonNullish)),
//   reasoning: z.string().default(''),
// }).refine(
//   (data) => {
//     return (data.sources.length === 0 && data.sinks.length === 0) || (data.edges.length > 0) ||
//       data.enforcements.length > 0
//   },
//   {
//     message: 'If sources or sinks are provided, edges must also be provided',
//   },
// )

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
 * Returns null on any failure (malformed JSON, invalid structure, etc.)
 * @param response - The raw text response from the LLM, potentially containing JSON with layout hints
 */
export function parseOutput(response: string, params: {
  view: ComputedView
  mapping: ReturnType<typeof prepareViewForPrompt>['mapping']
}): AiLayoutHints | null {
  try {
    const jsonStr = extractJson(response)
    const parsed = JSON.parse(jsonStr)
    const result = responseSchema.safeParse(parsed, {})
    if (!result.success) {
      logger.warn('Failed to validate LLM response\n' + z.prettifyError(result.error))
      return null
    }
    logger.debug`LLM response: ${result.data}`
    return restoreIdsAndMapToHints(result.data, params)
  } catch (e) {
    logger.warn('Failed to parse LLM response', { error: e })
    return null
  }
}

const isNonEmptyRank = <I extends string[], R extends { nodes: I }>(
  rank: R,
): rank is Extract<R, { nodes: readonly [I, ...I[]] }> => rank.nodes.length > 0

/**
 * Restore original NodeIds and EdgeIds in the parsed response using the mapping from serialization.
 * Filters out any hints that reference nodes/edges not present in the original view.
 */
function restoreIdsAndMapToHints(
  parsed: z.infer<typeof responseSchema>,
  params: {
    view: ComputedView
    mapping: ReturnType<typeof prepareViewForPrompt>['mapping']
  },
): AiLayoutHints {
  const { mapping } = params
  const nodeId = (id: string & z.$brand<'NodeId'>) => nonNullable(mapping.nodes[id]?.id)
  const mapToNodeId = (ids: (string & z.$brand<'NodeId'>)[]) => ids.map(nodeId)

  const edgeId = (id: string & z.$brand<'EdgeId'>) => nonNullable(mapping.edges[id]?.id)

  const mapToNonEmpty = <A, O>(ids: A[], fn: (id: A) => O): NonEmptyArray<O> | undefined => {
    const result = map(ids, fn)
    return hasAtLeast(result, 1) ? result : undefined
  }

  return exact({
    direction: parsed.direction,
    ranks: parsed.ranks
      .map(({ rank, nodes }) => ({
        rank,
        nodes: mapToNodeId(nodes),
      }))
      .filter(isNonEmptyRank),
    edgeWeight: mapKeys(parsed.edgeWeight, edgeId),
    edgeMinlen: mapKeys(parsed.edgeMinlen, edgeId),
    excludeFromRanking: new Set(map(parsed.excludeFromRanking, edgeId)),
    edgeOrder: mapToNonEmpty(parsed.edgeOrder, edgeId),
    nodeOrder: mapToNonEmpty(parsed.nodeOrder, nodeId),
    invisibleEdges: mapToNonEmpty(parsed.invisibleEdges, (edge): AIEnforcementEdge => ({
      ...edge,
      source: nodeId(edge.source),
      target: nodeId(edge.target),
    })),
    reasoning: parsed.reasoning,
  })

  // const sources = mapToNodeId(parsed.sources)
  // const sinks = mapToNodeId(parsed.sinks)

  // const edges = pipe(
  //   parsed.edges,
  //   flatMap(edge => {
  //     const id = edgeId(edge.id)
  //     return id ? { ...edge, id } : []
  //   }),
  // )

  // if (parsed.enforcements.length === 0) {
  //   return exact({
  //     ...parsed,
  //     enforcements: [],
  //     edges,
  //     sources,
  //     sinks,
  //   })
  // }

  // const edgeKey = (e: { source: string; target: string }) => `${e.source}->${e.target}`
  // const existing = new Set(view.edges.map(edgeKey))

  // const enforcements = pipe(
  //   parsed.enforcements,
  //   flatMap(({ id, ...enforcement }) => {
  //     const [sourceId, targetId] = id.split('->')
  //     if (!sourceId || !targetId) {
  //       return []
  //     }
  //     const source = nodeId(sourceId as string & z.$brand<'NodeId'>)
  //     const target = nodeId(targetId as string & z.$brand<'NodeId'>)
  //     if (source && target) {
  //       return {
  //         ...enforcement,
  //         source,
  //         target,
  //       }
  //     }
  //     return []
  //   }),
  //   // Filter out enforcements, if there are already edges between the nodes
  //   filter(enforcement => !existing.has(edgeKey(enforcement))),
  // )
  // return exact({
  //   ...parsed,
  //   enforcements,
  //   edges,
  //   sources,
  //   sinks,
  // })
}
