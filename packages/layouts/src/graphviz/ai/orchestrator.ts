import type { ComputedView } from '@likec4/core/types'
import { logger } from './logger'
import { LAYOUT_SYSTEM_PROMPT } from './prompt-system.generated'
import type { AILayoutProvider } from './provider'
import { parseResponse } from './response'
import { serializeViewForPrompt } from './serializeView'
import type { AISuggestedLayoutHints } from './types'

const prompts = {
  systemPrompt: LAYOUT_SYSTEM_PROMPT,
  userPrompt: `Analyze this diagram and suggest layout improvements if any`,
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
): Promise<AISuggestedLayoutHints | null> {
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

    return parseResponse(rawResponse, { mapping, view })
  } catch (error) {
    console.timeEnd(label)
    logger.warn`failed to generate AI layout hints: ${error}`
    return null
  }
}
