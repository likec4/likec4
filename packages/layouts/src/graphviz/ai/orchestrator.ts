import { type ComputedView, exact } from '@likec4/core/types'
import { filter, flatMap, isNonNull, pipe } from 'remeda'
import type z from 'zod/v4'
import { logger } from './logger'
import { LAYOUT_SYSTEM_PROMPT, LAYOUT_USER_PROMPT } from './prompt'
import type { AILayoutProvider } from './provider'
import { parseResponse } from './response'
import { serializeViewForPrompt } from './serializeView'
import type { LayoutHints } from './types'

const prompts = {
  systemPrompt: LAYOUT_SYSTEM_PROMPT,
  userPrompt: LAYOUT_USER_PROMPT,
}

/**
 * Orchestrate the AI layout enhancement pipeline:
 * serialize view → build prompt → call LLM → parse hints.
 *
 * Returns null (never throws) on any failure — layout falls back to plain Graphviz.
 */
export async function enhanceLayoutWithAI(
  view: ComputedView,
  provider: AILayoutProvider,
  signal?: AbortSignal,
): Promise<LayoutHints | null> {
  const label = `------ai-layout-${view.id}-------`
  console.time(label)
  try {
    logger.debug`generating AI layout hints for ${view.id} using ${provider.name}`

    const { serialized, mapping } = serializeViewForPrompt(view)

    const rawResponse = await provider.sendRequest(
      {
        ...prompts,
        diagram: serialized,
      },
      signal,
    )
    console.timeEnd(label)

    // logger.debug('AI response generated: ' + rawResponse)
    const parsed = parseResponse(rawResponse)

    if (!parsed) {
      logger.warn`AI response could not be parsed for view ${view.id}`
      return null
    }

    return restoreIdsAndMapToHints({ parsed, mapping, view })
  } catch (error) {
    console.timeEnd(label)
    logger.warn`failed to generate AI layout hints: ${error}`
    return null
  }
}

type ParsedResponse = NonNullable<ReturnType<typeof parseResponse>>

/**
 * Restore original NodeIds and EdgeIds in the parsed response using the mapping from serialization.
 * Filters out any hints that reference nodes/edges not present in the original view.
 */
function restoreIdsAndMapToHints(params: {
  parsed: ParsedResponse
  view: ComputedView
  mapping: ReturnType<typeof serializeViewForPrompt>['mapping']
}): LayoutHints {
  const { parsed, mapping, view } = params
  const nodeId = (id: string & z.$brand<'NodeId'>) => mapping.nodes[id] ?? null
  const mapToNodeId = (ids: (string & z.$brand<'NodeId'>)[]) => ids.map(nodeId).filter(isNonNull)

  const edgeId = (id: string & z.$brand<'EdgeId'>) => mapping.edges[id] ?? null

  const sources = mapToNodeId(parsed.sources)
  const sinks = mapToNodeId(parsed.sinks)

  const edges = pipe(
    parsed.edges,
    flatMap(edge => {
      const id = edgeId(edge.id)
      return id ? { ...edge, id } : []
    }),
  )

  if (parsed.enforcements.length === 0) {
    return exact({
      ...parsed,
      enforcements: [],
      edges,
      sources,
      sinks,
    })
  }

  const edgeKey = (e: { source: string; target: string }) => `${e.source}->${e.target}`
  const existing = new Set(view.edges.map(edgeKey))

  const enforcements = pipe(
    parsed.enforcements,
    flatMap(({ id, ...enforcement }) => {
      const [sourceId, targetId] = id.split('->')
      if (!sourceId || !targetId) {
        return []
      }
      const source = nodeId(sourceId as string & z.$brand<'NodeId'>)
      const target = nodeId(targetId as string & z.$brand<'NodeId'>)
      if (source && target) {
        return {
          ...enforcement,
          source,
          target,
        }
      }
      return []
    }),
    // Filter out enforcements, if there are already edges between the nodes
    filter(enforcement => !existing.has(edgeKey(enforcement))),
  )
  return exact({
    ...parsed,
    enforcements,
    edges,
    sources,
    sinks,
  })
}
