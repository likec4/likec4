import { type ComputedView, exact, nonNullable } from '@likec4/core'
import { logger } from '@likec4/log'
import { isNonNullish, mapKeys, pickBy } from 'remeda'
import * as z from 'zod/v4'
import type { serializeViewForPrompt } from './serializeView'
import type { AISuggestedLayoutHints } from './types'

const direction = z.enum(['TB', 'BT', 'LR', 'RL'])

const nodeId = z.string().nonempty().brand<'NodeId'>()
const edgeId = z.string().nonempty().brand<'EdgeId'>()

const rank = z.enum(['same', 'source', 'sink'])

const nodesWithRank = z.object({
  rank: rank,
  nodes: z.array(nodeId),
})

const responseSchema = z
  .object({
    direction: direction.optional(),
    ranks: z.array(nodesWithRank).default([]),
    edgeWeight: z.record(edgeId, z.number().int().min(0).max(100)).default({}),
    edgeMinlen: z.record(edgeId, z.number().int().min(0).max(3)).default({}),
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
export function parseResponse(response: string, params: {
  view: ComputedView
  mapping: ReturnType<typeof serializeViewForPrompt>['mapping']
}): AISuggestedLayoutHints | null {
  const log = logger.getChild('parser')
  try {
    const jsonStr = extractJson(response)
    const parsed = JSON.parse(jsonStr)
    const result = responseSchema.safeParse(parsed, {})
    if (!result.success) {
      logger.warn('Failed to parse LLM response', { error: z.prettifyError(result.error) })
      return null
    }
    console.log('---Parsed Data---')
    console.log(JSON.stringify(result.data, null, 2))
    console.log('---End Parsed Data---')
    return restoreIdsAndMapToHints({
      ...params,
      parsed: result.data,
    })
  } catch (e) {
    log.warn('Failed to parse LLM response', { error: e })
    return null
  }
}

/**
 * Restore original NodeIds and EdgeIds in the parsed response using the mapping from serialization.
 * Filters out any hints that reference nodes/edges not present in the original view.
 */
function restoreIdsAndMapToHints(params: {
  parsed: z.infer<typeof responseSchema>
  view: ComputedView
  mapping: ReturnType<typeof serializeViewForPrompt>['mapping']
}): AISuggestedLayoutHints {
  const { parsed, mapping, view } = params
  const nodeId = (id: string & z.$brand<'NodeId'>) => nonNullable(mapping.nodes[id]?.id)
  const mapToNodeId = (ids: (string & z.$brand<'NodeId'>)[]) => ids.map(nodeId)

  const edgeId = (id: string & z.$brand<'EdgeId'>) => nonNullable(mapping.edges[id]?.id)

  return exact({
    direction: parsed.direction,
    ranks: parsed.ranks.map(rank => ({
      ...rank,
      nodes: mapToNodeId(rank.nodes),
    })),
    edgeWeight: mapKeys(parsed.edgeWeight, edgeId),
    edgeMinlen: mapKeys(parsed.edgeMinlen, edgeId),
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
